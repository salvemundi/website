'use server';

import { safeHavensSchema, type SafeHaven } from '@salvemundi/validations/schema/safe-havens.zod';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';

import { query } from '@/lib/database';

async function fetchSafeHavensFromDirectus(isAuthenticated: boolean): Promise<SafeHaven[]> {
    try {
        const queryText = isAuthenticated
            ? 'SELECT id, contact_name, email, phone_number, image FROM safe_havens LIMIT 10'
            : 'SELECT id, contact_name, image FROM safe_havens LIMIT 10';

        const { rows } = await query(queryText, []);

        const mappedData = (rows || []).map((item) => ({
            id: item.id,
            naam: item.contact_name,
            email: item.email || null,
            telefoon: item.phone_number || null,
            afbeelding_id: item.image,
            status: 'published' as const,
            sort: 0,
        }));

        const parsed = safeHavensSchema.safeParse(mappedData);
        if (!parsed.success) {
            console.error('Safe Haven parsing error:', parsed.error);
            return [];
        }

        return parsed.data;
    } catch (err: unknown) {
        console.error('Safe Haven DB error:', err);
        return [];
    }
}

export async function getSafeHavens(): Promise<SafeHaven[]> {
    const session = await auth.api.getSession({ headers: await headers() });
    const isAuthenticated = !!session?.user;
    return fetchSafeHavensFromDirectus(isAuthenticated);
}
