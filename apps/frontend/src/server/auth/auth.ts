import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";
import { createRedisSessionPlugin } from "./redis-session-plugin";

// Database Pool — gebruik object config zodat speciale tekens in wachtwoorden
// geen URL-parseer problemen veroorzaken (bijv. @ of / in het wachtwoord).
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || process.env.INTERNAL_DB_HOST || 'v7-core-db',
    port: 5432,
    database: process.env.DB_NAME,
});

export const auth = betterAuth({
    database: pool,
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    advanced: {
        trustHost: true
    } as any,
    trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS
        ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(',')
        : [process.env.BETTER_AUTH_URL!],
    socialProviders: {
        microsoft: {
            clientId: process.env.AZURE_WEBSITEV7_AUTH_CLIENT_ID!,
            clientSecret: process.env.AZURE_WEBSITEV7_AUTH_CLIENT_SECRET!,
            tenantId: process.env.AZURE_WEBSITEV7_TENANT_ID!,
        },
    },
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
            entra_id: { type: "string" },
        }
    },
    session: {
        modelName: "auth_sessions"
    },
    account: {
        modelName: "auth_accounts"
    },
    plugins: [
        nextCookies(),
        createRedisSessionPlugin(pool)
    ]
});
