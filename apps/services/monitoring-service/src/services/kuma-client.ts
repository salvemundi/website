import { io, Socket } from "socket.io-client";

const COMMAND_TIMEOUT_MS = 15_000;
const EVENT_TIMEOUT_MS = 15_000;

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
    active: boolean;
    url?: string;
    hostname?: string;
    port?: number;
    interval?: number;
    retryInterval?: number;
    maxretries?: number;
    description?: string;
    notificationIDList?: Record<string, boolean>;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`[kuma-client.ts] Timed out after ${ms}ms waiting for: ${label}`));
        }, ms);

        promise.then(
            (val) => { clearTimeout(timer); resolve(val); },
            (err: unknown) => {
                clearTimeout(timer);
                reject(err instanceof Error ? err : new Error(String(err)));
            }
        );
    });
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

        const connectPromise = new Promise<void>((resolve, reject) => {
            if (!this.socket) {
                reject(new Error("Socket not initialized."));
                return;
            }
            this.socket.on("connect", () => {
                console.log("[kuma-client.ts][connect] Connected.");
                resolve();
            });
            this.socket.on("connect_error", (err: Error) => {
                reject(new Error(`[kuma-client.ts][connect] Failed to connect: ${err.message}`));
            });
        });

        return withTimeout(connectPromise, 15_000, "socket connect");
    }

    public async sendCommand<T extends SocketCallbackResponse = SocketCallbackResponse>(
        event: string,
        ...args: unknown[]
    ): Promise<T> {
        if (!this.socket) {
            throw new Error("[kuma-client.ts][sendCommand] Socket is not connected.");
        }

        const commandPromise = new Promise<T>((resolve, reject) => {
            this.socket?.emit(event, ...args, (res: SocketCallbackResponse) => {
                if (!res.ok) {
                    reject(new Error(res.msg || `[kuma-client.ts][sendCommand] Command '${event}' failed.`));
                } else {
                    resolve(res as T);
                }
            });
        });

        return withTimeout(commandPromise, COMMAND_TIMEOUT_MS, `sendCommand('${event}')`);
    }

    public async isSetupNeeded(): Promise<boolean> {
        if (!this.socket) {
            throw new Error("[kuma-client.ts][isSetupNeeded] Socket is not connected.");
        }

        const checkPromise = new Promise<boolean>((resolve) => {
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

        return withTimeout(checkPromise, COMMAND_TIMEOUT_MS, "isSetupNeeded");
    }

    public async setupAdmin(username: string, password: string): Promise<void> {
        await this.sendCommand("setup", username, password);
    }

    public async login(username: string, password: string): Promise<void> {
        await this.sendCommand("login", { username, password, token: "" });
    }

    public async getNotificationList(): Promise<NotificationProvider[]> {
        if (!this.socket) throw new Error("[kuma-client.ts][getNotificationList] Socket is not connected.");

        const listPromise = new Promise<NotificationProvider[]>((resolve) => {
            this.socket?.once("notificationList", (list: NotificationProvider[]) => resolve(list));
            this.socket?.emit("getNotificationList");
        });

        return withTimeout(listPromise, EVENT_TIMEOUT_MS, "getNotificationList");
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
        if (!this.socket) throw new Error("[kuma-client.ts][getMonitorList] Socket is not connected.");

        const listPromise = new Promise<Record<string, KumaMonitor>>((resolve) => {
            this.socket?.once("monitorList", (list: Record<string, KumaMonitor>) => resolve(list));
            this.socket?.emit("getMonitorList");
        });

        return withTimeout(listPromise, EVENT_TIMEOUT_MS, "getMonitorList");
    }

    public async addMonitor(payload: Partial<KumaMonitor>): Promise<void> {
        if (!this.socket) throw new Error("[kuma-client.ts][addMonitor] Socket is not connected.");

        let settled = false;
        let poll: ReturnType<typeof setInterval> | null = null;

        const addPromise = new Promise<void>((resolve, reject) => {
            const done = (fn: () => void) => {
                if (settled) return;
                settled = true;
                if (poll) clearInterval(poll);
                this.socket?.off("monitorList", onMonitorList);
                fn();
            };

            const onMonitorList = (list: Record<string, KumaMonitor>) => {
                const exists = Object.values(list).some((m) => m.name === payload.name);
                if (exists) done(resolve);
            };
            this.socket?.on("monitorList", onMonitorList);

            this.socket?.emit("addMonitor", payload, (res: unknown) => {
                if (typeof res === "object" && res !== null && "ok" in res && !(res as SocketCallbackResponse).ok) {
                    done(() => reject(new Error((res as SocketCallbackResponse).msg ?? "[kuma-client.ts][addMonitor] addMonitor failed.")));
                }
            });

            // Fallback poll: if monitorList never fires containing our monitor
            poll = setInterval(async () => {
                if (settled) { clearInterval(poll!); return; }
                try {
                    const list = await this.getMonitorList();
                    const exists = Object.values(list).some((m) => m.name === payload.name);
                    if (exists) done(resolve);
                } catch {
                    // ignore poll errors, let the outer timeout handle it
                }
            }, 2000);
        });

        return withTimeout(addPromise, COMMAND_TIMEOUT_MS, `addMonitor('${payload.name}')`);
    }

    public async editMonitor(payload: KumaMonitor): Promise<void> {
        if (!this.socket) throw new Error("[kuma-client.ts][editMonitor] Socket is not connected.");

        let settled = false;
        let poll: ReturnType<typeof setInterval> | null = null;

        const editPromise = new Promise<void>((resolve, reject) => {
            const done = (fn: () => void) => {
                if (settled) return;
                settled = true;
                if (poll) clearInterval(poll);
                this.socket?.off("monitorList", onMonitorList);
                fn();
            };

            const onMonitorList = (list: Record<string, KumaMonitor>) => {
                const exists = Object.values(list).some((m) => m.id === payload.id);
                if (exists) done(resolve);
            };
            this.socket?.on("monitorList", onMonitorList);

            this.socket?.emit("editMonitor", payload, (res: unknown) => {
                if (typeof res === "object" && res !== null && "ok" in res && !(res as SocketCallbackResponse).ok) {
                    done(() => reject(new Error((res as SocketCallbackResponse).msg ?? "[kuma-client.ts][editMonitor] editMonitor failed.")));
                }
            });

            // Fallback poll: if monitorList never fires containing our monitor
            poll = setInterval(async () => {
                if (settled) { clearInterval(poll!); return; }
                try {
                    const list = await this.getMonitorList();
                    const exists = Object.values(list).some((m) => m.id === payload.id);
                    if (exists) done(resolve);
                } catch {
                    // ignore poll errors, let the outer timeout handle it
                }
            }, 2000);
        });

        return withTimeout(editPromise, COMMAND_TIMEOUT_MS, `editMonitor('${payload.name}')`);
    }

    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}
