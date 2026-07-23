import { io, Socket } from "socket.io-client";

export interface SocketCallbackResponse {
    ok: boolean;
    msg?: string;
    id?: number;
    needSetup?: boolean;
    [key: string]: unknown;
}

export interface NotificationProvider {
    id: number;
    name: string;
    type: string;
    discordWebhookURL?: string;
    isDefault?: boolean;
}

export interface KumaMonitor {
    id: number;
    name: string;
    type: string;
    url?: string;
    hostname?: string;
    port?: number;
    interval?: number;
    retryInterval?: number;
    maxretries?: number;
    description?: string;
    notificationIDList?: Record<string, boolean>;
}

export class KumaClient {
    private socket: Socket | null = null;

    constructor(private readonly kumaUrl: string) {}

    public async connect(): Promise<void> {
        console.log(`[kuma-client.ts][connect] Connecting to Uptime Kuma socket at ${this.kumaUrl}...`);
        this.socket = io(this.kumaUrl, {
            reconnection: false,
            timeout: 10000,
        });

        return new Promise<void>((resolve, reject) => {
            if (!this.socket) {
                reject(new Error("Socket not initialized."));
                return;
            }
            this.socket.on("connect", () => {
                console.log("[kuma-client.ts][connect] Connected.");
                resolve();
            });
            this.socket.on("connect_error", (err: Error) => {
                reject(new Error(`[kuma-client.ts][connect] Failed to connect to Uptime Kuma socket: ${err.message}`));
            });
        });
    }

    public async sendCommand<T extends SocketCallbackResponse = SocketCallbackResponse>(
        event: string,
        ...args: unknown[]
    ): Promise<T> {
        if (!this.socket) {
            throw new Error("[kuma-client.ts][sendCommand] Socket is not connected.");
        }
        return new Promise<T>((resolve, reject) => {
            this.socket?.emit(event, ...args, (res: SocketCallbackResponse) => {
                if (!res.ok) {
                    reject(new Error(res.msg || `[kuma-client.ts][sendCommand] Command '${event}' failed.`));
                } else {
                    resolve(res as T);
                }
            });
        });
    }

    public async isSetupNeeded(): Promise<boolean> {
        if (!this.socket) {
            throw new Error("[kuma-client.ts][isSetupNeeded] Socket is not connected.");
        }
        return new Promise<boolean>((resolve) => {
            this.socket?.emit("needSetup", (res: unknown) => {
                if (typeof res === "boolean") {
                    resolve(res);
                } else if (typeof res === "object" && res !== null && "needSetup" in res) {
                    resolve(Boolean((res as SocketCallbackResponse).needSetup));
                } else {
                    resolve(true);
                }
            });
        });
    }



    public async setupAdmin(username: string, password: string): Promise<void> {
        await this.sendCommand("setup", username, password);
    }

    public async login(username: string, password: string): Promise<void> {
        await this.sendCommand("login", { username, password, token: "" });
    }

    public async getNotificationList(): Promise<NotificationProvider[]> {
        if (!this.socket) throw new Error("Socket is not connected.");
        this.socket.emit("getNotificationList");
        return new Promise((resolve) => {
            this.socket?.once("notificationList", (list: NotificationProvider[]) => resolve(list));
        });
    }

    public async addNotification(name: string, type: string, webhookUrl: string): Promise<number> {
        const res = await this.sendCommand<{ ok: boolean; id: number }>("addNotification", {
            name,
            type,
            discordWebhookURL: webhookUrl,
            isDefault: true,
        });
        return res.id;
    }

    public async getMonitorList(): Promise<Record<string, KumaMonitor>> {
        if (!this.socket) throw new Error("Socket is not connected.");
        this.socket.emit("getMonitorList");
        return new Promise((resolve) => {
            this.socket?.once("monitorList", (list: Record<string, KumaMonitor>) => resolve(list));
        });
    }

    public async addMonitor(payload: Partial<KumaMonitor>): Promise<void> {
        await this.sendCommand("addMonitor", payload);
    }

    public async editMonitor(payload: KumaMonitor): Promise<void> {
        await this.sendCommand("editMonitor", payload);
    }

    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}
