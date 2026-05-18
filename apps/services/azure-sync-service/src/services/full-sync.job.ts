import { safeConsoleError, logInfo } from '../utils/logger.js';
import { Redis } from 'ioredis';
import { DirectusService } from './directus.service.js';
import { SyncJob } from './sync/sync-job.js';

export class FullSyncJob {
    private static shouldStop: boolean = false;

    /**
     * Starts the nightly full sync loop (runs once a day at 03:00).
     */
    static async start(redis: Redis) {
        logInfo('[FullSyncJob] Starting nightly synchronization loop...');

        while (!FullSyncJob['shouldStop']) {
            try {
                // 1. Calculate delay until next 03:00 AM
                const now = new Date();
                const nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 3, 0, 0);

                // If it's already past 03:00 today, schedule for tomorrow
                if (now >= nextRun) {
                    nextRun.setDate(nextRun.getDate() + 1);
                }

                const delay = nextRun.getTime() - now.getTime();
                logInfo(`[FullSyncJob] Next full sync scheduled in ${Math.round(delay / 1000 / 60 / 60)} hours (at ${nextRun.toISOString()}).`);

                await new Promise(resolve => setTimeout(resolve, delay));
                if ((FullSyncJob as unknown as Record<string, boolean>).shouldStop) break;

                // 2. Check feature flag before running
                const isActive = await DirectusService.isFlagActive('auto_sync_nightly');
                if (!isActive) {
                    logInfo('[FullSyncJob] Nightly sync is DISABLED via feature flag. Skipping run.');
                    continue;
                }

                // 3. Trigger the sync job in "silent" mode (only default fields, no redundant logs)
                logInfo('[FullSyncJob] Triggering automated nightly sync...');
                await SyncJob.run(redis, {
                    fields: ['status', 'membership_status', 'membership_expiry', 'committees'],
                    silent: true
                });

            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : String(error);
                safeConsoleError('[FullSyncJob] Loop Error:', message);
                await new Promise(resolve => setTimeout(resolve, 300000)); // Retry in 5 min on fatal error
            }
        }
    }

    static stop() {
        this.shouldStop = true;
    }
}
