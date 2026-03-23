import { Redis } from 'ioredis';
import { SyncJob } from './sync.job.js';
import { TokenService } from './token.service.js';

interface ProvisionTask {
    userId: string;
    paymentId?: string;
    retries: number;
    maxRetries: number;
}

export class ProvisionWorkerService {
    private static readonly QUEUE_KEY = 'azure_provision_queue';
    private static shouldStop = false;

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
        console.log('[ProvisionWorker] Starting background worker loop...');

        while (!this.shouldStop) {
            try {
                const now = Date.now();
                const tasks = await redis.zrangebyscore(this.QUEUE_KEY, 0, now, 'LIMIT', 0, 5);

                if (tasks.length === 0) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    continue;
                }

                for (const taskJson of tasks) {
                    if (this.shouldStop) break;
                    const task: ProvisionTask = JSON.parse(taskJson);

                    try {
                        console.log(`[ProvisionWorker] Provisioning user ${task.userId}...`);
                        
                        // 1. Get Azure Token
                        const token = await TokenService.getAccessToken(redis);
                        
                        // 2. Perform individual sync/provisioning
                        // We'll refactor SyncJob.syncUser to be public
                        await SyncJob.syncUserById(redis, task.userId, token);

                        // Success -> Remove
                        await redis.zrem(this.QUEUE_KEY, taskJson);
                        console.log(`[ProvisionWorker] Successfully provisioned user ${task.userId}`);
                    } catch (err: any) {
                        console.error(`[ProvisionWorker] Failed provisioning for user ${task.userId}:`, err.message);

                        task.retries += 1;
                        await redis.zrem(this.QUEUE_KEY, taskJson);

                        if (task.retries < task.maxRetries) {
                            const delay = 10000 * Math.pow(task.retries, 2); // 10s, 40s, 90s...
                            await redis.zadd(this.QUEUE_KEY, Date.now() + delay, JSON.stringify(task));
                            console.log(`[ProvisionWorker] Retrying in ${delay / 1000}s (Attempt ${task.retries}).`);
                        } else {
                            console.error(`[ProvisionWorker] MAX RETRIES reached for user ${task.userId}. Dropping task.`);
                        }
                    }
                }
            } catch (err: any) {
                console.error('[ProvisionWorker] Loop Error:', err.message);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    static stop() {
        this.shouldStop = true;
    }
}
