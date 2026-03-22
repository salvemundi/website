'use server';

import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { updateProfileSchema } from '@salvemundi/validations';


import { getUserDirectus } from '@/lib/directus';
import { updateUser } from '@directus/sdk';

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

    try {
        await getUserDirectus((session as any).session?.token).request(updateUser(user.id, parsed.data));

        revalidatePath('/profiel');
        return { success: true };
    } catch (err) {
        console.error('[profiel.actions#updateUserProfile] Error:', err);
        return { success: false, error: 'Bijwerken mislukt' };
    }
}

