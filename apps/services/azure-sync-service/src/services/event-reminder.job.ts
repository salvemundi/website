import { Redis } from 'ioredis';
import { DirectusService } from './directus.service.js';
import { Event, EventSignup } from '../types/schema.js';

export class EventReminderJob {
    private static readonly REDIS_PREFIX = 'v7:mail:notified:event:';
    private static shouldStop = false;

    /**
     * Starts the event reminder loop (runs once a day).
     */
    static async start(redis: Redis) {
        console.log('[EventReminderJob] Starting daily monitoring loop...');
        
        while (!this.shouldStop) {
            try {
                // 1. Run the check
                await this.runCheck(redis);
                
                // 2. Wait until next day at 09:00
                const now = new Date();
                const nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 30, 0); // Offset from Expiry job
                const delay = nextRun.getTime() - now.getTime();
                
                console.log(`[EventReminderJob] Next check scheduled in ${Math.round(delay / 1000 / 60 / 60)} hours.`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } catch (err: any) {
                console.error('[EventReminderJob] Loop Error:', err.message);
                await new Promise(resolve => setTimeout(resolve, 60000));
            }
        }
    }

    static async runCheck(redis: Redis) {
        console.log('[EventReminderJob] Running upcoming event scan (3 days ahead)...');
        
        const upcomingEvents = await DirectusService.getUpcomingEvents(3);
        console.log(`[EventReminderJob] Found ${upcomingEvents.length} events scheduled in 3 days.`);

        for (const event of upcomingEvents) {
            const signups = await DirectusService.getPaidEventSignups(event.id);
            console.log(`[EventReminderJob] Notifying ${signups.length} participants for event: ${event.name}`);

            for (const signup of signups) {
                await this.notifyParticipant(redis, event, signup);
            }
        }
    }

    private static async notifyParticipant(redis: Redis, event: Event, signup: EventSignup) {
        const redisKey = `${this.REDIS_PREFIX}${signup.id}:reminder_3d`;
        
        // Already notified?
        const exists = await redis.get(redisKey);
        if (exists) return;

        try {
            const mailUrl = process.env.MAIL_SERVICE_URL;
            const token = process.env.INTERNAL_SERVICE_TOKEN;

            if (!mailUrl || !token) return;

            const response = await fetch(`${mailUrl}/api/mail/send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    to: signup.participant_email,
                    templateId: 'event_reminder',
                    data: {
                        name: signup.participant_name,
                        eventName: event.name,
                        eventDate: event.event_date,
                        eventTime: event.event_time || 'TBD',
                        location: event.location || 'Nog te bepalen'
                    }
                })
            });

            if (response.ok) {
                await redis.set(redisKey, '1', 'EX', 86400 * 30); // Cache for a month
            }
        } catch (err: any) {
            console.error(`[EventReminderJob] Error notifying ${signup.participant_email}:`, err.message);
        }
    }

    static stop() {
        this.shouldStop = true;
    }
}
