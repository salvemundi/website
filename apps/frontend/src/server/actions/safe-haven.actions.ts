'use server';

import { safeHavensSchema, type SafeHaven } from '@salvemundi/validations/schema/safe-havens.zod';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';

import { query } from '@/lib/database';

async function fetchSafeHavensFromDirectus(): Promise<SafeHaven[]> {
    try {
        const { rows } = await query(
            'SELECT id, contact_name, email, phone_number, image, sort FROM safe_havens LIMIT 10',
            []
        );

        const mappedData = (rows || []).map((item) => ({
            id: item.id,
            naam: item.contact_name,
            email: item.email,
            telefoon: item.phone_number,
            afbeelding_id: item.image,
            status: 'published' as const,
            sort: item.sort ?? 0,
        }));

        const parsed = safeHavensSchema.safeParse(mappedData);
        if (!parsed.success) {
            return [];
        }

        return parsed.data;
    } catch (err: unknown) {
        
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
