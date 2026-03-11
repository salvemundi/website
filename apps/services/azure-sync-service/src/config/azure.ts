import { ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials/index.js';
import 'isomorphic-fetch';
import dotenv from 'dotenv';

dotenv.config();

const tenantId = process.env.AZURE_WEBSITEV7_TENANT_ID;
const clientId = process.env.AZURE_WEBSITEV7_SYNC_CLIENT_ID;
const clientSecret = process.env.AZURE_WEBSITEV7_SYNC_CLIENT_SECRET;

let _graphClient: Client | null = null;

export function getGraphClient(): Client {
    if (_graphClient) return _graphClient;

    if (!tenantId || !clientId || !clientSecret) {
        throw new Error('Missing Azure AD credentials in environment variables');
    }

    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
        scopes: ['https://graph.microsoft.com/.default'],
    });

    _graphClient = Client.initWithMiddleware({ authProvider });
    return _graphClient;
}
