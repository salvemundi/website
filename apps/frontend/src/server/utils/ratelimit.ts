import 'server-only';
import { getRedis } from '@/server/auth/redis-client';
import { headers } from 'next/headers';

async function getClientIp(): Promise<string> {
    const h = await headers();
    
    const trusted = h.get('x-trusted-ip');
    if (trusted && trusted !== 'unknown') return trusted;

    const cf = h.get('cf-connecting-ip');
    if (cf) return cf;

    const xReal = h.get('x-real-ip');
    if (xReal) return xReal;
    const xForwarded = h.get('x-forwarded-for');
    if (xForwarded) {
        return xForwarded.split(',')[0].trim();
    }

    return 'unknown';
}

export async function rateLimit(key: string, limit: number = 5, windowSeconds: number = 60) {
    const client = await getRedis();
    const ip = await getClientIp();
    
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
