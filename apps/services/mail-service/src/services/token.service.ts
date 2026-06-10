import { safeConsoleError, safeConsoleLog } from '../utils/logger.js';
import { ClientSecretCredential } from '@azure/identity';
import { type Redis } from 'ioredis';

export class TokenService {
    private static credential?: ClientSecretCredential;
    private static readonly CACHE_KEY = 'mail_service_access_token';

    private static getAzureConfig() {
        const tenantId = process.env.AZURE_TENANT_ID || process.env.AZURE_WEBSITEV7_TENANT_ID;
        const clientId = process.env.AZURE_MAIL_CLIENT_ID || process.env.AZURE_WEBSITEV7_MAIL_CLIENT_ID;
        const clientSecret = process.env.AZURE_MAIL_CLIENT_SECRET || process.env.AZURE_WEBSITEV7_MAIL_CLIENT_SECRET;

        if (!tenantId || !clientId || !clientSecret) {
            throw new Error('Missing Azure AD credentials for Mail Service (TENANT_ID, CLIENT_ID, or CLIENT_SECRET)');
        }

        return { tenantId, clientId, clientSecret };
    }

    static async getAccessToken(redis: Redis): Promise<string> {
        try {
            const cachedToken = await redis.get(this.CACHE_KEY);
            if (cachedToken) {
                return cachedToken;
            }
        } catch (error) {
            safeConsoleError('[TokenService] Redis cache read error:', error);
        }

        safeConsoleLog('[TokenService] Cache miss or expired. Fetching fresh token from Azure...');

        if (!this.credential) {
            const { tenantId, clientId, clientSecret } = this.getAzureConfig();
            this.credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
        }

        const tokenResponse = await this.credential.getToken('https://graph.microsoft.com/.default');

        try {
            await redis.set(this.CACHE_KEY, tokenResponse.token, 'EX', 3000);
        } catch (error) {
            safeConsoleError('[TokenService] Redis cache write error:', error);
        }

        return tokenResponse.token;
    }
}