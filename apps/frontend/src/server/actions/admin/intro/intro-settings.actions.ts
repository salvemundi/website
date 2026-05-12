'use server';

import 'server-only';
import { revalidateTag, revalidatePath } from "next/cache";
import { getRedis } from '@/server/auth/redis-client';
import { FLAGS_CACHE_KEY } from '@/lib/config/feature-flags';
import { query } from '@/lib/database';
import { checkIntroAdminAccess } from './intro-signup.actions';

export async function toggleIntroVisibility(): Promise<{ success: boolean; show?: boolean; error?: string }> {
    await checkIntroAdminAccess();
    const route = '/intro';

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
                ['Intro Inschrijving', route, newStatus]);
        }

        try {
            const redis = await getRedis();
            await redis.del(FLAGS_CACHE_KEY);
        } catch { }

        await new Promise(resolve => setTimeout(resolve, 1000));

        revalidateTag('feature_flags', 'max');
        revalidatePath('/', 'layout');
        revalidatePath('/beheer/intro');

        try {
            const redis = await getRedis();
            await redis.del(FLAGS_CACHE_KEY);
        } catch { }

        return { success: true, show: newStatus };
    } catch {
        return { success: false, error: 'Bijwerken mislukt' };
    }
}
