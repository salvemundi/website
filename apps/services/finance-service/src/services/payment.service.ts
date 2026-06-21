import { type FastifyInstance } from 'fastify';
import { sql } from 'kysely';
import { createDirectus, rest, staticToken, readItems, readUser } from '@directus/sdk';
import {
    PaymentSuccessEventSchema,
    type FeatureFlag,
    type MolliePaymentMetadata,
    type Directus
} from '@salvemundi/validations';
import { type Database } from '../plugins/db.js';
import { RegistrationService } from './registration.service.js';
import { AzureRetryService } from './azure-retry.service.js';
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
            .selectFrom('transactions')
            .select(['payment_status', 'approval_status', 'user_id', 'email', 'first_name', 'last_name', 'product_type', 'coupon_code'])
            .where('mollie_id', '=', paymentId)
            .executeTakeFirst();

        if (!transaction) {
            fastify.log.warn(`[payment-service][payment] Attempted to finalize non-existent transaction: ${paymentId}`);
            return;
        }

        const oldStatus = transaction.payment_status;

        if (oldStatus !== newStatus) {
            await fastify.db
                .updateTable('transactions')
                .set({
                    payment_status: newStatus as Database['transactions']['payment_status'],
                    updated_at: new Date().toISOString()
                })
                .where('mollie_id', '=', paymentId)
                .execute();

            fastify.log.info(`[FINANCE] Updated payment status for ${paymentId}: ${oldStatus} -> ${newStatus}`);

            if (['failed', 'canceled', 'expired'].includes(newStatus) &&
                oldStatus !== 'paid' &&
                !['failed', 'canceled', 'expired'].includes(oldStatus || '') &&
                transaction.coupon_code) {
                try {
                    await sql`UPDATE coupons SET usage_count = GREATEST(0, usage_count - 1) WHERE UPPER(coupon_code) = UPPER(${transaction.coupon_code})`.execute(fastify.db);
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
                try {
                    const directus = this.getDirectusClient();
                    const flags = await directus.request(readItems('feature_flags', {
                        filter: { name: { _eq: 'manual_approval' } },
                        fields: ['is_active']
                    })) as FeatureFlag[];
                    manualApproval = flags[0]?.is_active ?? false;
                } catch (authErr) {
                    fastify.log.error({ err: authErr }, `[payment-service][manual-approval] Failed to check manual_approval flag: ${authErr instanceof Error ? authErr.message : String(authErr)}`);
                }

                approvalStatus = (isContribution && manualApproval) ? 'pending' : 'approved';
                await fastify.db
                    .updateTable('transactions')
                    .set({
                        approval_status: approvalStatus as Database['transactions']['approval_status']
                    })
                    .where('mollie_id', '=', paymentId)
                    .execute();
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
            transaction: Pick<
                Database['transactions'],
                | 'payment_status'
                | 'approval_status'
                | 'user_id'
                | 'email'
                | 'first_name'
                | 'last_name'
                | 'product_type'
            >;
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
            } catch (regErr) {
                fastify.log.error({ err: regErr }, `[payment-service][registration] Failed to update registration for ${paymentId}`);
            }
        }

        let qrToken: string | undefined = undefined;
        if (registrationId && registrationType === 'event_signup') {
            try {
                const qrResult = await fastify.db
                    .selectFrom('event_signups')
                    .select('qr_token')
                    .where('id', '=', Number(registrationId))
                    .executeTakeFirst();
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

        if (isContribution && userId) {
            await this.triggerAzureSync(fastify, userId);
        }
    }

    private static async triggerAzureSync(fastify: FastifyInstance, userId: string) {
        try {
            const directus = this.getDirectusClient();
            const user = await directus.request(readUser(userId, { fields: ['id', 'entra_id'] })) as { entra_id?: string | null };

            if (user.entra_id) {
                const now = new Date();
                const expiry = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

                await AzureRetryService.queueUpdate(fastify.redis, user.entra_id, {
                    membershipExpiry: expiry.toISOString().split('T')[0],
                    originalPaymentDate: now.toISOString().split('T')[0]
                });
                fastify.log.info(`[payment-service][azure-sync] Queued Azure membership update for user ${userId}`);
            }
        } catch (error) {
            fastify.log.error({ err: error }, `[payment-service][azure-sync] Azure sync trigger failed for user ${userId}`);
        }
    }
}