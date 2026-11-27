import { headers } from 'next/headers';
import { getRedis } from './redis-client';
import { safeConsoleError } from '@/server/utils/logger';

export async function clearSessionCache() {
    try {
        // The Redis session cache is keyed on the raw (still URL-encoded) cookie value as it
        // appears in the Cookie header (see redis-session/handlers.ts). better-auth names the
        // cookie `(__Secure-)better-auth.session_token`, and cookies() would return the decoded
        // value, so read the raw header with the same pattern the sign-out hook uses.
        const cookieHeader = (await headers()).get('cookie') ?? '';
        const sessionToken = cookieHeader.match(/better-auth\.session[-_]token=([^;]+)/)?.[1];

        if (sessionToken) {
            const redis = await getRedis();
            await redis.del(`session:${sessionToken}`);
            return true;
        }
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[session-utils.ts][clearSessionCache] ', `Failed to clear session cache: ${typedError.message}`);
    }
    return false;
}