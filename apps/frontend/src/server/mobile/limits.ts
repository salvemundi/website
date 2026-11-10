import 'server-only';
import { getRedis } from '@/server/auth/redis-client';
import { MobileError } from './http';

// Per-account throttling cannot be bypassed by changing network or forwarded IP headers.
export async function limitMobileUser(userId: string, operation: 'registration' | 'profile') {
    const redis = await getRedis();
    const count = await redis.eval(`
        local n=redis.call('INCR',KEYS[1])
        if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end
        return n
    `, 1, `mobile:rate:${operation}:${userId}`, 600);
    if (Number(count) > 10) throw new MobileError('rate_limited', 'Probeer het over enkele minuten opnieuw.', 429);
}
