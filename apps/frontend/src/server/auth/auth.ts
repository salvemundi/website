import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
    database: new Pool({
        connectionString: `postgres://directus:${process.env.DB_PASSWORD || 'directus'}@${process.env.INTERNAL_DB_HOST}:5432/directus`
    }),
    user: {
        modelName: "directus_users",
    },
    session: {
        modelName: "auth_sessions"
    },
    account: {
        modelName: "auth_accounts"
    },
    socialProviders: {
        microsoft: {
            clientId: process.env.AZURE_WEBSITEV7_AUTH_CLIENT_ID || "mock",
            clientSecret: process.env.AZURE_WEBSITEV7_AUTH_CLIENT_SECRET || "mock",
            tenantId: process.env.AZURE_WEBSITEV7_TENANT_ID || "common"
        }
    }
});
