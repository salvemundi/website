'use server';

import 'server-only';
import { revalidateTag, revalidatePath, unstable_noStore as noStore } from 'next/cache';
import { getRedis } from '@/server/auth/redis-client';
import { FLAGS_CACHE_KEY } from '@/lib/config/feature-flags';
import { query } from '@/lib/database';
import { requireKroegAdmin } from './kroegentocht-event.actions';

export async function toggleKroegentochtVisibility(): Promise<{ success: boolean; show?: boolean; error?: string }> {
    await requireKroegAdmin();
    const route = '/kroegentocht';

    try {
        const sql = 'SELECT id, is_active FROM feature_flags WHERE route_match = $1 LIMIT 1';
        const { rows } = await query(sql, [route]);

        const flag = rows?.[0];
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
        } catch (_error) { }

        await new Promise(resolve => setTimeout(resolve, 1000));

        revalidateTag('feature_flags', 'max');
        revalidatePath('/', 'layout');

        try {
            const redis = await getRedis();
            await redis.del(FLAGS_CACHE_KEY);
        } catch (_error) { }

        return { success: true, show: newStatus };
    } catch {
        return { success: false, error: 'Bijwerken mislukt' };
    }
}

export async function getKroegentochtSettings() {
    noStore();
    await requireKroegAdmin();
    try {
        const { rows } = await query('SELECT is_active FROM feature_flags WHERE route_match = $1 LIMIT 1', ['/kroegentocht']);
        const isVisible = rows && rows.length > 0 ? !!rows[0].is_active : true;
        return { show: isVisible };
    } catch (_error) {
        return { show: true };
    }
}
