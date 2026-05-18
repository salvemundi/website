import { safeConsoleError } from '../utils/logger.js';
import { Redis } from 'ioredis';
import { z } from 'zod';

const AzureUpdateTaskSchema = z.object({
    entraId: z.string(),
    data: z.object({
        membershipExpiry: z.string().optional(),
        originalPaymentDate: z.string().optional()
    }),
    retries: z.number(),
    maxRetries: z.number(),
    triggerSync: z.boolean().optional()
});

type AzureUpdateTask = z.infer<typeof AzureUpdateTaskSchema>;

export class AzureRetryService {
    private static readonly QUEUE_KEY = 'azure_update_retry_queue';
    private static shouldStop = false;

    /**
     * Queues an update request for Azure AD.
     */
    static async queueUpdate(redis: Redis, entraId: string, data: AzureUpdateTask['data'], triggerSync: boolean = true) {
        const task: AzureUpdateTask = {
            entraId,
            data,
            retries: 0,
            maxRetries: 10,
            triggerSync
        };

        await redis.zadd(this.QUEUE_KEY, Date.now(), JSON.stringify(task));
        safeConsoleError(`[AzureRetry] Queued Azure update for Entra ID ${entraId}`);
    }

    /**
     * Starts the background worker loop.
     */
    static async startWorker(redis: Redis) {
        safeConsoleError('[AzureRetry] Starting Azure Update Worker Loop...');

        while (!this.shouldStop) {
            try {
                const now = Date.now();
                const taskStrings = await redis.zrangebyscore(this.QUEUE_KEY, 0, now);

                if (taskStrings.length === 0) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    continue;
                }

                for (const taskStr of taskStrings) {
                    try {
                        const result = AzureUpdateTaskSchema.safeParse(JSON.parse(taskStr));

                        if (!result.success) {
                            safeConsoleError(`[AzureRetry] Corrupt queue entry detected, removing task: ${result.error.message}`);
                            await redis.zrem(this.QUEUE_KEY, taskStr);
                            continue;
                        }

                        const task = result.data;

                        try {
                            await this.processUpdate(task);

                            if (task.triggerSync) {
                                await this.triggerSync(task.entraId);
                            }

                            await redis.zrem(this.QUEUE_KEY, taskStr);
                            safeConsoleError(`[AzureRetry] Successfully updated Azure user ${task.entraId}`);
                        } catch (error: unknown) {
                            const err = error instanceof Error ? error : new Error(String(error));
                            safeConsoleError(`[AzureRetry] Failed attempt ${task.retries + 1} for ${task.entraId}: ${err.message}`);
                            await redis.zrem(this.QUEUE_KEY, taskStr);

                            if (task.retries < task.maxRetries) {
                                task.retries++;
                                const backoffSec = 30 * Math.pow(2, task.retries - 1);
                                const nextAttempt = Date.now() + (backoffSec * 1000);
                                await redis.zadd(this.QUEUE_KEY, nextAttempt, JSON.stringify(task));
                            }
                        }
                    } catch (parseErr: unknown) {
                        const err = parseErr instanceof Error ? parseErr : new Error(String(parseErr));
                        safeConsoleError(`[AzureRetry] Corrupt JSON detected, removing task: ${err.message}`);
                        await redis.zrem(this.QUEUE_KEY, taskStr);
                    }
                }
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error: unknown) {
                const err = error instanceof Error ? error : new Error(String(error));
                safeConsoleError(`[AzureRetry] Worker loop error: ${err.message}`);
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }
    }

    static stopWorker() {
        this.shouldStop = true;
    }

    private static async processUpdate(task: AzureUpdateTask) {
        const azureMgmtUrl = process.env.AZURE_MANAGEMENT_SERVICE_URL;
        const internalToken = process.env.INTERNAL_SERVICE_TOKEN;

        if (!azureMgmtUrl) throw new Error('AZURE_MANAGEMENT_SERVICE_URL not configured');

        const res = await fetch(`${azureMgmtUrl}/api/users/${task.entraId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${internalToken}`
            },
            body: JSON.stringify(task.data)
        });

        if (!res.ok) {
            const errBody = await res.text();
            throw new Error(`Azure Management Service returned ${res.status}: ${errBody}`);
        }
    }

    private static async triggerSync(entraId: string) {
        const azureSyncUrl = process.env.AZURE_SYNC_SERVICE_URL;
        const internalToken = process.env.INTERNAL_SERVICE_TOKEN;

        if (!azureSyncUrl) return; // Optional

        const res = await fetch(`${azureSyncUrl}/api/sync/run/${entraId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${internalToken}`
            }
        });

        if (!res.ok) {
            safeConsoleError(`[AzureRetry] Failed to trigger sync for ${entraId} (Status: ${res.status})`);
        }
    }
}
