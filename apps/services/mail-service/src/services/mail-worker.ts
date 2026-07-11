import { safeConsoleError } from '../utils/logger.js';
import { type Redis } from 'ioredis';
import { MailerService } from './mailer.js';
import { AuditService } from './audit.js';
import { z } from 'zod';

export const MailTaskSchema = z.object({
    to: z.string(),
    templateId: z.string(),
    data: z.record(z.string(), z.unknown()),
    retries: z.number(),
    maxRetries: z.number()
});

export type MailTask = z.infer<typeof MailTaskSchema>;

export class MailWorkerService {
    private static readonly QUEUE_KEY = 'mail_queue';
    private static shouldStop = false;

    static async queueMail(redis: Redis, to: string, templateId: string, data: Record<string, unknown>) {
        const task: MailTask = {
            to,
            templateId,
            data,
            retries: 0,
            maxRetries: 20
        };

        await redis.zadd(this.QUEUE_KEY, Date.now(), JSON.stringify(task));
    }

    static async startWorker(redis: Redis): Promise<void> {
        while (!this.shouldStop) {
            try {
                const now = Date.now();
                const tasks = await redis.zrangebyscore(this.QUEUE_KEY, 0, now, 'LIMIT', 0, 5);

                if (tasks.length === 0) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    continue;
                }

                for (const taskJson of tasks) {
                    const claimed = await redis.zrem(this.QUEUE_KEY, taskJson);
                    if (claimed === 0) {
                        continue;
                    }

                    let parsedResult: unknown;
                    try {
                        parsedResult = JSON.parse(taskJson);
                    } catch (err) {
                        safeConsoleError('[mail-worker.ts][startWorker] ', err);
                        continue;
                    }

                    const validated = MailTaskSchema.safeParse(parsedResult);
                    if (!validated.success) {
                        safeConsoleError('[mail-worker.ts][startWorker] ', validated.error);
                        continue;
                    }

                    const task = validated.data;

                    try {
                        const success = await MailerService.send(redis, task.to, task.templateId, task.data);

                        if (success) {
                            await AuditService.logMail(task.to, task.templateId, 'SUCCESS');
                        } else {
                            throw new Error('MailerService returned false');
                        }
                    } catch (error: unknown) {
                        safeConsoleError('[mail-worker.ts][startWorker] ', error);

                        task.retries += 1;
                        if (task.retries >= task.maxRetries) {
                            await AuditService.logMail(task.to, task.templateId, 'FAILED', 'Max retries reached');
                        } else {
                            const delay = 60000 * Math.pow(task.retries, 2);
                            const newScore = Date.now() + delay;

                            await redis.zadd(this.QUEUE_KEY, newScore, JSON.stringify(task));
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
                    safeConsoleError('[mail-worker.ts][startWorker] ', error);
                    throw error;
                }

                safeConsoleError('[mail-worker.ts][startWorker] ', error);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    static stopWorker() {
        this.shouldStop = true;
    }
}