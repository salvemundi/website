import { Redis } from 'ioredis';
import { createDirectus, rest, staticToken, updateItem } from '@directus/sdk';

interface DirectusUpdateTask {
    collection: string;
    id: string | number;
    data: any;
    retries: number;
    maxRetries: number;
}

export class DirectusRetryService {
    private static readonly QUEUE_KEY = 'directus_update_retry_queue';
    private static shouldStop = false;

    /**
     * Queues an update request for Directus.
     */
    static async queueUpdate(redis: Redis, collection: string, id: string | number, data: any) {
        const task: DirectusUpdateTask = {
            collection,
            id,
            data,
            retries: 0,
            maxRetries: 15 // High number of retries for critical payment updates
        };

        // Add to Redis Sorted Set (Score = current time)
        await redis.zadd(this.QUEUE_KEY, Date.now(), JSON.stringify(task));
        console.log(`[DirectusRetry] Queued update for ${collection}/${id}`);
    }

    /**
     * Starts the background worker loop.
     */
    static async startWorker(redis: Redis) {
        console.log('[DirectusRetry] Starting Directus Update Worker Loop...');
        
        while (!this.shouldStop) {
            try {
                const now = Date.now();
                const taskStrings = await redis.zrangebyscore(this.QUEUE_KEY, 0, now);

                if (taskStrings.length === 0) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    continue;
                }

                for (const taskStr of taskStrings) {
                    const task: DirectusUpdateTask = JSON.parse(taskStr);
                    
                    try {
                        await this.processUpdate(task);
                        await redis.zrem(this.QUEUE_KEY, taskStr);
                        console.log(`[DirectusRetry] Successfully processed update for ${task.collection}/${task.id}`);
                    } catch (err: any) {
                        console.error(`[DirectusRetry] Failed attempt ${task.retries + 1} for ${task.collection}/${task.id}: ${err.message}`);
                        await redis.zrem(this.QUEUE_KEY, taskStr);

                        if (task.retries < task.maxRetries) {
                            task.retries++;
                            // Exponential Backoff
                            const backoffSec = Math.min(3600, 10 * Math.pow(2, task.retries - 1)); // Max 1 hour
                            const nextAttempt = Date.now() + (backoffSec * 1000);
                            
                            await redis.zadd(this.QUEUE_KEY, nextAttempt, JSON.stringify(task));
                        } else {
                            console.error(`[DirectusRetry] Max retries reached for ${task.collection}/${task.id}. Dropping task.`);
                        }
                    }
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (err: any) {
                console.error(`[DirectusRetry] Worker loop error: ${err.message}`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    static stopWorker() {
        this.shouldStop = true;
    }

    private static async processUpdate(task: DirectusUpdateTask) {
        const directusUrl = process.env.DIRECTUS_SERVICE_URL || process.env.DIRECTUS_URL!;
        const directusToken = process.env.DIRECTUS_STATIC_TOKEN!;
        
        const directus = createDirectus(directusUrl)
            .with(staticToken(directusToken))
            .with(rest());

        await directus.request(updateItem(task.collection as any, task.id as any, task.data));
    }
}
