'use server';

import 'server-only';
import { revalidatePath } from "next/cache";
import {
    introPlanningSchema,
    type IntroPlanningItem
} from '@salvemundi/validations/schema/intro.zod';
import { getIntroPlanningInternal } from '@/server/queries/admin-intro.queries';
import { getSystemDirectus } from "@/lib/directus";
import { updateItem, createItem } from '@directus/sdk';
import { checkIntroAdminAccess, genericDelete } from './intro-signup.actions';
import { safeConsoleError } from '@/server/utils/logger';

export async function getIntroPlanning(): Promise<IntroPlanningItem[]> {
    await checkIntroAdminAccess();
    const data = await getIntroPlanningInternal();
    return data as unknown as IntroPlanningItem[];
}

export async function upsertIntroPlanning(item: Partial<IntroPlanningItem>): Promise<{ success: boolean; data?: IntroPlanningItem; error?: string; fieldErrors?: Record<string, string[] | undefined> }> {
    await checkIntroAdminAccess();

    const sanitized = Object.fromEntries(
        Object.entries(item).map(([k, v]) => [k, v === null ? undefined : v])
    );

    const validated = introPlanningSchema.safeParse(sanitized);
    if (!validated.success) {
        const fieldErrors = validated.error.flatten().fieldErrors;
        return {
            success: false,
            error: `Validatie mislukt: ${Object.keys(fieldErrors).join(', ')}`,
            fieldErrors
        };
    }

    const { id, date, ...rest } = validated.data;

    let day = rest.day;
    if (date) {
        try {
            const d = new Date(date);
            if (!isNaN(d.getTime())) {
                day = d.toLocaleDateString('nl-NL', { weekday: 'long' });
            }
        } catch (error) {
            safeConsoleError('Error calculating day:', error);
        }
    }

    if (!day && date) {
        day = 'Onbekend';
    }

    const payload = { ...rest, date, day };

    try {
        let result;
        if (id) {
            result = await getSystemDirectus().request(updateItem('intro_planning', id, payload));
        } else {
            result = await getSystemDirectus().request(createItem('intro_planning', payload));
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
                location: result.location
            }
        };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Onbekende fout';
        safeConsoleError('[AdminIntro] Failed to upsert planning:', error);
        return { success: false, error: `Opslaan mislukt: ${message}` };
    }
}

export async function deleteIntroPlanning(id: number): Promise<{ success: boolean; error?: string }> {
    await checkIntroAdminAccess();
    return genericDelete('intro_planning', id);
}
