import { cookies } from 'next/headers';
import { getRedis } from './redis-client';
import { safeConsoleError } from '@/server/utils/logger';

/**
 * Clears the current user's session cache in Redis.
 * This forces the next request to re-fetch the user data from the database/Azure.
 */
export async function clearSessionCache() {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('better-auth.session-token')?.value ||
            cookieStore.get('__Secure-better-auth.session-token')?.value;

        if (sessionToken) {
            const redis = await getRedis();
            await redis.del(`session:${sessionToken}`);
            return true;
        }
    } catch (error) {
        safeConsoleError('[SessionUtils] Failed to clear session cache:', error);
    }
    return false;
}
