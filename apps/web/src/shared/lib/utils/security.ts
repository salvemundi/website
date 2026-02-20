import { createHmac } from 'crypto';

const SECRET_KEY = process.env.SERVICE_SECRET || 'dev-service-secret-123';

/**
 * Generates a signed token for a given signup ID.
 * Format: `${id}.${signature}`
 */
export function signSignupAccess(signupId: number | string): string {
    const data = String(signupId);
    const signature = createHmac('sha256', SECRET_KEY)
        .update(data)
        .digest('hex');

    return `${data}.${signature}`;
}

/**
 * Verifies if a token is valid for a given signup ID.
 * The token format should be `${id}.${signature}`.
 */
export function verifySignupAccess(signupId: number | string, token: string): boolean {
    if (!token) return false;

    // If token is just the signature (legacy support or partial token passed), try to reconstruct
    if (!token.includes('.')) {
        const expectedSignature = createHmac('sha256', SECRET_KEY)
            .update(String(signupId))
            .digest('hex');
        return token === expectedSignature;
    }

    const [tokenId, signature] = token.split('.');

    // Ensure the ID in the token matches the requested ID
    if (tokenId !== String(signupId)) return false;

    const expectedSignature = createHmac('sha256', SECRET_KEY)
        .update(tokenId)
        .digest('hex');

    return signature === expectedSignature;
}

/**
 * Hybrid authorization utility that checks for either a valid user session
 * or a specific payment access token.
 */
export async function verifyPaymentAccess(
    id: number,
    token?: string,
    type: 'trip_signup' | 'order' | 'membership' = 'trip_signup'
): Promise<boolean> {
    const directusUrl = (process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://admin.salvemundi.nl').replace(/\/$/, '');
    const adminToken = process.env.DIRECTUS_ADMIN_TOKEN;

    if (!adminToken) {
        console.error('[verifyPaymentAccess] Missing Admin Token');
        return false;
    }

    // 1. Session Check (Step 1 of user requirements)
    let currentUserEmail: string | null = null;
    try {
        const { getUserClient } = await import('@/shared/lib/directus-clients');
        const { readMe } = await import('@directus/sdk');
        const userClient = await getUserClient();

        if (userClient) {
            const currentUser = await userClient.request(readMe({ fields: ['email'] }));
            if (currentUser?.email) {
                currentUserEmail = currentUser.email;
            }
        }
    } catch (e) {
        // Session invalid or expired, proceed to token check
    }

    // 2. Fetch Item Data (using admin token to check ownership/tokens)
    const collectionMap = {
        'trip_signup': 'trip_signups',
        'order': 'orders',
        'membership': 'memberships',
        'pub_crawl_signup': 'pub_crawl_signups'
    };
    const collection = collectionMap[type];

    try {
        const resp = await fetch(`${directusUrl}/items/${collection}/${id}?fields=email,payment_access_token`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            next: { revalidate: 0 }
        });

        if (!resp.ok) return false;
        const { data: item } = await resp.json();

        // 3. Authorization Logic (Step 1: Session/Email Match)
        if (currentUserEmail && item.email && String(item.email).toLowerCase() === String(currentUserEmail).toLowerCase()) {
            return true;
        }

        // 4. Token Check (Step 2: Database UUIDv4 Match with Timing Attack Protection)
        console.log('[DEBUG Auth] Received Token:', token, '| DB Token:', item.payment_access_token);

        if (token && item.payment_access_token) {
            const { timingSafeEqual } = await import('crypto');

            const tokenBuffer = Buffer.from(token);
            const dbTokenBuffer = Buffer.from(item.payment_access_token);

            if (tokenBuffer.length === dbTokenBuffer.length && timingSafeEqual(tokenBuffer, dbTokenBuffer)) {
                return true;
            }
        }

        // 5. HMAC Token Match (Fallback for transition/magic links)
        if (token && verifySignupAccess(Number(id), token)) {
            return true;
        }

        return false;
    } catch (e) {
        console.error(`[verifyPaymentAccess] Error verifying ${type} ${id}:`, e);
        return false;
    }
}
