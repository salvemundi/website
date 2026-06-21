import { safeConsoleError, logInfo, logWarn } from '../utils/logger.js';
import { type Redis } from 'ioredis';
import { ProvisionWorkerService } from './provision-worker.js';
import { AuditService } from './audit.service.js';
import { PaymentSuccessEventSchema } from '@salvemundi/validations';

export class EventListenerService {
    private static readonly STREAM_KEY = 'v7:events';
    private static readonly GROUP_NAME = 'azure-sync-group';
    private static readonly CONSUMER_NAME = 'azure-consumer-1';
    private static shouldStop = false;

    private static getConfig() {
        const managementUrl = process.env.AZURE_MANAGEMENT_SERVICE_URL;
        const token = process.env.INTERNAL_SERVICE_TOKEN;
        return { managementUrl, token };
    }

    static async start(redis: Redis) {
        logInfo('[event-listener.ts][start] ', 'Starting Redis Stream listener...');

        try {
            await redis.xgroup('CREATE', this.STREAM_KEY, this.GROUP_NAME, '0', 'MKSTREAM');
        } catch (error: unknown) {
            const typedError = error instanceof Error ? error : new Error(String(error));
            if (!typedError.message.includes('BUSYGROUP')) {
                safeConsoleError('[event-listener.ts][start] ', `Error creating consumer group: ${typedError.message}`);
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
                            const data = Object.fromEntries(
                                Array.from({ length: fields.length / 2 }, (_, i) => [fields[i * 2], fields[i * 2 + 1]])
                            ) as Record<string, string>;

                            await this.handleEvent(redis, { id, data });
                            await redis.xack(this.STREAM_KEY, this.GROUP_NAME, id);
                        }
                    }
                }
            } catch (error: unknown) {
                const typedError = error instanceof Error ? error : new Error(String(error));
                safeConsoleError('[event-listener.ts][start] ', `Loop Error: ${typedError.message}`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    private static async handleEvent(redis: Redis, message: { id: string; data: Record<string, string> }) {
        try {
            const payloadStr = message.data.payload;
            if (!payloadStr) return;
            const rawData = JSON.parse(payloadStr) as Record<string, unknown>;
            logInfo('[event-listener.ts][handleEvent] ', `Received event: ${String(rawData.event)}`);

            if (rawData.event === 'PAYMENT_SUCCESS') {
                const data = PaymentSuccessEventSchema.parse(rawData);

                if (data.registrationType === 'membership') {
                    if (data.userId) {
                        await ProvisionWorkerService.queueProvisioning(redis, data.userId, data.paymentId);
                        await AuditService.logMembershipRenewal(data.email, data.userId, data.paymentId);
                        logInfo('[event-listener.ts][handleEvent] ', `Queued renewal for user ${data.userId}`);
                    } else {
                        const { managementUrl, token } = this.getConfig();

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
                            logInfo('[event-listener.ts][handleEvent] ', `Triggered new user provisioning for ${data.email}`);
                        } else {
                            logWarn('[event-listener.ts][handleEvent] ', 'Skipping provisioning: AZURE_MANAGEMENT_SERVICE_URL or token missing');
                        }
                    }
                } else {
                    logInfo('[event-listener.ts][handleEvent] ', `Ignored PAYMENT_SUCCESS for non-membership type: ${data.registrationType}`);
                }
            }
        } catch (error: unknown) {
            const typedError = error instanceof Error ? error : new Error(String(error));
            safeConsoleError('[event-listener.ts][handleEvent] ', `Error handling event: ${typedError.message}`);
        }
    }

    static stop() {
        this.shouldStop = true;
    }
}