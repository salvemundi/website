import { safeConsoleError, logInfo } from '../utils/logger.js';
import { type Redis } from 'ioredis';
import { DirectusService } from './directus.service.js';
import { type Event, type EventSignup } from '../types/schema.js';

export class EventReminderJob {
    private static readonly REDIS_PREFIX = 'v7:mail:notified:event:';
    private static shouldStop = false;

    private static getConfig() {
        const mailUrl = process.env.MAIL_SERVICE_URL;
        const token = process.env.INTERNAL_SERVICE_TOKEN;
        return { mailUrl, token };
    }

    static async start(redis: Redis) {
        logInfo('event-reminder.job.ts][start]', 'Starting daily monitoring loop...');

        while (!this.shouldStop) {
            try {
                await this.runCheck(redis);

                const now = new Date();
                const nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 30, 0);
                const delay = nextRun.getTime() - now.getTime();

                logInfo('event-reminder.job.ts][start]', `Next check scheduled in ${Math.round(delay / 1000 / 60 / 60)} hours.`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } catch (error: unknown) {
                const typedError = error instanceof Error ? error : new Error(String(error));
                safeConsoleError('event-reminder.job.ts][start]', `Loop Error: ${typedError.message}`);
                await new Promise(resolve => setTimeout(resolve, 60000));
            }
        }
    }

    static async runCheck(redis: Redis) {
        logInfo('event-reminder.job.ts][runCheck]', 'Running upcoming event scan (3 days ahead)...');

        const isActive = await DirectusService.isFlagActive('mail_event_reminders');
        if (!isActive) {
            logInfo('event-reminder.job.ts][runCheck]', 'Automated event reminders are DISABLED via feature flag. Skipping run.');
            return;
        }

        const upcomingEvents = await DirectusService.getUpcomingEvents(3);
        logInfo('event-reminder.job.ts][runCheck]', `Found ${upcomingEvents.length} events scheduled in 3 days.`);

        for (const event of upcomingEvents) {
            const signups = await DirectusService.getPaidEventSignups(event.id);
            logInfo('event-reminder.job.ts][runCheck]', `Notifying ${signups.length} participants for event: ${event.name}`);

            for (const signup of signups) {
                await this.notifyParticipant(redis, event, signup);
            }
        }
    }

    private static async notifyParticipant(redis: Redis, event: Event, signup: EventSignup) {
        const redisKey = `${this.REDIS_PREFIX}${signup.id}:reminder_3d`;

        const exists = await redis.get(redisKey);
        if (exists) return;

        try {
            const { mailUrl, token } = this.getConfig();

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
                await redis.set(redisKey, '1', 'EX', 86400 * 30);
            }
        } catch (error: unknown) {
            const typedError = error instanceof Error ? error : new Error(String(error));
            safeConsoleError('event-reminder.job.ts][notifyParticipant]', `Error notifying ${signup.participant_email}: ${typedError.message}`);
        }
    }

    static stop() {
        this.shouldStop = true;
    }
}