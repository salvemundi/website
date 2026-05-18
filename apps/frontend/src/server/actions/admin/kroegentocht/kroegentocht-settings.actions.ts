'use server';

import 'server-only';
import { revalidateTag, revalidatePath, unstable_noStore as noStore } from 'next/cache';
import { getRedis } from '@/server/auth/redis-client';
import { FLAGS_CACHE_KEY } from '@/lib/config/feature-flags';
import { query } from '@/lib/database';
import { requireKroegAdmin } from './kroegentocht-event.actions';
import { safeConsoleError } from '@/server/utils/logger';

interface DbFeatureFlag {
    id: number;
    name: string;
    is_active: boolean;
    route_match: string;
}

export async function toggleKroegentochtVisibility(): Promise<{ success: boolean; show?: boolean; error?: string }> {
    await requireKroegAdmin();
    const route = '/kroegentocht';

    try {
        const sql = 'SELECT id, is_active FROM feature_flags WHERE route_match = $1 LIMIT 1';
        const { rows } = await query(sql, [route]);

        const flag = rows[0] as DbFeatureFlag | undefined;
        const oldStatus = flag ? !!flag.is_active : true;
        const newStatus = !oldStatus;

        if (flag) {
            await query('UPDATE feature_flags SET is_active = $1 WHERE id = $2', [newStatus, flag.id]);
        } else {
            await query('INSERT INTO feature_flags (name, route_match, is_active) VALUES ($1, $2, $3)',
                ['Kroegentocht Inschrijving', route, newStatus]);
        }

        try {
            const redis = await getRedis();
            await redis.del(FLAGS_CACHE_KEY);
        } catch (error) {
            safeConsoleError(`[Kroegentocht-Action][toggleKroegentochtVisibility] Failed to delete feature flag cache:`, error);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        revalidateTag('feature_flags', 'max');
        revalidatePath('/', 'layout');

        try {
            const redis = await getRedis();
            await redis.del(FLAGS_CACHE_KEY);
        } catch (error) {
            safeConsoleError(`[Kroegentocht-Action][toggleKroegentochtVisibility] Failed to delete feature flag cache:`, error);
        }

        return { success: true, show: newStatus };
    } catch (error) {
        safeConsoleError(`[Kroegentocht-Action][toggleKroegentochtVisibility] Failed to toggle visibility:`, error);
        return { success: false, error: 'Bijwerken mislukt' };
    }
}

export async function getKroegentochtSettings() {
    noStore();
    await requireKroegAdmin();
    try {
        const { rows } = await query<DbFeatureFlag>('SELECT is_active FROM feature_flags WHERE route_match = $1 LIMIT 1', ['/kroegentocht']);
        const isVisible = rows.length > 0 ? !!rows[0].is_active : true;
        return { show: isVisible };
    } catch (error) {
        safeConsoleError(`[Kroegentocht-Action][getKroegentochtSettings] Failed to fetch settings:`, error);
        return { show: true };
    }
}
