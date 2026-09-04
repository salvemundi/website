'use server';

import { clubsSchema, type Club } from '@salvemundi/validations/schema/clubs.zod';
import { db } from '@/lib/database/db';
import { safeConsoleError } from '@/server/utils/logger';

export async function getClubs(): Promise<Club[]> {
    try {
        const rows = await db.query.clubs.findMany({
            orderBy: (clubs, { asc }) => asc(clubs.name),
        });

        const parsed = clubsSchema.safeParse(rows);

        if (!parsed.success) {
            safeConsoleError('[clubs.actions.ts][getClubs] Schema validation failed:', parsed.error.format());
            return [];
        }

        return parsed.data;
    } catch (error: unknown) {
        safeConsoleError('[clubs.actions.ts][getClubs] Failed to fetch clubs:', error);
        return [];
    }
}
