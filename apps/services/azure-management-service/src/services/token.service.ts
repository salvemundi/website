import { ClientSecretCredential } from '@azure/identity';

export class TokenService {
    private static credential?: ClientSecretCredential;

    static async getAccessToken(): Promise<string> {
        // Since this is a service, we'll fetch from Azure directly for now
        // We could add Redis caching later if needed, but for Management it's less frequent
        if (!this.credential) {
            const tenantId = process.env.AZURE_WEBSITEV7_TENANT_ID;
            const clientId = process.env.AZURE_WEBSITEV7_PROVISIONING_CLIENT_ID;
            const clientSecret = process.env.AZURE_WEBSITEV7_PROVISIONING_CLIENT_SECRET;

            if (!tenantId || !clientId || !clientSecret) {
                throw new Error('Missing Azure AD Provisioning credentials');
            }
            this.credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
        }

        const tokenResponse = await this.credential.getToken('https://graph.microsoft.com/.default');
        return tokenResponse.token;
    }
}
