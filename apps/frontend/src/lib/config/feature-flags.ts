import 'server-only';
import { getRedis } from '@/server/auth/redis-client';
import { unstable_noStore as noStore } from 'next/cache';
import { query } from '@/lib/database';

export const FLAGS_CACHE_KEY = 'site:disabled_routes';
const CACHE_TTL = 60;

interface FlagRow {
    route_match: string;
}

export async function getDisabledRoutes(): Promise<string[]> {
    noStore();

    try {
        const redis = await getRedis();
        const cached = await redis.get(FLAGS_CACHE_KEY);

        if (cached) return JSON.parse(cached);

        const { rows } = await query('SELECT route_match FROM feature_flags WHERE is_active = false');
        const routes = (rows as FlagRow[])
            .map((flag) => flag.route_match)
            .filter((route): route is string => Boolean(route));

        await redis.set(FLAGS_CACHE_KEY, JSON.stringify(routes), 'EX', CACHE_TTL);
        return routes;
    } catch {
        return [];
    }
}