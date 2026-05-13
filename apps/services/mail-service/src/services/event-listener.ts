import { safeConsoleError } from '../utils/logger.js';
import { Redis } from 'ioredis';
import { EventHandlers } from './event-handlers.js';

export class EventListenerService {
    private static readonly STREAM_KEY = 'v7:events';
    private static readonly GROUP_NAME = 'mail-service-group';
    private static readonly CONSUMER_NAME = 'mail-consumer-1';
    private static shouldStop = false;

    /**
     * Start luisteren naar Redis Stream events.
     */
    static async start(redis: Redis) {
        console.log('[MailEventListener] Starting Redis Stream listener...');

        try {
            await redis.xgroup('CREATE', this.STREAM_KEY, this.GROUP_NAME, '0', 'MKSTREAM');
        } catch (error: unknown) {
            // We gebruiken 'error' direct. De herdeclaratie 'const error =' is verwijderd om TS2492 te voorkomen.
            if (error instanceof Error && !error.message.includes('BUSYGROUP')) {
                safeConsoleError('[MailEventListener] Error creating consumer group:', error);
            } else if (!(error instanceof Error)) {
                console.error('[MailEventListener] Unexpected error type during group creation:', String(error));
            }
        }

        while (!this.shouldStop) {
            try {
                const response = (await redis.xreadgroup(
                    'GROUP', this.GROUP_NAME, this.CONSUMER_NAME,
                    'COUNT', 1, 'BLOCK', 5000,
                    'STREAMS', this.STREAM_KEY, '>'
                )) as [string, [string, string[]][]][];

                if (response && response.length > 0) {
                    for (const [stream, messages] of response) {
                        for (const [id, fields] of messages) {
                            const data: Record<string, string> = {};
                            for (let i = 0; i < fields.length; i += 2) {
                                data[fields[i]] = fields[i + 1];
                            }

                            await this.handleEvent(redis, { id, data });
                            await redis.xack(this.STREAM_KEY, this.GROUP_NAME, id);
                        }
                    }
                }
            } catch (error: unknown) {
                // Volledige naleving van de "Zero-Any Policy": we casten niet naar any, maar gebruiken de message veilig.
                const message = error instanceof Error ? error.message : String(error);
                console.error('[MailEventListener] Loop Error:', message);

                // Voorkom CPU-spike bij constante fouten
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    /**
     * Dispatcht binnengekomen events naar de juiste handlers.
     */
    private static async handleEvent(redis: Redis, message: { id: string; data: Record<string, string> }) {
        try {
            if (!message.data.payload) {
                console.warn(`[MailEventListener] Message ${message.id} missing payload`);
                return;
            }
            const payload = JSON.parse(message.data.payload);
            console.log(`[MailEventListener] Received event: ${payload.event}`);

            if (payload.event === 'PAYMENT_SUCCESS') {
                await EventHandlers.handlePaymentSuccess(redis, payload);
            } else if (payload.event === 'ACTIVITY_SIGNUP_SUCCESS') {
                await EventHandlers.handleActivitySignup(redis, payload);
            }
        } catch (error: unknown) {
            const messageStr = error instanceof Error ? error.message : String(error);
            console.error('[MailEventListener] Error handling event:', messageStr);
        }
    }

    static stop() {
        this.shouldStop = true;
    }
}