import { safeConsoleError, logInfo } from '../utils/logger.js';
import { type Redis } from 'ioredis';
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
    private static shouldStop = false;

    private static isStopped(): boolean {
        return this.shouldStop;
    }

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
        logInfo('[provision-worker.ts][start] ', 'Starting background worker loop...');

        while (!this.isStopped()) {
            try {
                const now = Date.now();
                const tasks = await redis.zrangebyscore(this.QUEUE_KEY, 0, now, 'LIMIT', 0, 5);

                if (tasks.length === 0) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    continue;
                }

                for (const taskJson of tasks) {
                    if (this.isStopped()) break;

                    let taskRaw: unknown;
                    try {
                        taskRaw = JSON.parse(taskJson);
                    } catch (parseError: unknown) {
                        const typedParseError = parseError instanceof Error ? parseError : new Error(String(parseError));
                        safeConsoleError('[provision-worker.ts][start] ', `Failed to parse JSON, removing corrupt task: ${taskJson} - ${typedParseError.message}`);
                        await redis.zrem(this.QUEUE_KEY, taskJson);
                        continue;
                    }

                    const parsed = ProvisionTaskSchema.safeParse(taskRaw);
                    if (!parsed.success) {
                        safeConsoleError('[provision-worker.ts][start] ', `Invalid task schema, removing corrupt task: ${taskJson}`);
                        await redis.zrem(this.QUEUE_KEY, taskJson);
                        continue;
                    }

                    const task = parsed.data;

                    try {
                        logInfo('[provision-worker.ts][start] ', `Provisioning user ${task.userId}...`);

                        const token = await TokenService.getAccessToken(redis);
                        await SyncJob.syncByEntraId(redis, task.userId, token);

                        await redis.zrem(this.QUEUE_KEY, taskJson);
                        logInfo('[provision-worker.ts][start] ', `Successfully provisioned user ${task.userId}`);
                    } catch (error: unknown) {
                        const typedError = error instanceof Error ? error : new Error(String(error));
                        safeConsoleError('[provision-worker.ts][start] ', `Failed provisioning for user ${task.userId}: ${typedError.message}`);

                        task.retries += 1;
                        await redis.zrem(this.QUEUE_KEY, taskJson);

                        if (task.retries < task.maxRetries) {
                            const delay = 10000 * Math.pow(task.retries, 2);
                            await redis.zadd(this.QUEUE_KEY, Date.now() + delay, JSON.stringify(task));
                            logInfo('[provision-worker.ts][start] ', `Retrying in ${delay / 1000}s (Attempt ${task.retries}).`);
                        } else {
                            safeConsoleError('[provision-worker.ts][start] ', `MAX RETRIES reached for user ${task.userId}. Dropping task.`);
                        }
                    }
                }
            } catch (error: unknown) {
                const typedError = error instanceof Error ? error : new Error(String(error));
                const errorMessage = typedError.message;
                const isConnectionFailure =
                    errorMessage.includes('Connection is closed') ||
                    errorMessage.includes('ECONNREFUSED') ||
                    errorMessage.includes('ENOTFOUND');

                if (isConnectionFailure) {
                    safeConsoleError('[provision-worker.ts][start] ', typedError);
                    throw typedError;
                }

                safeConsoleError('[provision-worker.ts][start] ', typedError);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    static stop() {
        this.shouldStop = true;
    }
}