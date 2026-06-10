import { safeConsoleError, safeConsoleLog } from '../utils/logger.js';
import { type Redis } from 'ioredis';
import { EventHandlers } from './event-handlers.js';

export class EventListenerService {
    private static readonly STREAM_KEY = 'v7:events';
    private static readonly GROUP_NAME = 'mail-service-group';
    private static readonly CONSUMER_NAME = 'mail-consumer-1';
    private static shouldStop = false;

    static async start(redis: Redis) {
        safeConsoleLog('[MailEventListener] Starting Redis Stream listener...');

        try {
            await redis.xgroup('CREATE', this.STREAM_KEY, this.GROUP_NAME, '0', 'MKSTREAM');
        } catch (error: unknown) {
            if (error instanceof Error && !error.message.includes('BUSYGROUP')) {
                safeConsoleError('[MailEventListener] Error creating consumer group:', error);
            } else if (!(error instanceof Error)) {
                safeConsoleError('[MailEventListener] Unexpected error type during group creation:', String(error));
            }
        }

        while (!this.shouldStop) {
            try {
                const response = (await redis.xreadgroup(
                    'GROUP', this.GROUP_NAME, this.CONSUMER_NAME,
                    'COUNT', 1, 'BLOCK', 5000,
                    'STREAMS', this.STREAM_KEY, '>'
                )) as [string, [string, string[]][]][] | null;

                if (response && response.length > 0) {
                    for (const [, messages] of response) {
                        for (const [id, fields] of messages) {
                            const payloadIdx = fields.indexOf('payload');
                            if (payloadIdx !== -1 && fields[payloadIdx + 1]) {
                                const data = {
                                    payload: fields[payloadIdx + 1]
                                };
                                await this.handleEvent(redis, { id, data });
                            }
                            await redis.xack(this.STREAM_KEY, this.GROUP_NAME, id);
                        }
                    }
                }
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : String(error);
                safeConsoleError('[MailEventListener] Loop Error:', message);

                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    private static async handleEvent(redis: Redis, message: { id: string; data: Record<string, string> }) {
        try {
            if (!message.data.payload) {
                safeConsoleLog(`[MailEventListener] Message ${message.id} missing payload`);
                return;
            }
            const payload = JSON.parse(message.data.payload) as { event?: string };
            safeConsoleLog(`[MailEventListener] Received event: ${payload.event}`);

            if (payload.event === 'PAYMENT_SUCCESS') {
                await EventHandlers.handlePaymentSuccess(redis, payload);
            } else if (payload.event === 'ACTIVITY_SIGNUP_SUCCESS') {
                await EventHandlers.handleActivitySignup(redis, payload);
            }
        } catch (error: unknown) {
            const messageStr = error instanceof Error ? error.message : String(error);
            safeConsoleError('[MailEventListener] Error handling event:', messageStr);
        }
    }

    static stop() {
        this.shouldStop = true;
    }
}