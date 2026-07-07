'use server';

import 'server-only';
import { revalidateTag, revalidatePath } from "next/cache";
import { getRedis } from '@/server/auth/redis-client';
import { FLAGS_CACHE_KEY } from '@/lib/config/feature-flags';
import { db, schema } from '@salvemundi/db';
import { eq } from 'drizzle-orm';
import { safeConsoleError } from '@/server/utils/logger';
import { requireAdminResource } from '@/server/auth/auth-utils';
import { AdminResource } from '@/shared/lib/permissions-config';

export async function toggleWebshopVisibility(): Promise<{ success: boolean; show?: boolean; error?: string }> {
    await requireAdminResource(AdminResource.Webshop);
    const route = '/webshop';

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
                name: 'Webshop',
                route_match: route,
                is_active: newStatus
            });
        }

        try {
            const redis = await getRedis();
            await redis.del(FLAGS_CACHE_KEY);
        } catch (error) {
            safeConsoleError(`[admin-webshop-settings.actions.ts] Failed to delete feature flag cache:`, error);
        }

        revalidateTag('feature_flags', 'max');
        revalidatePath('/', 'layout');
        revalidatePath('/beheer/webshop');

        return { success: true, show: newStatus };
    } catch (error) {
        safeConsoleError(`[admin-webshop-settings.actions.ts] Failed to toggle webshop visibility:`, error);
        return { success: false, error: 'Bijwerken mislukt' };
    }
}