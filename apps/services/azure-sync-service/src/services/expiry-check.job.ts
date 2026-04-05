import { Redis } from 'ioredis';
import { DirectusService } from './directus.service.js';

export class ExpiryCheckJob {
    private static readonly REDIS_PREFIX = 'v7:mail:notified:';
    private static shouldStop = false;

    /**
     * Starts the expiry check loop (runs once a day).
     */
    static async start(redis: Redis) {
        console.log('[ExpiryCheckJob] Starting daily monitoring loop...');
        
        while (!this.shouldStop) {
            try {
                // 1. Run the check
                await this.runCheck(redis);
                
                // 2. Wait 24 hours before next run (or check every hour but skip if already run today)
                const now = new Date();
                const nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0); // Next day at 09:00
                const delay = nextRun.getTime() - now.getTime();
                
                console.log(`[ExpiryCheckJob] Next check scheduled in ${Math.round(delay / 1000 / 60 / 60)} hours.`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } catch (err: any) {
                console.error('[ExpiryCheckJob] Loop Error:', err.message);
                await new Promise(resolve => setTimeout(resolve, 60000)); // Retry in 1 min
            }
        }
    }

    static async runCheck(redis: Redis) {
        console.log('[ExpiryCheckJob] Running membership expiry scan...');
        
        const members = await DirectusService.getAllUsers();
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        for (const member of members) {
            if (!member.membership_expiry || member.status !== 'active') continue;

            const expiryDate = new Date(member.membership_expiry);
            const diffTime = expiryDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let milestone: 'reminder_30' | 'reminder_7' | 'expired' | null = null;

            if (diffDays === 30) milestone = 'reminder_30';
            else if (diffDays === 7) milestone = 'reminder_7';
            else if (diffDays <= 0) milestone = 'expired';

            if (milestone) {
                await this.notifyMember(redis, member, milestone);
            }
        }
    }

    private static async notifyMember(redis: Redis, member: any, milestone: string) {
        const year = new Date().getFullYear();
        const redisKey = `${this.REDIS_PREFIX}${member.id}:${milestone}:${year}`;
        
        // Already notified for this milestone this year?
        const exists = await redis.get(redisKey);
        if (exists) return;

        const templateId = milestone === 'expired' ? 'membership_expired' : 'membership_reminder';
        
        try {
            const mailUrl = process.env.MAIL_SERVICE_URL;
            const token = process.env.INTERNAL_SERVICE_TOKEN;

            if (!mailUrl || !token) {
                console.warn('[ExpiryCheckJob] Missing Mail URL or Token. Cannot notify.');
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
                await redis.set(redisKey, '1', 'EX', 86400 * 365); // Cache for a year
                console.log(`[ExpiryCheckJob] Notified ${member.email} for milestone: ${milestone}`);
            } else {
                console.error(`[ExpiryCheckJob] Failed to send ${templateId} to ${member.email}:`, response.statusText);
            }
        } catch (err: any) {
            console.error(`[ExpiryCheckJob] Error triggering mail for ${member.email}:`, err.message);
        }
    }

    static stop() {
        this.shouldStop = true;
    }
}
