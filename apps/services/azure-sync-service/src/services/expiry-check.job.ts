import { safeConsoleError, logInfo, logWarn } from '../utils/logger.js';
import { type Redis } from 'ioredis';
import { DirectusService } from './directus.service.js';
import { type DirectusUser } from '../types/schema.js';

export class ExpiryCheckJob {
    private static readonly REDIS_PREFIX = 'v7:mail:notified:';
    private static shouldStop = false;

    private static getConfig() {
        const mailUrl = process.env.MAIL_SERVICE_URL;
        const token = process.env.INTERNAL_SERVICE_TOKEN;
        return { mailUrl, token };
    }

    static async start(redis: Redis) {
        logInfo('expiry-check.job.ts][start]', 'Starting daily monitoring loop...');

        while (!this.shouldStop) {
            try {
                await this.runCheck(redis);

                const now = new Date();
                const nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0);
                const delay = nextRun.getTime() - now.getTime();

                logInfo('expiry-check.job.ts][start]', `Next check scheduled in ${Math.round(delay / 1000 / 60 / 60)} hours.`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } catch (error: unknown) {
                const typedError = error instanceof Error ? error : new Error(String(error));
                safeConsoleError('expiry-check.job.ts][start]', `Loop Error: ${typedError.message}`);
                await new Promise(resolve => setTimeout(resolve, 60000));
            }
        }
    }

    static async runCheck(redis: Redis) {
        logInfo('expiry-check.job.ts][runCheck]', 'Running membership expiry scan...');

        const todayStr = new Date().toISOString().split('T')[0];
        const lastRunKey = 'v7:expiry-check:last-run';
        const lockKey = 'lock:expiry-check:run';

        const lastRun = await redis.get(lastRunKey);
        if (lastRun === todayStr) {
            logInfo('expiry-check.job.ts][runCheck]', `Already successfully ran expiry check today (${todayStr}). Skipping.`);
            return;
        }

        const hasLock = await redis.set(lockKey, 'running', 'EX', 1800, 'NX');
        if (!hasLock) {
            logInfo('expiry-check.job.ts][runCheck]', 'Another instance is currently running the expiry check. Skipping.');
            return;
        }

        try {
            const isActive = await DirectusService.isFlagActive('mail_expiry_check');
            if (!isActive) {
                logInfo('expiry-check.job.ts][runCheck]', 'Automated membership emails are DISABLED via feature flag. Skipping run.');
                return;
            }

            const members = await DirectusService.getAllUsers();
            const now = new Date();

            for (const member of members) {
                if (!member.membership_expiry || member.status !== 'active') continue;

                const expiryDate = new Date(member.membership_expiry);
                const diffTime = expiryDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let milestone: 'reminder_30' | 'reminder_7' | 'expired' | null = null;

                if (diffDays === 30) milestone = 'reminder_30';
                else if (diffDays === 7) milestone = 'reminder_7';
                else if (diffDays <= 0 && diffDays >= -14) milestone = 'expired';

                if (milestone) {
                    await this.notifyMember(redis, member, milestone);
                }
            }

            await redis.set(lastRunKey, todayStr, 'EX', 86400 * 2);
        } finally {
            await redis.del(lockKey);
        }
    }

    private static async notifyMember(redis: Redis, member: DirectusUser, milestone: string) {
        const year = new Date().getFullYear();
        const redisKey = `${this.REDIS_PREFIX}${member.id}:${milestone}:${year}`;

        const exists = await redis.get(redisKey);
        if (exists) return;

        const templateId = milestone === 'expired' ? 'membership_expired' : 'membership_reminder';

        try {
            const { mailUrl, token } = this.getConfig();

            if (!mailUrl || !token) {
                logWarn('expiry-check.job.ts][notifyMember]', 'Missing Mail URL or Token. Cannot notify.');
                return;
            }

            const response = await fetch(`${mailUrl}/api/mail/send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    to: member.email,
                    templateId,
                    data: {
                        firstName: member.first_name,
                        expiryDate: member.membership_expiry,
                        daysLeft: milestone === 'reminder_30' ? 30 : (milestone === 'reminder_7' ? 7 : 0)
                    }
                })
            });

            if (response.ok) {
                await redis.set(redisKey, '1', 'EX', 86400 * 365);
                logInfo('expiry-check.job.ts][notifyMember]', `Notified ${member.email || 'leeg'} for milestone: ${milestone}`);
            } else {
                safeConsoleError('expiry-check.job.ts][notifyMember]', `Failed to send ${templateId} to ${member.email || 'leeg'}: ${response.statusText}`);
            }
        } catch (error: unknown) {
            const typedError = error instanceof Error ? error : new Error(String(error));
            safeConsoleError('expiry-check.job.ts][notifyMember]', `Error triggering mail for ${member.email || 'leeg'}: ${typedError.message}`);
        }
    }

    static stop() {
        this.shouldStop = true;
    }
}