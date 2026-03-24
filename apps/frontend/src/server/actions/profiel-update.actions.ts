'use server';

import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { updateProfileSchema } from '@salvemundi/validations';


import { getSystemDirectus } from '@/lib/directus';
import { updateUser } from '@directus/sdk';
import { getRedis } from '@/server/auth/redis-client';
import { cookies } from 'next/headers';
import { triggerUserSyncAction } from './azure-sync.actions';

export async function updateUserProfile(data: z.infer<typeof updateProfileSchema>) {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;

    if (!user?.id) {
        return { success: false, error: 'Not authenticated' };
    }

    const { rateLimit } = await import('../utils/ratelimit');
    const { success } = await rateLimit('profile-update', 10, 300);
    if (!success) {
        return { success: false, error: 'Te veel wijzigingen. Probeer het over 5 minuten opnieuw.' };
    }

    const parsed = updateProfileSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: 'Ongeldige data' };
    }

    const AZURE_MGMT_URL = process.env.AZURE_MANAGEMENT_SERVICE_URL;
    const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();

    try {
        // Step 1: Handle Phone Number update in Azure AD if changed
        if (parsed.data.phone_number && (user as any).entra_id) {
            try {
                const azureRes = await fetch(`${AZURE_MGMT_URL}/api/users/${(user as any).entra_id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${INTERNAL_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ phoneNumber: parsed.data.phone_number })
                });

                if (!azureRes.ok) {
                    console.error("[updateUserProfile] Azure update failed:", await azureRes.text());
                    // We continue anyway to update Directus, but log the error
                }
            } catch (azureErr) {
                console.error("[updateUserProfile] Azure connection error:", azureErr);
            }
        }

        // Step 2: Update Directus
        await getSystemDirectus().request(updateUser(user.id, parsed.data));

        // Invalidate Redis session cache for this user
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('better-auth.session-token')?.value;
        if (sessionToken) {
            const redis = await getRedis();
            await redis.del(`session:${sessionToken}`);
        }

        // Step 4: Trigger a targeted sync to ensure everything is matched up
        // We use entra_id because the sync service expects the Microsoft ID for targeted runs
        const entraId = (user as any).entra_id;
        if (parsed.data.phone_number && entraId) {
            await triggerUserSyncAction(entraId).catch(e => console.error("[updateUserProfile] Post-update sync trigger failed:", e));
        }

        revalidatePath('/profiel');
        return { success: true };
    } catch (err) {
        console.error('[profiel.actions#updateUserProfile] Error:', err);
        return { success: false, error: 'Bijwerken mislukt' };
    }
}

