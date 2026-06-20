import { safeConsoleError, logInfo } from '../utils/logger.js';
import { type Redis } from 'ioredis';
import { DirectusService } from './directus.service.js';
import { SyncJob } from './sync/sync-job.js';

export class FullSyncJob {
    private static shouldStop = false as boolean;

    static async start(redis: Redis) {
        logInfo('full-sync.job.ts][start]', 'Starting nightly synchronization loop...');

        while (!this.shouldStop) {
            try {
                const now = new Date();
                const nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 3, 0, 0);

                if (now >= nextRun) {
                    nextRun.setDate(nextRun.getDate() + 1);
                }

                const delay = nextRun.getTime() - now.getTime();
                logInfo('full-sync.job.ts][start]', `Next full sync scheduled in ${Math.round(delay / 1000 / 60 / 60)} hours (at ${nextRun.toISOString()}).`);

                await new Promise(resolve => setTimeout(resolve, delay));
                if (this.shouldStop) break;

                const isActive = await DirectusService.isFlagActive('auto_sync_nightly');
                if (!isActive) {
                    logInfo('full-sync.job.ts][start]', 'Nightly sync is DISABLED via feature flag. Skipping run.');
                    continue;
                }

                logInfo('full-sync.job.ts][start]', 'Triggering automated nightly sync...');
                await SyncJob.run(redis, {
                    fields: ['status', 'membership_status', 'membership_expiry', 'committees'],
                    silent: true
                });

            } catch (error: unknown) {
                const typedError = error instanceof Error ? error : new Error(String(error));
                safeConsoleError('full-sync.job.ts][start]', `Loop Error: ${typedError.message}`);
                await new Promise(resolve => setTimeout(resolve, 300000));
            }
        }
    }

    static stop() {
        this.shouldStop = true;
    }
}