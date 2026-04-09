import { getRedis } from '@/server/auth/redis-client';
import { unstable_noStore as noStore } from 'next/cache';
import { query } from '@/lib/db';

export const FLAGS_CACHE_KEY = 'site:disabled_routes';
const CACHE_TTL = 60; // 60 seconden

/**
 * Centraal startpunt voor het ophalen van uitgeschakelde routes.
 * Deze wordt gebruikt door zowel de Proxy (middleware) als de Website Actions (navbar).
 */
export async function getDisabledRoutes(): Promise<string[]> {
    // Forceer no-store om de interne v7-core-frontend cache te omzeilen
    noStore();

    try {
        const redis = await getRedis();
        const cached = await redis.get(FLAGS_CACHE_KEY);
        
        if (cached) {
            return JSON.parse(cached);
        }

        const { rows } = await query('SELECT route_match FROM feature_flags WHERE is_active = false');

        const routes = rows
            .map((flag: any) => flag.route_match)
            .filter((route: string | null | undefined): route is string => Boolean(route));

        console.log(`[Feature-Flags] Fresh fetch: [${routes.join(', ') || 'None'}]`);
        
        // Update Redis cache
        await redis.set(FLAGS_CACHE_KEY, JSON.stringify(routes), 'EX', CACHE_TTL);
        return routes;
    } catch (err) {
        console.error('[Feature-Flags] Error fetching disabled routes:', err);
        return [];
    }
}
