import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { pool } from "@/lib/database/db";
import { createRedisSessionPlugin } from "@/server/auth/redis-session-plugin";

export const auth = betterAuth({
    debug: true,
    database: pool,
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS
        ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(',')
        : [process.env.BETTER_AUTH_URL ?? ""],
    socialProviders: {
        microsoft: {
            clientId: process.env.AZURE_WEBSITEV7_AUTH_CLIENT_ID ?? "",
            clientSecret: process.env.AZURE_WEBSITEV7_AUTH_CLIENT_SECRET ?? "",
            tenantId: process.env.AZURE_WEBSITEV7_TENANT_ID ?? "",
            prompt: "select_account" } },
    user: {
        modelName: "directus_users",
        fields: {
            email: "email",
            name: "name",
            image: "image",
            emailVerified: "emailVerified",
            createdAt: "createdAt",
            updatedAt: "updatedAt"
        },
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
            isAdmin: { type: "boolean" },
            isICT: { type: "boolean" },
            role: { type: "string" } }
    },
    session: {
        modelName: "auth_sessions"
    },
    account: {
        modelName: "auth_accounts",
        accountLinking: {
            enabled: true,
            trustedProviders: ["microsoft"] }
    },
    plugins: [
        nextCookies(),
        createRedisSessionPlugin(pool)
    ]
});
