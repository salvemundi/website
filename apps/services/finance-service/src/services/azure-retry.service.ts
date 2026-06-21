import { safeConsoleError } from '../utils/logger.js';
import { type Redis } from 'ioredis';
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

    private static getConfig() {
        const azureMgmtUrl = process.env.AZURE_MANAGEMENT_SERVICE_URL;
        const azureSyncUrl = process.env.AZURE_SYNC_SERVICE_URL;
        const internalToken = (process.env.INTERNAL_SERVICE_TOKEN || '').replace(/^"|"$/g, '').trim();
        const expectedHeader = `Bearer ${internalToken}`;

        return { azureMgmtUrl, azureSyncUrl, expectedHeader };
    }

    static async queueUpdate(redis: Redis, entraId: string, data: AzureUpdateTask['data'], triggerSync: boolean = true) {
        const task: AzureUpdateTask = {
            entraId,
            data,
            retries: 0,
            maxRetries: 10,
            triggerSync
        };

        await redis.zadd(this.QUEUE_KEY, Date.now(), JSON.stringify(task));
        safeConsoleError('[azure-retry.service.ts][queueUpdate] ', `Queued Azure update for Entra ID ${entraId}`);
    }

    static async startWorker(redis: Redis) {
        safeConsoleError('[azure-retry.service.ts][startWorker] ', 'Starting Azure Update Worker Loop...');

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
                            safeConsoleError('[azure-retry.service.ts][startWorker] ', `Corrupt queue entry detected, removing task: ${result.error.message}`);
                            await redis.zrem(this.QUEUE_KEY, taskStr);
                            continue;
                        }

                        const task = result.data;

                        try {
                            const config = this.getConfig();
                            await this.processUpdate(task, config);

                            if (task.triggerSync) {
                                await this.triggerSync(task.entraId, config);
                            }

                            await redis.zrem(this.QUEUE_KEY, taskStr);
                            safeConsoleError('[azure-retry.service.ts][startWorker] ', `Successfully updated Azure user ${task.entraId}`);
                        } catch (error: unknown) {
                            const typedError = error instanceof Error ? error : new Error(String(error));
                            safeConsoleError('[azure-retry.service.ts][startWorker] ', `Failed attempt ${task.retries + 1} for ${task.entraId}: ${typedError.message}`);
                            await redis.zrem(this.QUEUE_KEY, taskStr);

                            if (task.retries < task.maxRetries) {
                                task.retries++;
                                const backoffSec = 30 * Math.pow(2, task.retries - 1);
                                const nextAttempt = Date.now() + (backoffSec * 1000);
                                await redis.zadd(this.QUEUE_KEY, nextAttempt, JSON.stringify(task));
                            }
                        }
                    } catch (parseError: unknown) {
                        const typedParseError = parseError instanceof Error ? parseError : new Error(String(parseError));
                        safeConsoleError('[azure-retry.service.ts][startWorker] ', `Corrupt JSON detected, removing task: ${typedParseError.message}`);
                        await redis.zrem(this.QUEUE_KEY, taskStr);
                    }
                }
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error: unknown) {
                const typedError = error instanceof Error ? error : new Error(String(error));
                safeConsoleError('[azure-retry.service.ts][startWorker] ', typedError);
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }
    }

    static stopWorker() {
        this.shouldStop = true;
    }

    private static async processUpdate(task: AzureUpdateTask, config: ReturnType<typeof AzureRetryService.getConfig>) {
        if (!config.azureMgmtUrl) throw new Error('AZURE_MANAGEMENT_SERVICE_URL not configured');

        const res = await fetch(`${config.azureMgmtUrl}/api/users/${task.entraId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': config.expectedHeader
            },
            body: JSON.stringify(task.data)
        });

        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`Azure Management Service returned ${res.status}: ${errorBody}`);
        }
    }

    private static async triggerSync(entraId: string, config: ReturnType<typeof AzureRetryService.getConfig>) {
        if (!config.azureSyncUrl) return;

        const res = await fetch(`${config.azureSyncUrl}/api/sync/run/${entraId}`, {
            method: 'POST',
            headers: {
                'Authorization': config.expectedHeader
            }
        });

        if (!res.ok) {
            safeConsoleError('[azure-retry.service.ts][triggerSync] ', `Failed to trigger sync for ${entraId} (Status: ${res.status})`);
        }
    }
}