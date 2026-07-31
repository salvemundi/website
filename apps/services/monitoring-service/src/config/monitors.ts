import { EnvConfig } from "./env.js";

export type MonitorType = "http" | "port" | "ping";

export interface MonitorDefinition {
    name: string;
    type: MonitorType;
    url?: string;
    hostname?: string;
    port?: number;
    interval: number;
    retryInterval: number;
    maxretries: number;
    description: string;
    expiryNotification?: boolean;
}

export function createHttpMonitor(
    name: string,
    url: string,
    description: string,
    options: Partial<Pick<MonitorDefinition, "interval" | "retryInterval" | "maxretries">> = {}
): MonitorDefinition {
    return {
        name,
        type: "http",
        url,
        description,
        interval: options.interval ?? 60,
        retryInterval: options.retryInterval ?? 20,
        maxretries: options.maxretries ?? 3,
    };
}

export function createPortMonitor(
    name: string,
    hostname: string,
    port: number,
    description: string,
    options: Partial<Pick<MonitorDefinition, "interval" | "retryInterval" | "maxretries">> = {}
): MonitorDefinition {
    return {
        name,
        type: "port",
        hostname,
        port,
        description,
        interval: options.interval ?? 60,
        retryInterval: options.retryInterval ?? 20,
        maxretries: options.maxretries ?? 3,
    };
}

export function createSslMonitor(
    name: string,
    hostname: string,
    description: string,
    options: Partial<Pick<MonitorDefinition, "interval" | "retryInterval" | "maxretries">> = {}
): MonitorDefinition {
    return {
        name,
        type: "http",
        url: `https://${hostname}`,
        description,
        expiryNotification: true,
        interval: options.interval ?? 3600,      // check every hour
        retryInterval: options.retryInterval ?? 3600,
        maxretries: options.maxretries ?? 3,
    };
}

export function buildMonitoredServices(env: EnvConfig): MonitorDefinition[] {
    return [
        createHttpMonitor("Frontend (Next.js)", `${env.FRONTEND_SERVICE_URL}/favicon.ico`, "Salve Mundi v7 Main Web Application"),
        createHttpMonitor("Finance Service", `${env.FINANCE_SERVICE_URL}/health`, "Finance & Mollie Microservice"),
        createHttpMonitor("Azure Sync Service", `${env.AZURE_SYNC_SERVICE_URL}/health`, "Azure AD & Entra Sync Service"),
        createHttpMonitor("Mail Service", `${env.MAIL_SERVICE_URL}/health`, "Email Dispatch & Template Service"),
        createHttpMonitor("Azure Management Service", `${env.AZURE_MANAGEMENT_SERVICE_URL}/health`, "Azure Group & User Management Service"),
        createPortMonitor("PostgreSQL Database", env.DB_HOST, env.DB_PORT, "Main PostgreSQL Database Port Check"),
        createPortMonitor("Redis Cache", env.REDIS_HOST, env.REDIS_PORT, "Redis Session & Queue Store Port Check"),
        createSslMonitor("SSL Certificate (salvemundi.nl)", "salvemundi.nl", "SSL/TLS Certificate Expiry Check for salvemundi.nl"),
    ];
}
