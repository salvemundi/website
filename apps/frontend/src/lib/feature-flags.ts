import { getRedis } from '@/server/auth/redis-client';
import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { FEATURE_FLAG_FIELDS } from '@salvemundi/validations';
import { unstable_noStore as noStore } from 'next/cache';

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
            const routes = JSON.parse(cached);
            console.log(`[Feature-Flags] Cache HIT: [${routes.join(', ')}] (Count: ${routes.length})`);
            return routes;
        }

        console.log(`[Feature-Flags] Cache MISS. Fetching from Directus...`);
        const result = await getSystemDirectus().request(readItems('feature_flags', {
            filter: { is_active: { _eq: false } },
            fields: [...FEATURE_FLAG_FIELDS],
            params: { _t: Date.now() } // Harde cache-buster
        }));

        const routes = result
            .map((flag: any) => flag.route_match)
            .filter((route: string | null | undefined): route is string => Boolean(route));

        console.log(`[Feature-Flags] Fetched fresh from Directus: [${routes.join(', ')}] (Count: ${routes.length})`);
        
        // Update Redis cache
        await redis.set(FLAGS_CACHE_KEY, JSON.stringify(routes), 'EX', CACHE_TTL);
        return routes;
    } catch (err) {
        console.error('[Feature-Flags] Error fetching disabled routes:', err);
        return [];
    }
}
