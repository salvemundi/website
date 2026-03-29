import { Redis } from 'ioredis';
import { MailerService } from './mailer.js';
import { AuditService } from './audit.js';

interface MailTask {
    to: string;
    templateId: string;
    data: any;
    retries: number;
    maxRetries: number;
}

export class MailWorkerService {
    private static readonly QUEUE_KEY = 'mail_queue';
    private static shouldStop = false;

    /**
     * Queues an email for dispatch.
     */
    static async queueMail(redis: Redis, to: string, templateId: string, data: any) {
        const task: MailTask = {
            to,
            templateId,
            data,
            retries: 0,
            maxRetries: 20
        };

        await redis.zadd(this.QUEUE_KEY, Date.now(), JSON.stringify(task));
    }

    /**
     * Starts the background worker loop.
     */
    static async startWorker(redis: Redis) {
        console.log('[MailWorker] Started background worker loop.');
        
        while (!this.shouldStop) {
            try {
                // 1. Fetch tasks that are due (score <= now)
                const now = Date.now();
                const tasks = await redis.zrangebyscore(this.QUEUE_KEY, 0, now, 'LIMIT', 0, 5);

                if (tasks.length === 0) {
                    await new Promise(resolve => setTimeout(resolve, 5000)); // Sleep 5s if empty
                    continue;
                }

                for (const taskJson of tasks) {
                    if (this.shouldStop) break;
                    
                    const task: MailTask = JSON.parse(taskJson);
                    
                    try {
                        console.log(`[MailWorker] Processing mail to ${task.to}...`);
                        
                        // 2. Attempt dispatch
                        const success = await MailerService.send(redis, task.to, task.templateId, task.data);
                        
                        if (success) {
                            await redis.zrem(this.QUEUE_KEY, taskJson);
                            await AuditService.logMail(task.to, task.templateId, 'SUCCESS');
                        } else {
                            throw new Error('MailerService returned false');
                        }
                    } catch (error: any) {
                        console.error(`[MailWorker] Failed dispatch to ${task.to}:`, error.message);
                        
                        // 3. Handle Retry (Exponential Backoff with 60s base)
                        task.retries += 1;
                        if (task.retries >= task.maxRetries) {
                            console.error(`[MailWorker] MAX RETRIES reached for ${task.to}. Removing task.`);
                            await redis.zrem(this.QUEUE_KEY, taskJson);
                            await AuditService.logMail(task.to, task.templateId, 'FAILED', `Max retries reached: ${error.message}`);
                        } else {
                            // Backoff: 1m, 4m, 9m, 16m... up to 50 retries which covers > 24 hours
                            // Formula: 60s * retries^2. 
                            // At retry 38, delay is ~24 hours.
                            const delay = 60000 * Math.pow(task.retries, 2);
                            const newScore = Date.now() + delay;
                            
                            // Remove old and add updated
                            await redis.zrem(this.QUEUE_KEY, taskJson);
                            await redis.zadd(this.QUEUE_KEY, newScore, JSON.stringify(task));
                            
                            console.log(`[MailWorker] Retrying in ${delay / 1000}s (Attempt ${task.retries}).`);
                        }
                    }
                }
            } catch (err) {
                console.error('[MailWorker] Loop Error:', err);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    static stopWorker() {
        this.shouldStop = true;
        console.log('[MailWorker] Stop signal received.');
    }
}
