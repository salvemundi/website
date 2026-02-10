import 'server-only';
import { createDirectus, rest, staticToken, authentication, readMe } from '@directus/sdk';
import { cookies } from 'next/headers';

const DIRECTUS_URL = process.env.INTERNAL_DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://directus:8055';

/**
 * Public Client: No auth, used for fetching news, events, etc.
 */
export const getPublicClient = () => {
    return createDirectus(DIRECTUS_URL).with(rest());
};

/**
 * User Client: Authenticated as the currently logged-in user.
 * Reads the session token from cookies.
 */
export const getUserClient = async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get('next-auth.session-token')?.value
        || cookieStore.get('__Secure-next-auth.session-token')?.value;

    if (!token) return null;

    return createDirectus(DIRECTUS_URL)
        .with(rest())
        .with(authentication())
        .with(staticToken(token));
};

/**
 * Admin Client: SUPER USER. Server-side only.
 * Uses the privileged DIRECTUS_ADMIN_TOKEN.
 */
export const getAdminClient = () => {
    const adminToken = process.env.DIRECTUS_ADMIN_TOKEN;

    if (!adminToken) {
        throw new Error('DIRECTUS_ADMIN_TOKEN is not configured');
    }

    return createDirectus(DIRECTUS_URL)
        .with(rest())
        .with(staticToken(adminToken));
};
