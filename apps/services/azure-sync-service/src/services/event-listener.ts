import { createClient } from 'redis';
import { ProvisionWorkerService } from './provision-worker.js';

export class EventListenerService {
    private static readonly STREAM_KEY = 'v7:events';
    private static readonly GROUP_NAME = 'azure-sync-group';
    private static readonly CONSUMER_NAME = 'azure-consumer-1';
    private static shouldStop = false;

    static async start(redis: ReturnType<typeof createClient>) {
        console.log('[AzureEventListener] Starting Redis Stream listener...');

        try {
            await redis.xGroupCreate(this.STREAM_KEY, this.GROUP_NAME, '0', { MKSTREAM: true });
        } catch (err: any) {
            if (!err.message.includes('BUSYGROUP')) {
                console.error('[AzureEventListener] Error creating consumer group:', err);
            }
        }

        while (!this.shouldStop) {
            try {
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
                            await redis.xAck(this.STREAM_KEY, this.GROUP_NAME, message.id);
                        }
                    }
                }
            } catch (err: any) {
                console.error('[AzureEventListener] Loop Error:', err.message);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    private static async handleEvent(redis: ReturnType<typeof createClient>, message: any) {
        try {
            const data = JSON.parse(message.data.payload);
            console.log(`[AzureEventListener] Received event: ${data.event}`);

            if (data.event === 'PAYMENT_SUCCESS') {
                const { userId, paymentId } = data;
                if (userId) {
                    await ProvisionWorkerService.queueProvisioning(redis, userId, paymentId);
                    console.log(`[AzureEventListener] Queued provisioning for user ${userId}`);
                }
            }
        } catch (err: any) {
            console.error('[AzureEventListener] Error handling event:', err.message);
        }
    }

    static stop() {
        this.shouldStop = true;
    }
}
