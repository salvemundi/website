import { cookies } from 'next/headers';
import { AUTH_COOKIES } from '@/shared/config/auth-config';

/**
 * Retrieves the current session token for Server Actions,
 * prioritizing the impersonation test token if it exists.
 */
export async function getServerSessionToken(): Promise<string | undefined> {
    const cookieStore = await cookies();

    // 1. Priority: Impersonation token
    const testToken = cookieStore.get(AUTH_COOKIES.TEST_TOKEN)?.value;
    if (testToken) {
        return testToken;
    }

    // 2. Priority: Normal session token
    return cookieStore.get(AUTH_COOKIES.SESSION)?.value;
}
