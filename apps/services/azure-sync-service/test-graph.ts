
import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import "isomorphic-fetch";

async function test() {
    const tenantId = process.env.AZURE_TENANT_ID || process.env.AZURE_WEBSITEV7_TENANT_ID;
    const clientId = process.env.AZURE_SYNC_CLIENT_ID || process.env.AZURE_WEBSITEV7_SYNC_CLIENT_ID;
    const clientSecret = process.env.AZURE_SYNC_CLIENT_SECRET || process.env.AZURE_WEBSITEV7_SYNC_CLIENT_SECRET;

    console.log(`Testing Graph with Tenant: ${tenantId}, Client: ${clientId}`);

    const credential = new ClientSecretCredential(tenantId!, clientId!, clientSecret!);
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
        scopes: ['https://graph.microsoft.com/.default'],
    });

    const client = Client.initWithMiddleware({ authProvider });

    try {
        console.log("Fetching /organization...");
        const org = await client.api('/organization').get();
        console.log("Organization fetched successfully:", org.value?.[0]?.displayName);

        console.log("Fetching /users (top 1)...");
        const users = await client.api('/users').top(1).get();
        console.log("User fetched successfully:", users.value?.[0]?.userPrincipalName);
    } catch (err: any) {
        console.error("Test failed:");
        console.error("Status Code:", err.statusCode);
        console.error("Code:", err.code);
        console.error("Message:", err.message);
        console.error("Body:", err.body);
    }
}

test();
