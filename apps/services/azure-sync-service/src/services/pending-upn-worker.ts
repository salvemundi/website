import { safeConsoleError, logInfo } from '../utils/logger.js';
import { type Redis } from 'ioredis';
import { ManagementService } from './management.service.js';
import { SyncJob } from './sync/sync-job.js';
import { TokenService } from './token.service.js';
import { DbService } from './db.service.js';

interface PendingUpnTask {
    entraId: string;
    targetUpn: string;
    oldUpn: string;
    firstName: string;
}

export class PendingUpnWorkerService {
    private static readonly QUEUE_KEY = 'v7:queue:upn_changes';
    private static readonly PENDING_KEY_PREFIX = 'v7:pending_upn_change:';
    private static shouldStop = false;

    static async start(redis: Redis) {
        logInfo('[pending-upn-worker.ts][start] Starting Pending UPN Worker loop...');

        while (!this.shouldStop) {
            try {
                // Fetch tasks that are due
                const tasks = await redis.zrangebyscore(this.QUEUE_KEY, 0, Date.now(), 'LIMIT', 0, 5);

                if (tasks.length === 0) {
                    await new Promise(resolve => setTimeout(resolve, 30000)); // check every 30 seconds
                    continue;
                }

                for (const taskJson of tasks) {
                    let task: PendingUpnTask;
                    try {
                        task = JSON.parse(taskJson) as PendingUpnTask;
                    } catch (_err) {
                        await redis.zrem(this.QUEUE_KEY, taskJson);
                        continue;
                    }

                    const pendingKey = `${this.PENDING_KEY_PREFIX}${task.entraId}`;
                    const currentPendingTarget = await redis.get(pendingKey);

                    // If the current pending target matches this task's target UPN, we run the change!
                    if (currentPendingTarget === task.targetUpn) {
                        const isUpnConversionEnabled = await DbService.isFlagActive('auto_upn_conversion');
                        if (!isUpnConversionEnabled) {
                            logInfo(`[pending-upn-worker.ts][start] UPN conversion is disabled globally via feature flag. Skipping scheduled change for user ${task.entraId} to ${task.targetUpn} for now.`);
                            continue;
                        }

                        logInfo(`[pending-upn-worker.ts][start] Processing scheduled UPN change for user ${task.entraId} to ${task.targetUpn}...`);
                        try {
                            // Update UPN in Azure
                            await ManagementService.updateUserPrincipalName(task.entraId, task.targetUpn);

                            // Trigger immediate sync in DB (Directus)
                            const token = await TokenService.getAccessToken(redis);
                            await SyncJob.syncByEntraId(redis, task.entraId, token);

                            logInfo(`[pending-upn-worker.ts][start] UPN successfully updated to ${task.targetUpn} and synced in DB.`);
                        } catch (error: unknown) {
                            const msg = error instanceof Error ? error.message : String(error);
                            safeConsoleError(`[pending-upn-worker.ts][start] Failed to execute UPN change for user ${task.entraId}:`, msg);
                        }
                    } else {
                        logInfo(`[pending-upn-worker.ts][start] Skipping outdated UPN change task for user ${task.entraId} (current pending target: ${currentPendingTarget || 'none'}, task target: ${task.targetUpn})`);
                    }

                    // Remove task from queue and delete the pending key (if it matches)
                    await redis.zrem(this.QUEUE_KEY, taskJson);
                    if (currentPendingTarget === task.targetUpn) {
                        await redis.del(pendingKey);
                    }
                }
            } catch (loopErr: unknown) {
                const msg = loopErr instanceof Error ? loopErr.message : String(loopErr);
                safeConsoleError('[pending-upn-worker.ts][start] Loop Error:', msg);
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }
    }

    static stop() {
        this.shouldStop = true;
    }
}
