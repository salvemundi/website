'use server';

import 'server-only';
import { revalidateTag, revalidatePath, unstable_noStore as noStore } from 'next/cache';
import { getRedis } from '@/server/auth/redis-client';
import { FLAGS_CACHE_KEY } from '@/lib/config/feature-flags';
import { db, schema } from '@salvemundi/db';
import { eq } from 'drizzle-orm';
import { requireKroegAdmin } from './admin-kroegentocht-event.actions';
import { safeConsoleError } from '@/server/utils/logger';

export async function toggleKroegentochtVisibility(): Promise<{ success: boolean; show?: boolean; error?: string }> {
    await requireKroegAdmin();
    const route = '/kroegentocht';

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
                name: 'Kroegentocht Inschrijving',
                route_match: route,
                is_active: newStatus
            });
        }

        try {
            const redis = await getRedis();
            await redis.del(FLAGS_CACHE_KEY);
        } catch (error) {
            safeConsoleError(`[kroegentocht-settings.actions.ts][toggleKroegentochtVisibility] Failed to delete feature flag cache:`, error);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        revalidateTag('feature_flags', 'max');
        revalidatePath('/', 'layout');

        try {
            const redis = await getRedis();
            await redis.del(FLAGS_CACHE_KEY);
        } catch (error) {
            safeConsoleError(`[kroegentocht-settings.actions.ts][toggleKroegentochtVisibility] Failed to delete feature flag cache:`, error);
        }

        return { success: true, show: newStatus };
    } catch (error) {
        safeConsoleError(`[kroegentocht-settings.actions.ts][toggleKroegentochtVisibility] Failed to toggle visibility:`, error);
        return { success: false, error: 'Bijwerken mislukt' };
    }
}

export async function getKroegentochtSettings() {
    noStore();
    await requireKroegAdmin();
    try {
        const rows = await db.select({
            is_active: schema.feature_flags.is_active
        }).from(schema.feature_flags)
        .where(eq(schema.feature_flags.route_match, '/kroegentocht'))
        .limit(1);

        const isVisible = rows.length > 0 ? !!rows[0].is_active : true;
        return { show: isVisible };
    } catch (error) {
        safeConsoleError(`[kroegentocht-settings.actions.ts][getKroegentochtSettings] Failed to fetch settings:`, error);
        return { show: true };
    }
}
