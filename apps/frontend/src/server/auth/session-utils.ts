import { cookies } from 'next/headers';
import { getRedis } from './redis-client';
import { safeConsoleError } from '@/server/utils/logger';

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
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('session.utils.ts][clearSessionCache]', `Failed to clear session cache: ${typedError.message}`);
    }
    return false;
}