import { EnvConfig } from "../config/env.js";
import { buildMonitoredServices, MonitorDefinition } from "../config/monitors.js";
import { KumaClient, KumaMonitor } from "./kuma-client.js";

export class MonitoringProvisioner {
    private readonly client: KumaClient;

    constructor(private readonly config: EnvConfig) {
        this.client = new KumaClient(config.KUMA_URL);
    }

    public async run(): Promise<void> {
        try {
            await this.client.connect();

            await this.authenticate();
            const discordId = await this.ensureDiscordNotification();
            await this.syncMonitors(discordId);

            console.log("[provisioner.ts][run] Successfully completed monitoring sync!");
        } finally {
            this.client.disconnect();
        }
    }

    private async authenticate(): Promise<void> {
        const needsSetup = await this.client.isSetupNeeded();
        if (needsSetup) {
            console.log("[provisioner.ts][authenticate] First-time setup detected. Registering admin user...");
            await this.client.setupAdmin(this.config.KUMA_ADMIN_USER, this.config.KUMA_ADMIN_PASSWORD);
            console.log("[provisioner.ts][authenticate] Admin registered.");
        } else {
            console.log("[provisioner.ts][authenticate] Logging in as admin...");
            await this.client.login(this.config.KUMA_ADMIN_USER, this.config.KUMA_ADMIN_PASSWORD);
            console.log("[provisioner.ts][authenticate] Login successful.");
        }
    }

    private async ensureDiscordNotification(): Promise<number | undefined> {
        if (!this.config.DISCORD_MONITORING_WEBHOOK_URL) {
            console.warn("[provisioner.ts][ensureDiscordNotification] DISCORD_MONITORING_WEBHOOK_URL is not set. Skipping Discord notification setup.");
            return undefined;
        }

        console.log("[provisioner.ts][ensureDiscordNotification] Syncing Discord notification provider...");
        const notifications = await this.client.getNotificationList();

        const existing = notifications.find(
            (n) => n.name === "Discord Tech Alerts" || n.discordWebhookURL === this.config.DISCORD_MONITORING_WEBHOOK_URL
        );

        if (existing) {
            console.log(`[provisioner.ts][ensureDiscordNotification] Discord provider exists (ID: ${existing.id}).`);
            return existing.id;
        }

        const newId = await this.client.addNotification(
            "Discord Tech Alerts",
            "discord",
            this.config.DISCORD_MONITORING_WEBHOOK_URL
        );
        console.log(`[provisioner.ts][ensureDiscordNotification] Discord notification provider created (ID: ${newId}).`);
        return newId;
    }

    private async syncMonitors(discordNotificationId?: number): Promise<void> {
        console.log("[provisioner.ts][syncMonitors] Syncing monitor definitions...");
        const existingList = await this.client.getMonitorList();
        const existingMap = new Map<string, KumaMonitor>();

        Object.values(existingList).forEach((m) => existingMap.set(m.name, m));

        const servicesToMonitor = buildMonitoredServices(this.config);

        for (const service of servicesToMonitor) {
            await this.syncSingleMonitor(service, existingMap.get(service.name), discordNotificationId);
        }
    }

    private async syncSingleMonitor(
        service: MonitorDefinition,
        existing?: KumaMonitor,
        discordNotificationId?: number
    ): Promise<void> {
        const payload: Partial<KumaMonitor> = {
            name: service.name,
            type: service.type,
            url: service.url,
            hostname: service.hostname,
            port: service.port,
            interval: service.interval,
            retryInterval: service.retryInterval,
            maxretries: service.maxretries,
            description: service.description,
            notificationIDList: discordNotificationId ? { [String(discordNotificationId)]: true } : {},
        };

        if (existing) {
            console.log(`[provisioner.ts][syncSingleMonitor] Updating monitor '${service.name}'...`);
            await this.client.editMonitor({
                ...existing,
                ...payload,
                id: existing.id,
            });
        } else {
            console.log(`[provisioner.ts][syncSingleMonitor] Creating monitor '${service.name}'...`);
            await this.client.addMonitor(payload);
        }
    }
}
