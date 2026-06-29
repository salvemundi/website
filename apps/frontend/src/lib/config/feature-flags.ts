import 'server-only';
import { getRedis } from '@/server/auth/redis-client';
import { unstable_noStore as noStore } from 'next/cache';
import { db, schema } from '@salvemundi/db';
import { eq } from 'drizzle-orm';

export const FLAGS_CACHE_KEY = 'site:disabled_routes';
const CACHE_TTL = 60;

export async function getDisabledRoutes(): Promise<string[]> {
    noStore();

    try {
        const redis = await getRedis();
        const cached = await redis.get(FLAGS_CACHE_KEY);

        if (cached) return JSON.parse(cached) as string[];

        const rows = await db.select({ route_match: schema.feature_flags.route_match })
            .from(schema.feature_flags)
            .where(eq(schema.feature_flags.is_active, false));

        const routes = rows
            .map((flag) => flag.route_match)
            .filter((route): route is string => Boolean(route));

        await redis.set(FLAGS_CACHE_KEY, JSON.stringify(routes), 'EX', CACHE_TTL);
        return routes;
    } catch {
        return [];
    }
}
