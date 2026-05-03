import 'server-only';
import { getRedis } from '../auth/redis-client';
import { headers } from 'next/headers';

/**
 * Extracts the most reliable client IP from headers.
 * Priority: Cloudflare Connecting IP > Nginx Real IP > X-Forwarded-For (first part).
 */
async function getClientIp(): Promise<string> {
    const h = await headers();
    
    // 0. Trusted IP from our Proxy Boundary (v16 proxy.ts)
    const trusted = h.get('x-trusted-ip');
    if (trusted && trusted !== 'unknown') return trusted;

    // 1. Cloudflare (trust only if behind Cloudflare)
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
    const client = await getRedis();
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
