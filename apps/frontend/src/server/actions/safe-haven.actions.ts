'use server';

import { safeHavensSchema, type SafeHaven } from '@salvemundi/validations';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';

import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { SAFE_HAVEN_FIELDS } from '@salvemundi/validations';

async function fetchSafeHavensFromDirectus(): Promise<SafeHaven[]> {
    try {
        const rawData = await getSystemDirectus().request(readItems('safe_havens', {
            fields: [...SAFE_HAVEN_FIELDS],
            limit: 10
        }));

        const mappedData = (rawData as any[]).map((item) => ({
            id: item.id,
            naam: item.contact_name,
            email: item.email,
            telefoon: item.phone_number,
            afbeelding_id: item.image,
            status: 'published',
            sort: item.sort ?? 0,
        }));

        const parsed = safeHavensSchema.safeParse(mappedData);
        if (!parsed.success) {
            console.error('[safe-haven.actions#fetchSafeHavensFromDirectus] Zod validatie mislukt:', {
                fieldErrors: parsed.error.flatten().fieldErrors,
            });
            return [];
        }

        return parsed.data;
    } catch (err: unknown) {
        console.error('[safe-haven.actions#fetchSafeHavensFromDirectus] Fetch mislukt:', err);
        return [];
    }
}

export async function getSafeHavens(): Promise<SafeHaven[]> {
    const session = await auth.api.getSession({ headers: await headers() });
    const isAuthenticated = !!session?.user;
    const allHavens = await fetchSafeHavensFromDirectus();

    return allHavens.map((haven) => ({
        ...haven,
        email: isAuthenticated ? haven.email : null,
        telefoon: isAuthenticated ? haven.telefoon : null,
    }));
}
