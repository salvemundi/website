'use server';

import { z } from 'zod';

import 'server-only';
import { revalidatePath } from "next/cache";
import {
    introPlanningSchema,
    type IntroPlanningItem
} from '@salvemundi/validations/schema/intro.zod';
import { getIntroPlanningInternal } from '@/server/queries/admin-intro.queries';
import { db, schema } from '@salvemundi/db';
import { eq } from 'drizzle-orm';
import { checkIntroAdminAccess } from './intro-signup.actions';
import { safeConsoleError } from '@/server/utils/logger';

interface IntroPlanningDbResult {
    id: number | string;
    date?: string | null;
    time_start?: string | null;
    title?: string | null;
    description?: string | null;
    day?: string | null;
    location?: string | null;
}

export async function getIntroPlanning(): Promise<IntroPlanningItem[]> {
    await checkIntroAdminAccess();
    const data = await getIntroPlanningInternal();
    return data as unknown as IntroPlanningItem[];
}

export async function upsertIntroPlanning(item: Partial<IntroPlanningItem>): Promise<{ success: boolean; data?: IntroPlanningItem; error?: string; fieldErrors?: Record<string, string[] | undefined> }> {
    await checkIntroAdminAccess();

    const sanitized = Object.fromEntries(
        Object.entries(item).map(([key, value]) => [key, (value as unknown) === null ? undefined : value])
    );

    const validated = introPlanningSchema.safeParse(sanitized);
    if (!validated.success) {
        const fieldErrors = z.flattenError(validated.error).fieldErrors;
        return {
            success: false,
            error: `Validatie mislukt: ${Object.keys(fieldErrors).join(', ')}`,
            fieldErrors
        };
    }

    const { id, date, ...rest } = validated.data;

    let day = rest.day || 'Onbekend';
    if (date) {
        try {
            const d = new Date(date);
            if (!isNaN(d.getTime())) {
                day = d.toLocaleDateString('nl-NL', { weekday: 'long' });
            }
        } catch (error) {
            safeConsoleError('[intro-planning.actions.ts][upsertIntroPlanning] Error calculating day:', error);
        }
    }

    const payload = { ...rest, date, day };

    try {
        let result: IntroPlanningDbResult;
        if (id) {
            const updated = await db.update(schema.intro_planning).set(payload).where(eq(schema.intro_planning.id, id)).returning();
            result = updated[0] as unknown as IntroPlanningDbResult;
        } else {
            const inserted = await db.insert(schema.intro_planning).values(payload).returning();
            result = inserted[0] as unknown as IntroPlanningDbResult;
        }
        revalidatePath('/beheer/intro');
        return {
            success: true, data: {
                id: Number(result.id),
                date: result.date || '',
                time_start: result.time_start || '',
                title: result.title || '',
                description: result.description || '',
                day: result.day || '',
                location: result.location || null
            } as IntroPlanningItem
        };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Onbekende fout';
        safeConsoleError('[intro-planning.actions.ts][upsertIntroPlanning] Failed to upsert planning:', error);
        return { success: false, error: `Opslaan mislukt: ${message}` };
    }
}

export async function deleteIntroPlanning(id: number): Promise<{ success: boolean; error?: string }> {
    await checkIntroAdminAccess();
    try {
        await db.delete(schema.intro_planning).where(eq(schema.intro_planning.id, id));
        revalidatePath('/beheer/intro');
        return { success: true };
    } catch {
        return { success: false, error: 'Verwijderen mislukt' };
    }
}
