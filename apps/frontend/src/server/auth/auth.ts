import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { pool } from "@/lib/database/db";
import { createRedisSessionPlugin } from "@/server/auth/redis-session-plugin";
import { z } from "zod";
import { safeConsoleError } from "@/server/utils/logger";

const isBuildTime = 
    process.env.NEXT_PHASE === "phase-production-build" || 
    process.env.CI === "true" ||
    process.env.NODE_ENV === "test";

const authEnvSchema = z.object({
    BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
    BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),
    AZURE_WEBSITEV7_AUTH_CLIENT_ID: z.string().min(1, "AZURE_WEBSITEV7_AUTH_CLIENT_ID is required"),
    AZURE_WEBSITEV7_AUTH_CLIENT_SECRET: z.string().min(1, "AZURE_WEBSITEV7_AUTH_CLIENT_SECRET is required"),
    AZURE_WEBSITEV7_TENANT_ID: z.string().min(1, "AZURE_WEBSITEV7_TENANT_ID is required"),
    BETTER_AUTH_TRUSTED_ORIGINS: z.string().optional(),
});

const getAuthEnv = () => {
    if (isBuildTime) {
        return {
            BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || "build-placeholder-secret",
            BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
            AZURE_WEBSITEV7_AUTH_CLIENT_ID: process.env.AZURE_WEBSITEV7_AUTH_CLIENT_ID || "build-placeholder-id",
            AZURE_WEBSITEV7_AUTH_CLIENT_SECRET: process.env.AZURE_WEBSITEV7_AUTH_CLIENT_SECRET || "build-placeholder-secret",
            AZURE_WEBSITEV7_TENANT_ID: process.env.AZURE_WEBSITEV7_TENANT_ID || "build-placeholder-tenant",
            BETTER_AUTH_TRUSTED_ORIGINS: process.env.BETTER_AUTH_TRUSTED_ORIGINS,
        };
    }

    try {
        return authEnvSchema.parse(process.env);
    } catch (error: unknown) {
        safeConsoleError("[auth.ts][getAuthEnv]", error);
        throw error;
    }
};

const authEnv = getAuthEnv();

export const auth = betterAuth({
    debug: true,
    database: pool,
    secret: authEnv.BETTER_AUTH_SECRET,
    baseURL: authEnv.BETTER_AUTH_TRUSTED_ORIGINS
        ? {
            allowedHosts: authEnv.BETTER_AUTH_TRUSTED_ORIGINS.split(',').map(o => {
                try {
                    return new URL(o).host;
                } catch {
                    return o;
                }
            }),
            fallback: authEnv.BETTER_AUTH_URL
          }
        : authEnv.BETTER_AUTH_URL,
    trustedOrigins: authEnv.BETTER_AUTH_TRUSTED_ORIGINS
        ? authEnv.BETTER_AUTH_TRUSTED_ORIGINS.split(',')
        : [authEnv.BETTER_AUTH_URL],
    socialProviders: {
        microsoft: {
            clientId: authEnv.AZURE_WEBSITEV7_AUTH_CLIENT_ID,
            clientSecret: authEnv.AZURE_WEBSITEV7_AUTH_CLIENT_SECRET,
            tenantId: authEnv.AZURE_WEBSITEV7_TENANT_ID,
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
