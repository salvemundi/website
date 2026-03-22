import Redis from 'ioredis';
import { ProvisionWorkerService } from './provision-worker.js';
import { PaymentSuccessEventSchema } from '@salvemundi/validations'; // Belangrijk: gebruik het gedeelde contract!

export class EventListenerService {
    private static readonly STREAM_KEY = 'v7:events';
    private static readonly GROUP_NAME = 'azure-sync-group';
    private static readonly CONSUMER_NAME = 'azure-consumer-1';
    private static shouldStop = false;

    static async start(redis: Redis) {
        console.log('[AzureEventListener] Starting Redis Stream listener...');

        try {
            await redis.xgroup('CREATE', this.STREAM_KEY, this.GROUP_NAME, '0', 'MKSTREAM');
        } catch (err: any) {
            if (!err.message.includes('BUSYGROUP')) {
                console.error('[AzureEventListener] Error creating consumer group:', err);
            }
        }

        while (!this.shouldStop) {
            try {
                const response = (await redis.xreadgroup(
                    'GROUP', this.GROUP_NAME, this.CONSUMER_NAME,
                    'COUNT', 1, 'BLOCK', 5000,
                    'STREAMS', this.STREAM_KEY, '>'
                )) as any[];

                if (response && response.length > 0) {
                    for (const [stream, messages] of response) {
                        for (const [id, fields] of messages) {
                            // Convert flat fields array [f1, v1, f2, v2] to object
                            const data: any = {};
                            for (let i = 0; i < fields.length; i += 2) {
                                data[fields[i]] = fields[i + 1];
                            }
                            
                            await this.handleEvent(redis, { id, data });
                            await redis.xack(this.STREAM_KEY, this.GROUP_NAME, id);
                        }
                    }
                }
            } catch (err: any) {
                console.error('[AzureEventListener] Loop Error:', err.message);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    private static async handleEvent(redis: Redis, message: any) {
        try {
            const rawData = JSON.parse(message.data.payload);
            console.log(`[AzureEventListener] Received event: ${rawData.event}`);

            if (rawData.event === 'PAYMENT_SUCCESS') {
                // Valideer de inkomende payload met Zod
                const data = PaymentSuccessEventSchema.parse(rawData);
                
                // DE FIX: Alleen provisionen als het daadwerkelijk een lidmaatschap is!
                if (data.registrationType === 'membership' && data.userId) {
                    await ProvisionWorkerService.queueProvisioning(redis, data.userId, data.paymentId);
                    console.log(`[AzureEventListener] Queued membership provisioning for user ${data.userId}`);
                } else {
                    console.log(`[AzureEventListener] Ignored PAYMENT_SUCCESS for non-membership type: ${data.registrationType}`);
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
