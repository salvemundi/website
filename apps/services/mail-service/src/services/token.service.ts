import { ClientSecretCredential } from '@azure/identity';
import { createClient } from 'redis';

/**
 * TokenService for Mail Service.
 * Manages Microsoft Graph access tokens with Redis caching (50m TTL).
 */
export class TokenService {
    private static credential?: ClientSecretCredential;

    static async getAccessToken(redis: ReturnType<typeof createClient>): Promise<string> {
        const cacheKey = 'mail_service_access_token';
        
        // 1. Check Redis for a valid cached token
        try {
            const cachedToken = await redis.get(cacheKey);
            if (cachedToken) {
                // console.log('[TokenService] Using cached access token from Redis');
                return cachedToken;
            }
        } catch (err) {
            console.error('[TokenService] Redis cache read error:', err);
        }

        console.log('[TokenService] Cache miss or expired. Fetching fresh token from Azure...');

        // 2. Fetch fresh token from Azure AD
        if (!this.credential) {
            const tenantId = process.env.AZURE_WEBSITEV7_TENANT_ID;
            const clientId = process.env.AZURE_MAIL_CLIENT_ID;
            const clientSecret = process.env.AZURE_MAIL_CLIENT_SECRET;

            if (!tenantId || !clientId || !clientSecret) {
                throw new Error('Missing Azure AD credentials for Mail Service (TENANT_ID, CLIENT_ID, or CLIENT_SECRET)');
            }
            this.credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
        }

        const tokenResponse = await this.credential.getToken('https://graph.microsoft.com/.default');
        
        // 3. Save to Redis with 50-minute TTL (3000 seconds) for safe margin
        try {
            await redis.set(cacheKey, tokenResponse.token, {
                EX: 3000 // 50 minutes
            });
            console.log('[TokenService] New token cached in Redis for 50 minutes (3000s buffer)');
        } catch (err) {
            console.error('[TokenService] Redis cache write error:', err);
        }

        return tokenResponse.token;
    }
}
