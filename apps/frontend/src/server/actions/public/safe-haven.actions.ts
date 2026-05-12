'use server';

import { safeHavensSchema, type SafeHaven } from '@salvemundi/validations/schema/safe-havens.zod';
import { getEnrichedSession } from '@/server/auth/auth-utils';

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
            beschrijving: null,
            email: item.email || null,
            telefoon: item.phone_number || null,
            afbeelding_id: item.image,
            status: 'published' as const,
            sort: 0
        }));

        const parsed = safeHavensSchema.safeParse(mappedData);
        if (!parsed.success) {
            throw new Error(`Safe Haven parsing error: ${parsed.error.message}`);
        }

        return parsed.data;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Onbekende DB fout';
        console.error('[Safe Haven Action] Error:', message);
        throw new Error('Kon Safe Havens niet ophalen');
    }
}

export async function getSafeHavens(): Promise<SafeHaven[]> {
    const session = await getEnrichedSession();
    const isAuthenticated = !!session?.user;
    return fetchSafeHavensFromDirectus(isAuthenticated);
}
