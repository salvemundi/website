import { createClient } from 'redis';
import { headers } from 'next/headers';

const redisUrl = process.env.REDIS_URL || 'redis://v7-core-redis:6379';

// Lazy-initialized Redis client
let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
    if (!redisClient) {
        redisClient = createClient({ url: redisUrl });
        redisClient.on('error', (err) => console.error('Redis Client Error in RateLimiter', err));
        await redisClient.connect();
    }
    return redisClient;
}

/**
 * Extracts the most reliable client IP from headers.
 * Priority: Cloudflare Connecting IP > Nginx Real IP > X-Forwarded-For (first part).
 */
async function getClientIp(): Promise<string> {
    const h = await headers();
    
    // 1. Cloudflare (often configured in public sites)
    const cf = h.get('cf-connecting-ip');
    if (cf) return cf;

    // 2. Nginx / Custom Proxy
    const xReal = h.get('x-real-ip');
    if (xReal) return xReal;

    // 3. Last resort: X-Forwarded-For
    const xForwarded = h.get('x-forwarded-for');
    if (xForwarded) {
        return xForwarded.split(',')[0].trim();
    }

    return 'unknown';
}

/**
 * Basic Redis-based Rate Limiter for Server Actions.
 * @param key Unique key for the action (e.g., "membership-signup")
 * @param limit Maximum number of requests allowed in the window
 * @param windowSeconds Time window in seconds
 * @returns { success: boolean, remaining: number, reset: number }
 */
export async function rateLimit(key: string, limit: number = 5, windowSeconds: number = 60) {
    const client = await getRedisClient();
    const ip = await getClientIp();
    
    // Composite key: action-name:ip
    const rateLimitKey = `ratelimit:${key}:${ip}`;

    const current = await client.incr(rateLimitKey);

    if (current === 1) {
        await client.expire(rateLimitKey, windowSeconds);
    }

    const remaining = Math.max(0, limit - current);
    const ttl = await client.ttl(rateLimitKey);

    return {
        success: current <= limit,
        remaining,
        reset: Math.max(0, ttl)
    };
}
