import { ClientSecretCredential } from '@azure/identity';
import { createClient } from 'redis';

export class TokenService {
    private static credential?: ClientSecretCredential;

    static async getAccessToken(redis: ReturnType<typeof createClient>): Promise<string> {
        const cacheKey = 'azure_sync_access_token';
        
        // 1. Check Redis
        const cachedToken = await redis.get(cacheKey);
        if (cachedToken) return cachedToken;

        console.log('[TokenService] No cached token found, fetching new one from Azure...');

        // 2. Fetch from Azure
        if (!this.credential) {
            const tenantId = process.env.AZURE_WEBSITEV7_TENANT_ID || process.env.AZURE_TENANT_ID;
            const clientId = process.env.AZURE_WEBSITEV7_SYNC_CLIENT_ID || process.env.AZURE_SYNC_CLIENT_ID;
            const clientSecret = process.env.AZURE_WEBSITEV7_SYNC_CLIENT_SECRET || process.env.AZURE_SYNC_CLIENT_SECRET;

            if (!tenantId || !clientId || !clientSecret) {
                throw new Error('Missing Azure AD credentials');
            }
            this.credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
        }

        const tokenResponse = await this.credential.getToken('https://graph.microsoft.com/.default');
        
        // 3. Save to Redis with 50m TTL (3000s)
        await redis.set(cacheKey, tokenResponse.token, {
            EX: 3000
        });

        return tokenResponse.token;
    }
}
