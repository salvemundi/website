import { z } from "zod";

const envSchema = z.object({
    KUMA_URL: z.string({ message: "KUMA_URL is required" }).min(1, "KUMA_URL cannot be empty"),
    KUMA_ADMIN_USER: z.string({ message: "KUMA_ADMIN_USER is required" }).min(1, "KUMA_ADMIN_USER cannot be empty"),
    KUMA_ADMIN_PASSWORD: z.string({ message: "KUMA_ADMIN_PASSWORD is required" }).min(1, "KUMA_ADMIN_PASSWORD cannot be empty"),
    DISCORD_MONITORING_WEBHOOK_URL: z.string().optional(),

    FRONTEND_SERVICE_URL: z.string({ message: "FRONTEND_SERVICE_URL is required" }).min(1, "FRONTEND_SERVICE_URL cannot be empty"),
    FINANCE_SERVICE_URL: z.string({ message: "FINANCE_SERVICE_URL is required" }).min(1, "FINANCE_SERVICE_URL cannot be empty"),
    AZURE_SYNC_SERVICE_URL: z.string({ message: "AZURE_SYNC_SERVICE_URL is required" }).min(1, "AZURE_SYNC_SERVICE_URL cannot be empty"),
    MAIL_SERVICE_URL: z.string({ message: "MAIL_SERVICE_URL is required" }).min(1, "MAIL_SERVICE_URL cannot be empty"),
    AZURE_MANAGEMENT_SERVICE_URL: z.string({ message: "AZURE_MANAGEMENT_SERVICE_URL is required" }).min(1, "AZURE_MANAGEMENT_SERVICE_URL cannot be empty"),
    
    DB_HOST: z.string({ message: "DB_HOST is required" }).min(1, "DB_HOST cannot be empty"),
    DB_PORT: z.coerce.number({ message: "DB_PORT is required" }),
    
    REDIS_HOST: z.string({ message: "REDIS_HOST is required" }).min(1, "REDIS_HOST cannot be empty"),
    REDIS_PORT: z.coerce.number({ message: "REDIS_PORT is required" }),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function parseEnv(): EnvConfig {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        const formattedErrors = result.error.issues
            .map((issue) => ` - ${issue.path.join(".")}: ${issue.message}`)
            .join("\n");
        console.error(`[env.ts][parseEnv] Missing or invalid required environment configuration:\n${formattedErrors}`);
        throw new Error("Failed to start monitoring service: Missing required environment variables.");
    }
    return result.data;
}
