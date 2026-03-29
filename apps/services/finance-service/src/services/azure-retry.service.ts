import { Redis } from 'ioredis';

interface AzureUpdateTask {
    entraId: string;
    data: {
        membershipExpiry?: string;
        originalPaymentDate?: string;
    };
    retries: number;
    maxRetries: number;
    triggerSync?: boolean;
}

export class AzureRetryService {
    private static readonly QUEUE_KEY = 'azure_update_retry_queue';
    private static shouldStop = false;

    /**
     * Queues an update request for Azure AD.
     */
    static async queueUpdate(redis: Redis, entraId: string, data: any, triggerSync: boolean = true) {
        const task: AzureUpdateTask = {
            entraId,
            data,
            retries: 0,
            maxRetries: 10,
            triggerSync
        };

        await redis.zadd(this.QUEUE_KEY, Date.now(), JSON.stringify(task));
        console.log(`[AzureRetry] Queued Azure update for Entra ID ${entraId}`);
    }

    /**
     * Starts the background worker loop.
     */
    static async startWorker(redis: Redis) {
        console.log('[AzureRetry] Starting Azure Update Worker Loop...');
        
        while (!this.shouldStop) {
            try {
                const now = Date.now();
                const taskStrings = await redis.zrangebyscore(this.QUEUE_KEY, 0, now);

                if (taskStrings.length === 0) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    continue;
                }

                for (const taskStr of taskStrings) {
                    const task: AzureUpdateTask = JSON.parse(taskStr);
                    
                    try {
                        await this.processUpdate(task);
                        
                        if (task.triggerSync) {
                            await this.triggerSync(task.entraId);
                        }
                        
                        await redis.zrem(this.QUEUE_KEY, taskStr);
                        console.log(`[AzureRetry] Successfully updated Azure user ${task.entraId}`);
                    } catch (err: any) {
                        console.error(`[AzureRetry] Failed attempt ${task.retries + 1} for ${task.entraId}: ${err.message}`);
                        await redis.zrem(this.QUEUE_KEY, taskStr);

                        if (task.retries < task.maxRetries) {
                            task.retries++;
                            const backoffSec = 30 * Math.pow(2, task.retries - 1);
                            const nextAttempt = Date.now() + (backoffSec * 1000);
                            await redis.zadd(this.QUEUE_KEY, nextAttempt, JSON.stringify(task));
                        }
                    }
                }
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (err: any) {
                console.error(`[AzureRetry] Worker loop error: ${err.message}`);
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
            console.warn(`[AzureRetry] Failed to trigger sync for ${entraId} (Status: ${res.status})`);
        }
    }
}
