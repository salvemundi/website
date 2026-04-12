import { Redis } from 'ioredis';
import fetch from 'isomorphic-fetch';
import { GraphService } from './graph.service.js';
import { TokenService } from './token.service.js';

interface ProvisionTask {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    retries: number;
    maxRetries: number;
}

export class ProvisionWorkerService {
    private static readonly QUEUE_KEY = 'v7:queue:provision:new_user';
    private static shouldStop = false;

    /**
     * Queues a provisioning task in Redis.
     */
    static async queueProvisioning(redis: Redis, data: Omit<ProvisionTask, 'retries' | 'maxRetries'>) {
        const task: ProvisionTask = {
            ...data,
            retries: 0,
            maxRetries: 10
        };
        // Use zadd for scheduled/retryable tasks
        await redis.zadd(this.QUEUE_KEY, Date.now(), JSON.stringify(task));
    }

    /**
     * Starts the worker loop.
     */
    static async start(redis: Redis) {
        console.log('[ProvisionWorker] Starting worker loop...');
        
        while (!this.shouldStop) {
            try {
                // 1. Fetch tasks that are due
                const tasks = await redis.zrangebyscore(this.QUEUE_KEY, 0, Date.now(), 'LIMIT', 0, 5);

                if (tasks.length === 0) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    continue;
                }

                for (const taskJson of tasks) {
                    if (this.shouldStop) break;
                    const task: ProvisionTask = JSON.parse(taskJson);

                    try {
                        const normalize = (str: string) => {
                            return str
                                .toLowerCase()
                                .normalize('NFD')
                                .replace(/[\u0300-\u036f]/g, '') // Remove accents/diacritics
                                .replace(/[^a-z0-9]/g, '.')    // Replace non-alphanumeric with dots
                                .replace(/\.+/g, '.')          // Remove consecutive dots
                                .trim();
                        };

                        const upnPrefix = `${normalize(task.firstName)}.${normalize(task.lastName)}`.replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
                        const upn = `${upnPrefix}@lid.salvemundi.nl`;

                        console.log(`[ProvisionWorker] Provisioning ${task.email} as ${upn}...`);
                        
                        // 2. Create User in Azure
                        const token = await TokenService.getAccessToken();
                        
                        const now = new Date();
                        const paymentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
                        const expiryDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString().split('T')[0];

                        const result = await GraphService.createUser(
                            upn,
                            task.firstName,
                            task.lastName,
                            token,
                            task.email, // Passing original email as personalEmail
                            task.phoneNumber,
                            task.dateOfBirth,
                            paymentDate,
                            expiryDate
                        );

                        console.log(`[ProvisionWorker] Azure account created for ${task.email}`);

                        // 3. Sync to Directus (Strict Seqential: Sync BEFORE Mail)
                        if (process.env.AZURE_SYNC_SERVICE_URL) {
                            console.log(`[ProvisionWorker] Triggering immediate sync for Entra ID ${result.id}...`);
                            const syncRes = await fetch(`${process.env.AZURE_SYNC_SERVICE_URL}/api/sync/run/${encodeURIComponent(result.id)}`, {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}` }
                            });
                            
                            if (!syncRes.ok) {
                                const errorText = await syncRes.text();
                                throw new Error(`Sync service failed: ${errorText}`);
                            }
                            console.log(`[ProvisionWorker] Sync completed for ${task.email}`);
                        }

                        // 4. Queue Welcome Email (ONLY after azure + sync success)
                        console.log(`[ProvisionWorker] Sending combined welcome & payment email to ${task.email}...`);
                        
                        const mailRes = await fetch(`${process.env.MAIL_SERVICE_URL}/api/mail/send`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                to: task.email,
                                templateId: 'welcome_payment',
                                data: {
                                    firstName: task.firstName,
                                    accountEmail: result.userPrincipalName,
                                    temporaryPassword: result.temporaryPassword,
                                    expiryDate: expiryDate,
                                    userId: result.id
                                }
                            })
                        });

                        if (!mailRes.ok) throw new Error(`Mail service failed: ${mailRes.statusText}`);
                        console.log(`[ProvisionWorker] Welcome email successful for ${task.email}`);

                        // Success -> Remove task
                        await redis.zrem(this.QUEUE_KEY, taskJson);
                    } catch (err: any) {
                        console.error(`[ProvisionWorker] Failed for ${task.email}:`, err.message);

                        // If user already exists, we consider it "Success" (or at least done)
                        if (err.message?.includes('already exists') || err.status === 409) {
                            console.log(`[ProvisionWorker] User ${task.email} already exists. Removing task.`);
                            await redis.zrem(this.QUEUE_KEY, taskJson);
                            continue;
                        }

                        // Retry logic
                        task.retries += 1;
                        await redis.zrem(this.QUEUE_KEY, taskJson);

                        if (task.retries < task.maxRetries) {
                            const delay = 30000 * Math.pow(task.retries, 2); // 30s, 2m, 4.5m...
                            await redis.zadd(this.QUEUE_KEY, Date.now() + delay, JSON.stringify(task));
                        } else {
                            console.error(`[ProvisionWorker] Max retries reached for ${task.email}`);
                        }
                    }
                }
            } catch (loopErr: any) {
                console.error('[ProvisionWorker] Loop Error:', loopErr.message);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    static stop() {
        this.shouldStop = true;
    }
}
