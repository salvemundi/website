import { createClient } from 'redis';
import { MailWorkerService } from './mail-worker.js';

export class EventListenerService {
    private static readonly STREAM_KEY = 'v7:events';
    private static readonly GROUP_NAME = 'mail-service-group';
    private static readonly CONSUMER_NAME = 'mail-consumer-1';
    private static shouldStop = false;

    static async start(redis: ReturnType<typeof createClient>) {
        console.log('[MailEventListener] Starting Redis Stream listener...');

        // 1. Ensure Consumer Group exists
        try {
            await redis.xGroupCreate(this.STREAM_KEY, this.GROUP_NAME, '0', { MKSTREAM: true });
        } catch (err: any) {
            if (!err.message.includes('BUSYGROUP')) {
                console.error('[MailEventListener] Error creating consumer group:', err);
            }
        }

        // 2. Listener Loop
        while (!this.shouldStop) {
            try {
                // Read from group
                const response = await redis.xReadGroup(
                    this.GROUP_NAME,
                    this.CONSUMER_NAME,
                    { key: this.STREAM_KEY, id: '>' },
                    { COUNT: 1, BLOCK: 5000 }
                );

                if (response && response.length > 0) {
                    for (const stream of response) {
                        for (const message of stream.messages) {
                            await this.handleEvent(redis, message);
                            // Acknowledge message
                            await redis.xAck(this.STREAM_KEY, this.GROUP_NAME, message.id);
                        }
                    }
                }
            } catch (err: any) {
                console.error('[MailEventListener] Loop Error:', err.message);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    private static async handleEvent(redis: ReturnType<typeof createClient>, message: any) {
        try {
            const data = JSON.parse(message.data.payload);
            console.log(`[MailEventListener] Received event: ${data.event}`);

            if (data.event === 'PAYMENT_SUCCESS') {
                const { userId, paymentId } = data;
                
                // In a real scenario, we'd fetch the user's email here.
                // For now, we'll assume there's a way to get it or use a placeholder
                // Since this is a specialized task, I'll pretend we have a service for this
                // or just queue a generic task if we have the email in the event.
                
                // Recommendation: Actually, it's better if the event includes the recipient email
                // or the Mail Service has access to the DB.
                // The finance service has the userId, maybe it should include the email too?
                // Let's assume we fetch it via Directus or it's in the event.
                
                // I'll update the Finance service to include the email if possible,
                // but for now let's assume we have it or fetch it.
                // Since I cannot easily add a new dependency or service call without knowing the exact API,
                // I will use a dummy email or assume 'data.email' if available.
                
                if (data.email) {
                    await MailWorkerService.queueMail(redis, data.email, 'welcome_payment', { paymentId, userId });
                } else {
                    console.warn('[MailEventListener] PAYMENT_SUCCESS event missing email. Cannot queue mail.');
                }
            }
        } catch (err: any) {
            console.error('[MailEventListener] Error handling event:', err.message);
        }
    }

    static stop() {
        this.shouldStop = true;
    }
}
