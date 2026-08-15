'use server';

import { z } from 'zod';

import 'server-only';
import { revalidatePath } from "next/cache";
import {
    introConfidantSchema,
    type IntroConfidant
} from '@salvemundi/validations/schema/intro.zod';
import { getIntroConfidantsInternal } from '@/server/queries/intro/admin-intro.queries';
import { db, schema } from '@salvemundi/db';
import { eq } from 'drizzle-orm';
import { checkIntroAdminAccess } from './admin-intro-signup.actions';
import { safeConsoleError } from '@/server/utils/logger';
import { uploadToDirectus } from '@/server/utils/media';

export async function getIntroConfidants(): Promise<IntroConfidant[]> {
    await checkIntroAdminAccess();
    return getIntroConfidantsInternal();
}

export async function uploadIntroConfidantImage(formData: FormData): Promise<{ success: true; data: string } | { success: false; error: string }> {
    await checkIntroAdminAccess();

    const file = formData.get('image') as File | null;
    if (!file) return { success: false, error: 'Geen bestand gevonden in upload.' };

    try {
        const uploadResult = await uploadToDirectus(file);
        if (!uploadResult.success) {
            return { success: false, error: uploadResult.error };
        }
        if (!uploadResult.id) {
            return { success: false, error: 'Afbeelding uploaden mislukt op de server (geen ID teruggekregen).' };
        }
        return { success: true, data: uploadResult.id };
    } catch (error: unknown) {
        safeConsoleError('[admin-intro-confidants.actions.ts][uploadIntroConfidantImage] Failed to upload image:', error);
        return { success: false, error: 'Afbeelding uploaden mislukt op de server.' };
    }
}

export async function upsertIntroConfidant(item: Partial<IntroConfidant>): Promise<{ success: boolean; data?: IntroConfidant; error?: string; fieldErrors?: Record<string, string[] | undefined> }> {
    await checkIntroAdminAccess();

    const sanitized = Object.fromEntries(
        Object.entries(item).map(([key, value]) => [key, (value as unknown) === '' ? undefined : value])
    );

    const validated = introConfidantSchema.safeParse(sanitized);
    if (!validated.success) {
        const fieldErrors = z.flattenError(validated.error).fieldErrors;
        return {
            success: false,
            error: `Validatie mislukt: ${Object.keys(fieldErrors).join(', ')}`,
            fieldErrors
        };
    }

    const { id, ...rest } = validated.data;

    try {
        let result: typeof schema.intro_confidants.$inferSelect;
        if (id) {
            const updated = await db.update(schema.intro_confidants).set(rest).where(eq(schema.intro_confidants.id, id)).returning();
            result = updated[0];
        } else {
            const inserted = await db.insert(schema.intro_confidants).values(rest).returning();
            result = inserted[0];
        }
        revalidatePath('/beheer/intro');
        revalidatePath('/intro/qr-code');
        return {
            success: true,
            data: {
                id: Number(result.id),
                name: result.name || '',
                email: result.email || null,
                phone_number: result.phone_number || null,
                image: result.image || null,
                bio: result.bio || null,
                sort_order: result.sort_order ?? 0,
                is_active: result.is_active ?? true
            }
        };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Onbekende fout';
        safeConsoleError('[admin-intro-confidants.actions.ts][upsertIntroConfidant] Failed to upsert confidant:', error);
        return { success: false, error: `Opslaan mislukt: ${message}` };
    }
}

export async function deleteIntroConfidant(id: number): Promise<{ success: boolean; error?: string }> {
    await checkIntroAdminAccess();
    try {
        await db.delete(schema.intro_confidants).where(eq(schema.intro_confidants.id, id));
        revalidatePath('/beheer/intro');
        revalidatePath('/intro/qr-code');
        return { success: true };
    } catch {
        return { success: false, error: 'Verwijderen mislukt' };
    }
}
