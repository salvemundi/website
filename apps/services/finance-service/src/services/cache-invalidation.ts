import { safeConsoleError } from '../utils/logger.js';
import { type Redis } from 'ioredis';
import { z } from 'zod';

const InvalidationTaskSchema = z.object({
    userId: z.string(),
    tag: z.string(),
    retries: z.number(),
    maxRetries: z.number()
});

type InvalidationTask = z.infer<typeof InvalidationTaskSchema>;

export class CacheInvalidationService {
    private static readonly QUEUE_KEY = 'cache_invalidation_queue';
    private static shouldStop = false;

    private static getConfig() {
        const nextAppUrl = process.env.NEXT_APP_INTERNAL_URL || 'http://v7-acc-frontend-1:3000';
        const secret = (process.env.INTERNAL_SERVICE_TOKEN || '').replace(/^"|"$/g, '').trim();
        const expectedHeader = `Bearer ${secret}`;
        return { nextAppUrl, expectedHeader };
    }

    static async queueInvalidation(redis: Redis, userId: string) {
        const task: InvalidationTask = {
            userId,
            tag: `user-${userId}-transactions`,
            retries: 0,
            maxRetries: 10
        };

        await redis.zadd(this.QUEUE_KEY, Date.now(), JSON.stringify(task));
        safeConsoleError(`[CacheInvalidation] Queued task for user ${userId} in Sorted Set`);
    }

    static async startWorker(redis: Redis) {
        safeConsoleError('[CacheInvalidation] Starting Retry Worker Loop...');

        while (!this.shouldStop) {
            try {
                const now = Date.now();
                const taskStrings = await redis.zrangebyscore(this.QUEUE_KEY, 0, now);

                if (taskStrings.length === 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }

                for (const taskStr of taskStrings) {
                    try {
                        const result = InvalidationTaskSchema.safeParse(JSON.parse(taskStr));

                        if (!result.success) {
                            safeConsoleError(`[CacheInvalidation] Corrupt queue entry detected, removing task: ${result.error.message}`);
                            await redis.zrem(this.QUEUE_KEY, taskStr);
                            continue;
                        }

                        const task = result.data;

                        try {
                            await this.processInvalidation(task);
                            await redis.zrem(this.QUEUE_KEY, taskStr);
                        } catch (error: unknown) {
                            const err = error instanceof Error ? error : new Error(String(error));
                            safeConsoleError(`[CacheInvalidation] Failed attempt ${task.retries + 1} for ${task.userId}: ${err.message}`);

                            await redis.zrem(this.QUEUE_KEY, taskStr);

                            if (task.retries < task.maxRetries) {
                                task.retries++;
                                const backoffSec = 5 * Math.pow(2, task.retries - 1);
                                const nextAttempt = Date.now() + (backoffSec * 1000);

                                await redis.zadd(this.QUEUE_KEY, nextAttempt, JSON.stringify(task));
                                safeConsoleError(`[CacheInvalidation] Rescheduled user ${task.userId} for +${backoffSec}s (next: ${new Date(nextAttempt).toISOString()})`);
                            } else {
                                safeConsoleError(`[CacheInvalidation] Max retries reached for user ${task.userId}. Dropping task.`);
                            }
                        }
                    } catch (parseErr: unknown) {
                        const err = parseErr instanceof Error ? parseErr : new Error(String(parseErr));
                        safeConsoleError(`[CacheInvalidation] Corrupt JSON detected, removing task: ${err.message}`);
                        await redis.zrem(this.QUEUE_KEY, taskStr);
                    }
                }

                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                const isFatal = errorMessage.includes('ECONNREFUSED') || errorMessage.includes('Connection is closed') || errorMessage.includes('ENOTFOUND');

                if (isFatal) {
                    safeConsoleError('[cache-invalidation.ts][startWorker]', error);
                    throw error;
                }

                safeConsoleError('[cache-invalidation.ts][startWorker]', error);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        safeConsoleError('[CacheInvalidation] Worker Loop stopped gracefully.');
    }

    static stopWorker() {
        this.shouldStop = true;
    }

    private static async processInvalidation(task: InvalidationTask) {
        const { nextAppUrl, expectedHeader } = this.getConfig();

        const res = await fetch(`${nextAppUrl}/api/revalidate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': expectedHeader
            },
            body: JSON.stringify({ tag: task.tag })
        });

        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`Next.js API returned ${res.status}: ${errorBody}`);
        }

        safeConsoleError(`[CacheInvalidation] Successfully invalidated Next.js cache for tag: ${task.tag}`);
    }
}