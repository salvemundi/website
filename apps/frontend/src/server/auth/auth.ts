import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
    database: new Pool({
        connectionString: `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.INTERNAL_DB_HOST}:5432/${process.env.DB_NAME}`
    }),
    user: {
        modelName: "directus_users",
        additionalFields: {
            first_name: { type: "string" },
            last_name: { type: "string" },
            membership_status: { type: "string" },
            membership_expiry: { type: "string" },
            phone_number: { type: "string" },
            date_of_birth: { type: "string" },
            avatar: { type: "string" },
            minecraft_username: { type: "string" },
        }
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
