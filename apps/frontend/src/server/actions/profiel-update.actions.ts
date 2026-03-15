'use server';

import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { updateProfileSchema } from '@salvemundi/validations';


export async function updateUserProfile(data: z.infer<typeof updateProfileSchema>) {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;

    if (!user?.id) {
        return { success: false, error: 'Not authenticated' };
    }

    const parsed = updateProfileSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: 'Ongeldige data' };
    }

    const directusUrl = process.env.INTERNAL_DIRECTUS_URL || 'http://v7-core-directus:8055';
    const token = process.env.DIRECTUS_STATIC_TOKEN;

    if (!token) {
        console.error('[profiel.actions#updateUserProfile] DIRECTUS_STATIC_TOKEN missing');
        return { success: false, error: 'Server configuratie fout' };
    }

    try {
        const res = await fetch(`${directusUrl}/users/${user.id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(parsed.data),
        });

        if (!res.ok) {
            console.error('[profiel.actions#updateUserProfile] Update failed:', res.statusText);
            await res.text();
            return { success: false, error: 'Opslaan mislukt in Directus' };
        }

        revalidatePath('/profiel');
        return { success: true };
    } catch (err) {
        console.error('[profiel.actions#updateUserProfile] Error:', err);
        return { success: false, error: 'Netwerkfout' };
    }
}
