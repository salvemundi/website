'use server';

import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { updateProfileSchema } from '@salvemundi/validations/schema/profiel.zod';


import { getSystemDirectus } from '@/lib/directus';
import { updateUser } from '@directus/sdk';
import { getRedis } from '@/server/auth/redis-client';
import { cookies } from 'next/headers';
import { triggerUserSyncAction } from './azure-sync/sync-tasks.actions';

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
        const entraId = (user as any).entra_id;
        
        // Phase 1: Entra ID (Phone Number) - THE SOURCE OF TRUTH
        if (parsed.data.phone_number && entraId) {
            const azureRes = await fetch(`${AZURE_MGMT_URL}/api/users/${entraId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${INTERNAL_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phoneNumber: parsed.data.phone_number })
            });

            if (!azureRes.ok) {
                const errorData = await azureRes.json().catch(() => ({}));
                return { 
                    success: false, 
                    error: `Azure AD update mislukt: ${errorData.details || 'Ongeldig telefoonnummer of service onbeschikbaar.'}` 
                };
            }
            
            // Directus update via Sync task (Azure -> Directus)
            await triggerUserSyncAction(entraId).catch(() => {});
        }

        // Phase 2: Directus Only Fields (Minecraft)
        const directusOnlyData: any = {};
        if (parsed.data.minecraft_username !== undefined) {
            directusOnlyData.minecraft_username = parsed.data.minecraft_username;
        }

        if (Object.keys(directusOnlyData).length > 0) {
            await getSystemDirectus().request(updateUser(user.id, directusOnlyData));
        }

        // Clear session cache in Redis
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('better-auth.session-token')?.value || 
                           cookieStore.get('__Secure-better-auth.session-token')?.value;
                           
        if (sessionToken) {
            const redis = await getRedis();
            await redis.del(`session:${sessionToken}`);
        }

        revalidatePath('/profiel');
        revalidatePath('/profiel', 'page');
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (err) {
        
        return { success: false, error: 'Bijwerken mislukt door een onbekende systeemfout.' };
    }
}

