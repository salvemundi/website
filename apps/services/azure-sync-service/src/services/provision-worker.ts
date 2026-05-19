import { safeConsoleError, logInfo } from '../utils/logger.js';
import { Redis } from 'ioredis';
import { SyncJob } from './sync/sync-job.js';
import { TokenService } from './token.service.js';
import { z } from 'zod';

export const ProvisionTaskSchema = z.object({
    userId: z.string(),
    paymentId: z.string().optional(),
    retries: z.number(),
    maxRetries: z.number()
});

export type ProvisionTask = z.infer<typeof ProvisionTaskSchema>;

export class ProvisionWorkerService {
    private static readonly QUEUE_KEY = 'v7:queue:provision:sync_existing';
    private static shouldStop: boolean = false;

    static async queueProvisioning(redis: Redis, userId: string, paymentId?: string) {
        const task: ProvisionTask = {
            userId,
            paymentId,
            retries: 0,
            maxRetries: 10
        };

        await redis.zadd(this.QUEUE_KEY, Date.now(), JSON.stringify(task));
    }

    static async start(redis: Redis) {
        logInfo('[ProvisionWorker] Starting background worker loop...');

        while (!ProvisionWorkerService['shouldStop']) {
            try {
                const now = Date.now();
                const tasks = await redis.zrangebyscore(this.QUEUE_KEY, 0, now, 'LIMIT', 0, 5);

                if (tasks.length === 0) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    continue;
                }

                for (const taskJson of tasks) {
                    if ((ProvisionWorkerService as unknown as Record<string, unknown>).shouldStop) break;

                    let taskRaw: unknown;
                    try {
                        taskRaw = JSON.parse(taskJson);
                    } catch (_parseErr) {
                        safeConsoleError('[ProvisionWorker] Failed to parse JSON, removing corrupt task:', taskJson);
                        await redis.zrem(this.QUEUE_KEY, taskJson);
                        continue;
                    }

                    const parsed = ProvisionTaskSchema.safeParse(taskRaw);
                    if (!parsed.success) {
                        safeConsoleError('[ProvisionWorker] Invalid task schema, removing corrupt task:', taskJson);
                        await redis.zrem(this.QUEUE_KEY, taskJson);
                        continue;
                    }

                    const task = parsed.data;

                    try {
                        logInfo(`[ProvisionWorker] Provisioning user ${task.userId}...`);

                        // 1. Get Azure Token
                        const token = await TokenService.getAccessToken(redis);

                        // 2. Perform individual sync/provisioning
                        await SyncJob.syncByEntraId(redis, task.userId, token);

                        // Success -> Remove
                        await redis.zrem(this.QUEUE_KEY, taskJson);
                        logInfo(`[ProvisionWorker] Successfully provisioned user ${task.userId}`);
                    } catch (error: unknown) {
                        const message = error instanceof Error ? error.message : String(error);
                        safeConsoleError(`[ProvisionWorker] Failed provisioning for user ${task.userId}:`, message);

                        task.retries += 1;
                        await redis.zrem(this.QUEUE_KEY, taskJson);

                        if (task.retries < task.maxRetries) {
                            const delay = 10000 * Math.pow(task.retries, 2); // 10s, 40s, 90s...
                            await redis.zadd(this.QUEUE_KEY, Date.now() + delay, JSON.stringify(task));
                            logInfo(`[ProvisionWorker] Retrying in ${delay / 1000}s (Attempt ${task.retries}).`);
                        } else {
                            safeConsoleError(`[ProvisionWorker] MAX RETRIES reached for user ${task.userId}. Dropping task.`);
                        }
                    }
                }
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                const isConnectionFailure = 
                    errorMessage.includes('Connection is closed') || 
                    errorMessage.includes('ECONNREFUSED') || 
                    errorMessage.includes('ENOTFOUND');

                if (isConnectionFailure) {
                    safeConsoleError('[provision-worker.ts][start]', error);
                    throw error;
                }

                safeConsoleError('[provision-worker.ts][start]', error);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    static stop() {
        this.shouldStop = true;
    }
}
