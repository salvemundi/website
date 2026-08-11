import { type FastifyInstance } from 'fastify';
import { createDirectus, rest, staticToken, readItems} from '@directus/sdk';
import {
    PaymentSuccessEventSchema,
    type MolliePaymentMetadata,
    type Directus
} from '@salvemundi/validations';
import { schema, eq, sql } from '@salvemundi/db';
import { RegistrationService } from './registration.service.js';
import { CacheInvalidationService } from './cache-invalidation.js';

export interface FinanceMolliePaymentMetadata extends MolliePaymentMetadata {
    paymentType?: string;
    tripId?: number;
}

export class PaymentService {
    private static getDirectusClient() {
        const directusUrl = process.env.DIRECTUS_SERVICE_URL || process.env.DIRECTUS_URL || '';
        const directusToken = process.env.DIRECTUS_STATIC_TOKEN || '';

        if (!directusUrl || !directusToken) {
            throw new Error('Directus configuration is missing');
        }

        return createDirectus<Directus.Schema>(directusUrl).with(staticToken(directusToken)).with(rest());
    }

    static async finalizePayment(
        fastify: FastifyInstance,
        paymentId: string,
        newStatus: string,
        metadata: FinanceMolliePaymentMetadata | null | undefined,
        accessToken: string
    ) {
        const transaction = await fastify.db
            .select({
                payment_status: schema.transactions.payment_status,
                approval_status: schema.transactions.approval_status,
                user_id: schema.transactions.user_id,
                email: schema.transactions.email,
                first_name: schema.transactions.first_name,
                last_name: schema.transactions.last_name,
                product_type: schema.transactions.product_type,
                coupon_code: schema.transactions.coupon_code,
                product_name: schema.transactions.product_name,
                amount: schema.transactions.amount
            })
            .from(schema.transactions)
            .where(eq(schema.transactions.mollie_id, paymentId))
            .limit(1)
            .then((res: any[]) => res[0]);

        if (!transaction) {
            fastify.log.warn(`[payment-service][payment] Attempted to finalize non-existent transaction: ${paymentId}`);
            return;
        }

        const oldStatus = transaction.payment_status;

        if (oldStatus !== newStatus) {
            await fastify.db
                .update(schema.transactions)
                .set({
                    payment_status: newStatus ,
                    updated_at: new Date().toISOString()
                })
                .where(eq(schema.transactions.mollie_id, paymentId));

            fastify.log.info(`[FINANCE] Updated payment status for ${paymentId}: ${oldStatus} -> ${newStatus}`);

            if (['failed', 'canceled', 'expired'].includes(newStatus) &&
                oldStatus !== 'paid' &&
                !['failed', 'canceled', 'expired'].includes(oldStatus || '') &&
                transaction.coupon_code) {
                try {
                    await fastify.db.execute(sql`UPDATE coupons SET usage_count = GREATEST(0, usage_count - 1) WHERE UPPER(coupon_code) = UPPER(${transaction.coupon_code})`);
                    fastify.log.info(`[payment-service][coupon] Released coupon ${transaction.coupon_code} for failed/canceled/expired payment ${paymentId}`);
                } catch (couponErr) {
                    fastify.log.error({ err: couponErr }, `[payment-service][coupon] Failed to release coupon ${transaction.coupon_code} for payment ${paymentId}`);
                }
            }
        }

        if (newStatus === 'paid' && oldStatus !== 'paid') {
            const userId = metadata?.userId || transaction.user_id;
            const isContribution = !!metadata?.isContribution || transaction.product_type === 'membership';
            const registrationId = metadata?.registrationId;
            const registrationType = metadata?.registrationType;

            if (userId) {
                await CacheInvalidationService.queueInvalidation(fastify.redis, userId);
            }

            let approvalStatus = transaction.approval_status;
            if (approvalStatus === 'auto_approved') {
                let manualApproval = false;
                if (process.env.ENV_NAME === 'acc') {
                    manualApproval = true;
                } else {
                    try {
                        const directus = this.getDirectusClient();
                        const flags = await directus.request(readItems('feature_flags', {
                            filter: { name: { _eq: 'manual_approval' } },
                            fields: ['is_active']
                        })) as unknown as { is_active: boolean }[];
                        manualApproval = flags[0]?.is_active ?? false;
                    } catch (authErr) {
                        fastify.log.error({ err: authErr }, `[payment-service][manual-approval] Failed to check manual_approval flag: ${authErr instanceof Error ? authErr.message : String(authErr)}`);
                    }
                }

                approvalStatus = (isContribution && manualApproval) ? 'pending' : 'approved';
                await fastify.db
                    .update(schema.transactions)
                    .set({
                        approval_status: approvalStatus 
                    })
                    .where(eq(schema.transactions.mollie_id, paymentId));
            }

            if (approvalStatus === 'approved') {
                await this.processApprovedPayment(fastify, {
                    paymentId,
                    metadata,
                    registrationId,
                    registrationType,
                    userId,
                    accessToken,
                    isContribution,
                    transaction
                });
            } else {
                fastify.log.info(`[payment-service][approval] Payment ${paymentId} is PAID but pending manual approval.`);
            }
        }
    }

    private static async processApprovedPayment(
        fastify: FastifyInstance,
        context: {
            paymentId: string;
            metadata: FinanceMolliePaymentMetadata | null | undefined;
            registrationId?: string | number | null;
            registrationType?: string | null;
            userId?: string | null;
            accessToken?: string | null;
            isContribution: boolean;
            transaction: {
                payment_status: string | null;
                approval_status: string | null;
                user_id: string | null;
                email: string | null;
                first_name: string | null;
                last_name: string | null;
                product_type: string | null;
                product_name?: string | null;
                amount?: string | number | null;
            };
        }
    ) {
        const { paymentId, metadata, registrationId, registrationType, userId, accessToken, isContribution, transaction } = context;

        if (registrationId && registrationType) {
            try {
                await RegistrationService.updateStatus(
                    fastify.db,
                    fastify.redis,
                    {
                        registrationId,
                        registrationType,
                        paymentType: metadata?.paymentType
                    },
                    fastify.log
                );

                // Write audit system log for this automated payment completion
                let contextStr = '';
                let logType = '';
                let idPayload: Record<string, unknown> = {};

                if (registrationType === 'event_signup') {
                    contextStr = 'activiteit';
                    logType = 'system_event_signup_payment';
                    idPayload = { id: Number(registrationId) };
                } else if (registrationType === 'trip_signup') {
                    contextStr = 'reis';
                    logType = 'system_trip_signup_payment';
                    idPayload = { signup_id: Number(registrationId) };
                } else if (registrationType === 'webshop_preorder') {
                    contextStr = 'webshop';
                    logType = 'system_webshop_preorder_payment';
                    idPayload = { preorder_id: Number(registrationId) };
                } else if (registrationType === 'pub_crawl_signup') {
                    contextStr = 'kroegentocht';
                    logType = 'system_pub_crawl_signup_payment';
                    idPayload = { signup_id: Number(registrationId) };
                }

                if (logType) {
                    const environment = process.env.ENV_NAME === 'prod'
                        ? 'productie'
                        : (process.env.ENV_NAME === 'acc' ? 'acceptatie' : 'ontwikkeling');

                    await fastify.db.insert(schema.system_logs).values({
                        type: logType,
                        status: 'SUCCESS',
                        payload: {
                            context: contextStr,
                            payment_id: paymentId,
                            email: transaction.email || metadata?.email || null,
                            naam: `${transaction.first_name || metadata?.firstName || ''} ${transaction.last_name || metadata?.lastName || ''}`.trim() || 'Onbekend',
                            product: transaction.product_name || null,
                            amount: transaction.amount ? Number(transaction.amount) : null,
                            ...idPayload,
                            details: `Betaling ontvangen via Mollie. Inschrijving status bijgewerkt.`,
                            admin_name: 'Systeem',
                            environment
                        }
                    });
                    fastify.log.info(`[payment-service][audit-log] Logged success payment event ${logType} for ${paymentId}`);
                }
            } catch (regErr) {
                fastify.log.error({ err: regErr }, `[payment-service][registration] Failed to update registration for ${paymentId}`);
            }
        }

        let qrToken: string | undefined = undefined;
        if (registrationId && registrationType === 'event_signup') {
            try {
                const qrResult = await fastify.db
                    .select({ qr_token: schema.event_signups.qr_token })
                    .from(schema.event_signups)
                    .where(eq(schema.event_signups.id, Number(registrationId)))
                    .limit(1)
                    .then((res: any[]) => res[0]);
                qrToken = qrResult?.qr_token || undefined;
            } catch (qrErr) {
                fastify.log.error({ err: qrErr }, `[payment-service][qr] Failed to fetch QR token for registration ${registrationId}`);
            }
        }

        const eventData = {
            event: 'PAYMENT_SUCCESS',
            userId: userId || null,
            paymentId: paymentId,
            email: transaction.email || metadata?.email || null,
            registrationId: registrationId || null,
            registrationType: registrationType || null,
            isContribution: isContribution,
            isNewMember: !userId && isContribution,
            qrToken: qrToken || null,
            accessToken: accessToken || null,
            firstName: transaction.first_name || metadata?.firstName || null,
            lastName: transaction.last_name || metadata?.lastName || null,
            phoneNumber: metadata?.phoneNumber || null,
            dateOfBirth: metadata?.dateOfBirth || null,
            timestamp: new Date().toISOString()
        };

        try {
            const validatedEvent = PaymentSuccessEventSchema.parse(eventData);
            await fastify.redis.xadd('v7:events', '*', 'payload', JSON.stringify(validatedEvent));
            fastify.log.info(`[payment-service][event] Published PAYMENT_SUCCESS event for ${paymentId}`);
        } catch (eventErr) {
            fastify.log.error({ err: eventErr }, `[payment-service][event] Event validation failed for ${paymentId}`);
        }
    }
}