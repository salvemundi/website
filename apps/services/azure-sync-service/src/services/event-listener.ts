import { safeConsoleError } from '../utils/logger.js';
import { Redis } from 'ioredis';
import { ProvisionWorkerService } from './provision-worker.js';
import { AuditService } from './audit.service.js';
import { PaymentSuccessEventSchema } from '@salvemundi/validations';

export class EventListenerService {
    private static readonly STREAM_KEY = 'v7:events';
    private static readonly GROUP_NAME = 'azure-sync-group';
    private static readonly CONSUMER_NAME = 'azure-consumer-1';
    private static shouldStop = false;

    static async start(redis: Redis) {
        console.log('[AzureEventListener] Starting Redis Stream listener...');

        try {
            await redis.xgroup('CREATE', this.STREAM_KEY, this.GROUP_NAME, '0', 'MKSTREAM');
        } catch (error: any) {
            if (!error.message.includes('BUSYGROUP')) {
                safeConsoleError('[AzureEventListener] Error creating consumer group:', error);
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
                            const data: Record<string, string> = {};
                            for (let i = 0; i < fields.length; i += 2) {
                                data[fields[i]] = fields[i + 1];
                            }

                            await this.handleEvent(redis, { id, data });
                            await redis.xack(this.STREAM_KEY, this.GROUP_NAME, id);
                        }
                    }
                }
            } catch (error: any) {
                safeConsoleError('[AzureEventListener] Loop Error:', error.message);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    private static async handleEvent(redis: Redis, message: any) {
        try {
            const rawData = JSON.parse(message.data.payload);
            console.log(`[AzureEventListener] Received event: ${rawData.event}`);

            if (rawData.event === 'PAYMENT_SUCCESS') {
                const data = PaymentSuccessEventSchema.parse(rawData);

                if (data.registrationType === 'membership') {
                    if (data.userId) {
                        // 1. Existing user: Membership Renewal / Extension
                        await ProvisionWorkerService.queueProvisioning(redis, data.userId, data.paymentId);
                        await AuditService.logMembershipRenewal(data.email, data.userId, data.paymentId);
                        console.log(`[AzureEventListener] Queued renewal for user ${data.userId}`);
                    } else {
                        // 2. New user: Membership Provisioning (Direct to Management Service)
                        const managementUrl = process.env.AZURE_MANAGEMENT_SERVICE_URL;
                        const token = process.env.INTERNAL_SERVICE_TOKEN;

                        if (managementUrl && token) {
                            const res = await fetch(`${managementUrl}/api/provisioning/user`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    email: data.email,
                                    firstName: data.firstName,
                                    lastName: data.lastName,
                                    phoneNumber: data.phoneNumber,
                                    dateOfBirth: data.dateOfBirth,
                                    paymentId: data.paymentId
                                })
                            });

                            if (!res.ok) throw new Error(`Management service error: ${await res.text()}`);

                            await AuditService.logMembershipProvisioning(data.email, data.firstName || '', data.lastName || '', data.paymentId);
                            console.log(`[AzureEventListener] Triggered new user provisioning for ${data.email}`);
                        } else {
                            console.warn('[AzureEventListener] Skipping provisioning: AZURE_MANAGEMENT_SERVICE_URL or token missing');
                        }
                    }
                } else {
                    console.log(`[AzureEventListener] Ignored PAYMENT_SUCCESS for non-membership type: ${data.registrationType}`);
                }
            }
        } catch (error: any) {
            safeConsoleError('[AzureEventListener] Error handling event:', error.message);
        }
    }

    static stop() {
        this.shouldStop = true;
    }
}
