import { safeConsoleError, logInfo } from '../utils/logger.js';
import { type Redis } from 'ioredis';
import { GraphService } from './graph.service.js';
import { TokenService } from './token.service.js';
import { z } from 'zod';

export const ProvisionTaskSchema = z.object({
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    phoneNumber: z.string().optional(),
    dateOfBirth: z.string().optional(),
    retries: z.number(),
    maxRetries: z.number()
});

type ProvisionTask = z.infer<typeof ProvisionTaskSchema>;

export class ProvisionWorkerService {
    private static readonly QUEUE_KEY = 'v7:queue:provision:new_user';
    private static shouldStop = false;

    static async queueProvisioning(redis: Redis, data: Omit<ProvisionTask, 'retries' | 'maxRetries'>) {
        const task: ProvisionTask = {
            ...data,
            retries: 0,
            maxRetries: 10
        };
        await redis.zadd(this.QUEUE_KEY, Date.now(), JSON.stringify(task));
    }

    static async start(redis: Redis) {
        logInfo('[provision-worker.ts][start] Starting worker loop...');

        while (!this.shouldStop) {
            try {
                const tasks = await redis.zrangebyscore(this.QUEUE_KEY, 0, Date.now(), 'LIMIT', 0, 5);

                if (tasks.length === 0) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    continue;
                }

                for (const taskJson of tasks) {
                    if (this.shouldStop) break;

                    let taskRaw: unknown;
                    try {
                        taskRaw = JSON.parse(taskJson);
                    } catch (_err) {
                        await redis.zrem(this.QUEUE_KEY, taskJson);
                        continue;
                    }

                    const parsed = ProvisionTaskSchema.safeParse(taskRaw);
                    if (!parsed.success) {
                        await redis.zrem(this.QUEUE_KEY, taskJson);
                        continue;
                    }

                    const task = parsed.data;

                    try {
                        const normalize = (str: string) => {
                            return str
                                .toLowerCase()
                                .normalize('NFD')
                                .replace(/[\u0300-\u036f]/g, '')
                                .replace(/[^a-z0-9]/g, '.')
                                .replace(/\.+/g, '.')
                                .trim();
                        };

                        const upnPrefix = `${normalize(task.firstName)}.${normalize(task.lastName)}`.replace(/\.+/g, '.').replace(/^\.|\.$/g, '');

                        const token = await TokenService.getAccessToken(redis);
                        const upn = await GraphService.generateUniqueUpn(upnPrefix, token);

                        logInfo(`[provision-worker.ts][start] Provisioning ${task.email} as ${upn}...`);

                        const formatLocalDate = (date: Date) => {
                            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                        };
                        const now = new Date();
                        const paymentDate = formatLocalDate(now);
                        const expiryDate = formatLocalDate(new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()));

                        const result = await GraphService.createUser(
                            upn,
                            task.firstName,
                            task.lastName,
                            token,
                            task.email,
                            task.phoneNumber,
                            task.dateOfBirth,
                            paymentDate,
                            expiryDate
                        );

                        logInfo(`[provision-worker.ts][start] Azure account created for ${task.email}`);

                        const activeGroupId = process.env.AZURE_ACTIVE_LID_GROUP_ID || '2e17c12a-28d6-49ae-981a-8b5b8d88db8a';
                        try {
                            logInfo(`[provision-worker.ts][start] Adding user to group ${activeGroupId}...`);
                            await GraphService.addGroupMember(activeGroupId, result.id, token);
                        } catch (groupErr: any) {
                            safeConsoleError(`[provision-worker.ts][start] Failed to add user to active lid group: ${groupErr.message}`);
                        }

                        if (process.env.AZURE_SYNC_SERVICE_URL) {
                            logInfo(`[provision-worker.ts][start] Triggering immediate sync for Entra ID ${result.id}...`);
                            const syncRes = await fetch(`${process.env.AZURE_SYNC_SERVICE_URL}/api/sync/run/${encodeURIComponent(result.id)}`, {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}` }
                            });

                            if (!syncRes.ok) {
                                const errorText = await syncRes.text();
                                throw new Error(`Sync service failed: ${errorText}`);
                            }
                            logInfo(`[provision-worker.ts][start] Sync completed for ${task.email}`);
                        }

                        logInfo(`[provision-worker.ts][start] Sending combined welcome & payment email to ${task.email}...`);

                        const mailRes = await fetch(`${process.env.MAIL_SERVICE_URL}/api/mail/send`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                to: task.email,
                                templateId: 'welcome_payment',
                                data: {
                                    firstName: task.firstName,
                                    accountEmail: result.userPrincipalName,
                                    temporaryPassword: result.temporaryPassword,
                                    expiryDate: expiryDate,
                                    userId: result.id
                                }
                            })
                        });

                        if (!mailRes.ok) throw new Error(`Mail service failed: ${mailRes.statusText}`);
                        logInfo(`[provision-worker.ts][start] [${task.email}] Welcome email successful.`);

                        await redis.zrem(this.QUEUE_KEY, taskJson);
                    } catch (error: any) {
                        safeConsoleError(`[provision-worker.ts][start] [${task.email}] Failed:`, error.message);

                        if (error.message?.includes('already exists') || error.status === 409) {
                            logInfo(`[provision-worker.ts][start] [${task.email}] User already exists. Removing task.`);
                            await redis.zrem(this.QUEUE_KEY, taskJson);
                            continue;
                        }

                        task.retries += 1;
                        await redis.zrem(this.QUEUE_KEY, taskJson);

                        if (task.retries < task.maxRetries) {
                            const delay = 30000 * Math.pow(task.retries, 2);
                            await redis.zadd(this.QUEUE_KEY, Date.now() + delay, JSON.stringify(task));
                        } else {
                            safeConsoleError(`[provision-worker.ts][start] [${task.email}] Max retries reached.`);
                            try {
                                const directusUrl = process.env.DIRECTUS_SERVICE_URL || process.env.DIRECTUS_URL;
                                const directusToken = process.env.DIRECTUS_STATIC_TOKEN;
                                if (directusUrl && directusToken) {
                                    await fetch(`${directusUrl}/items/system_logs`, {
                                        method: 'POST',
                                        headers: {
                                            'Authorization': `Bearer ${directusToken}`,
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                            type: 'system_provisioning_failed',
                                            status: 'ERROR',
                                            payload: {
                                                email: task.email,
                                                name: `${task.firstName} ${task.lastName}`,
                                                error: error.message,
                                                timestamp: new Date().toISOString()
                                            }
                                        })
                                    });
                                }
                            } catch (logErr) {
                                safeConsoleError(`[provision-worker.ts][start] [${task.email}] Failed to write system_logs for dead-letter.`);
                            }
                        }
                    }
                }
            } catch (loopErr: any) {
                safeConsoleError('[provision-worker.ts][start] Loop Error:', loopErr.message);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    static stop() {
        this.shouldStop = true;
    }
}