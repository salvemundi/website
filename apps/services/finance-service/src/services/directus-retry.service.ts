import { safeConsoleError } from '../utils/logger.js';
import { type Redis } from 'ioredis';
import { createDirectus, rest, staticToken, updateItem } from '@directus/sdk';
import { type DirectusSchema } from '@salvemundi/validations/directus/schema';
import { z } from 'zod';

const DirectusUpdateTaskSchema = z.object({
    collection: z.string(),
    id: z.union([z.string(), z.number()]),
    data: z.record(z.unknown()),
    retries: z.number(),
    maxRetries: z.number()
});

type DirectusUpdateTask = z.infer<typeof DirectusUpdateTaskSchema>;

export class DirectusRetryService {
    private static readonly QUEUE_KEY = 'directus_update_retry_queue';
    private static shouldStop = false;

    private static getDirectusClient() {
        const directusUrl = process.env.DIRECTUS_SERVICE_URL || process.env.DIRECTUS_URL || '';
        const directusToken = process.env.DIRECTUS_STATIC_TOKEN || '';

        if (!directusUrl || !directusToken) {
            throw new Error('Directus configuration is missing');
        }

        return createDirectus<DirectusSchema>(directusUrl)
            .with(staticToken(directusToken))
            .with(rest());
    }

    static async queueUpdate(redis: Redis, collection: string, id: string | number, data: object) {
        const task: DirectusUpdateTask = {
            collection,
            id,
            data: data as Record<string, unknown>,
            retries: 0,
            maxRetries: 15
        };

        await redis.zadd(this.QUEUE_KEY, Date.now(), JSON.stringify(task));
        safeConsoleError(`[DirectusRetry] Queued update for ${collection}/${id}`);
    }

    static async startWorker(redis: Redis) {
        safeConsoleError('[DirectusRetry] Starting Directus Update Worker Loop...');

        while (!this.shouldStop) {
            try {
                const now = Date.now();
                const taskStrings = await redis.zrangebyscore(this.QUEUE_KEY, 0, now);

                if (taskStrings.length === 0) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    continue;
                }

                for (const taskStr of taskStrings) {
                    try {
                        const result = DirectusUpdateTaskSchema.safeParse(JSON.parse(taskStr));

                        if (!result.success) {
                            safeConsoleError(`[DirectusRetry] Corrupt queue entry detected, removing task: ${result.error.message}`);
                            await redis.zrem(this.QUEUE_KEY, taskStr);
                            continue;
                        }

                        const task = result.data;

                        try {
                            await this.processUpdate(task);
                            await redis.zrem(this.QUEUE_KEY, taskStr);
                            safeConsoleError(`[DirectusRetry] Successfully processed update for ${task.collection}/${task.id}`);
                        } catch (error: unknown) {
                            const err = error instanceof Error ? error : new Error(String(error));
                            safeConsoleError(`[DirectusRetry] Failed attempt ${task.retries + 1} for ${task.collection}/${task.id}: ${err.message}`);
                            await redis.zrem(this.QUEUE_KEY, taskStr);

                            if (task.retries < task.maxRetries) {
                                task.retries++;
                                const backoffSec = Math.min(3600, 10 * Math.pow(2, task.retries - 1));
                                const nextAttempt = Date.now() + (backoffSec * 1000);

                                await redis.zadd(this.QUEUE_KEY, nextAttempt, JSON.stringify(task));
                            } else {
                                safeConsoleError(`[DirectusRetry] Max retries reached for ${task.collection}/${task.id}. Dropping task.`);
                            }
                        }
                    } catch (parseErr: unknown) {
                        const err = parseErr instanceof Error ? parseErr : new Error(String(parseErr));
                        safeConsoleError(`[DirectusRetry] Corrupt JSON detected, removing task: ${err.message}`);
                        await redis.zrem(this.QUEUE_KEY, taskStr);
                    }
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error: unknown) {
                const err = error instanceof Error ? error : new Error(String(error));
                safeConsoleError(`[DirectusRetry] Worker loop error: ${err.message}`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    static stopWorker() {
        this.shouldStop = true;
    }

    private static async processUpdate(task: DirectusUpdateTask) {
        const directus = this.getDirectusClient();
        await directus.request(updateItem(task.collection as never, task.id as never, task.data as never));
    }
}