'use server';

import 'server-only';
import { revalidateTag, revalidatePath } from "next/cache";
import { getRedis } from '@/server/auth/redis-client';
import { FLAGS_CACHE_KEY } from '@/lib/config/feature-flags';
import { db, schema } from '@salvemundi/db';
import { asc, eq } from 'drizzle-orm';
import { checkIntroAdminAccess } from './admin-intro-signup.actions';
import { safeConsoleError } from '@/server/utils/logger';
import { uploadToDirectus, uploadDocumentToDirectus } from '@/server/utils/media';
import { getIntroPlanningImageInternal, getIntroInfoBookletInternal, getIntroQrScanCountInternal } from '@/server/queries/intro/admin-intro.queries';

export async function toggleIntroVisibility(): Promise<{ success: boolean; show?: boolean; error?: string }> {
    await checkIntroAdminAccess();
    const route = '/intro';

    try {
        const rows = await db.select({
            id: schema.feature_flags.id,
            is_active: schema.feature_flags.is_active
        }).from(schema.feature_flags)
        .where(eq(schema.feature_flags.route_match, route))
        .limit(1);

        const oldStatus = rows.length > 0 ? !!rows[0].is_active : true;
        const newStatus = !oldStatus;

        if (rows.length > 0) {
            await db.update(schema.feature_flags).set({ is_active: newStatus }).where(eq(schema.feature_flags.id, rows[0].id));
        } else {
            await db.insert(schema.feature_flags).values({
                name: 'Intro Inschrijving',
                route_match: route,
                is_active: newStatus
            });
        }

        try {
            const redis = await getRedis();
            await redis.del(FLAGS_CACHE_KEY);
        } catch (error) {
            safeConsoleError(`[intro-settings.actions.ts][toggleIntroVisibility] Failed to delete feature flag cache:`, error);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        revalidateTag('feature_flags', 'max');
        revalidatePath('/', 'layout');
        revalidatePath('/beheer/intro');

        try {
            const redis = await getRedis();
            await redis.del(FLAGS_CACHE_KEY);
        } catch (error) {
            safeConsoleError(`[intro-settings.actions.ts][toggleIntroVisibility] Failed to delete feature flag cache:`, error);
        }

        return { success: true, show: newStatus };
    } catch (error) {
        safeConsoleError(`[intro-settings.actions.ts][toggleIntroVisibility] Failed to toggle intro visibility:`, error);
        return { success: false, error: 'Bijwerken mislukt' };
    }
}

export async function getIntroPlanningImage(): Promise<string | null> {
    await checkIntroAdminAccess();
    return getIntroPlanningImageInternal();
}

async function setIntroSettingsField(field: 'planning_image' | 'info_booklet', value: string | null): Promise<void> {
    const rows = await db
        .select({ id: schema.intro_settings.id })
        .from(schema.intro_settings)
        .orderBy(asc(schema.intro_settings.id))
        .limit(1);

    if (rows.length > 0) {
        await db.update(schema.intro_settings).set({ [field]: value, updated_at: new Date().toISOString() }).where(eq(schema.intro_settings.id, rows[0].id));
    } else {
        await db.insert(schema.intro_settings).values({ [field]: value });
    }

    revalidatePath('/beheer/intro');
    revalidatePath('/qr-code');
}

export async function uploadIntroPlanningImage(formData: FormData): Promise<{ success: true; data: string } | { success: false; error: string }> {
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
        await setIntroSettingsField('planning_image', uploadResult.id);
        return { success: true, data: uploadResult.id };
    } catch (error: unknown) {
        safeConsoleError('[admin-intro-settings.actions.ts][uploadIntroPlanningImage] Failed to upload image:', error);
        return { success: false, error: 'Afbeelding uploaden mislukt op de server.' };
    }
}

export async function removeIntroPlanningImage(): Promise<{ success: boolean; error?: string }> {
    await checkIntroAdminAccess();
    try {
        await setIntroSettingsField('planning_image', null);
        return { success: true };
    } catch (error: unknown) {
        safeConsoleError('[admin-intro-settings.actions.ts][removeIntroPlanningImage] Failed to remove image:', error);
        return { success: false, error: 'Verwijderen mislukt' };
    }
}

export async function getIntroInfoBooklet(): Promise<string | null> {
    await checkIntroAdminAccess();
    return getIntroInfoBookletInternal();
}

export async function uploadIntroInfoBooklet(formData: FormData): Promise<{ success: true; data: string } | { success: false; error: string }> {
    await checkIntroAdminAccess();

    const file = formData.get('document') as File | null;
    if (!file) return { success: false, error: 'Geen bestand gevonden in upload.' };

    try {
        const uploadResult = await uploadDocumentToDirectus(file);
        if (!uploadResult.success) {
            return { success: false, error: uploadResult.error };
        }
        if (!uploadResult.id) {
            return { success: false, error: 'Bestand uploaden mislukt op de server (geen ID teruggekregen).' };
        }
        await setIntroSettingsField('info_booklet', uploadResult.id);
        return { success: true, data: uploadResult.id };
    } catch (error: unknown) {
        safeConsoleError('[admin-intro-settings.actions.ts][uploadIntroInfoBooklet] Failed to upload document:', error);
        return { success: false, error: 'Bestand uploaden mislukt op de server.' };
    }
}

export async function removeIntroInfoBooklet(): Promise<{ success: boolean; error?: string }> {
    await checkIntroAdminAccess();
    try {
        await setIntroSettingsField('info_booklet', null);
        return { success: true };
    } catch (error: unknown) {
        safeConsoleError('[admin-intro-settings.actions.ts][removeIntroInfoBooklet] Failed to remove document:', error);
        return { success: false, error: 'Verwijderen mislukt' };
    }
}

export async function getIntroQrScanCount(): Promise<number> {
    await checkIntroAdminAccess();
    return getIntroQrScanCountInternal();
}
