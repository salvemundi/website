'use server';

import { safeHavensSchema, type SafeHaven } from '@salvemundi/validations/schema/safe-havens.zod';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { db, schema } from '@salvemundi/db';
import { safeConsoleError } from '@/server/utils/logger';

async function fetchSafeHavensFromDirectus(isAuthenticated: boolean): Promise<SafeHaven[]> {
    try {
        const rows = isAuthenticated
            ? await db.select({
                id: schema.safe_havens.id,
                contact_name: schema.safe_havens.contact_name,
                email: schema.safe_havens.email,
                phone_number: schema.safe_havens.phone_number,
                image: schema.safe_havens.image
            }).from(schema.safe_havens).limit(10)
            : await db.select({
                id: schema.safe_havens.id,
                contact_name: schema.safe_havens.contact_name,
                image: schema.safe_havens.image
            }).from(schema.safe_havens).limit(10);

        const mappedData = rows.map((item) => ({
            id: String(item.id),
            contact_name: item.contact_name,
            email: ('email' in item ? item.email : null) ?? null,
            phone_number: ('phone_number' in item ? item.phone_number : null) ?? null,
            image: item.image
        }));

        const parsed = safeHavensSchema.safeParse(mappedData);
        if (!parsed.success) {
            safeConsoleError('[safe-haven.actions.ts][fetchSafeHavensFromDirectus] Validation failed:', parsed.error);
            return [];
        }

        return parsed.data;
    } catch (error: unknown) {
        safeConsoleError('[safe-haven.actions.ts][fetchSafeHavensFromDirectus] Failed to fetch safe havens:', error);
        throw new Error('Kon Safe Havens niet ophalen');
    }
}

export async function getSafeHavens(): Promise<SafeHaven[]> {
    const session = await getEnrichedSession();
    const isAuthenticated = !!session?.user;
    return fetchSafeHavensFromDirectus(isAuthenticated);
}