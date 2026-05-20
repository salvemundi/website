import { FastifyInstance } from 'fastify';
import { 
    PaymentSuccessEventSchema, 
    type DbFeatureFlag, 
    type DirectusSchema, 
    type DbTransaction, 
    type MolliePaymentMetadata 
} from '@salvemundi/validations';
import { RegistrationService } from './registration.service.js';
import { AzureRetryService } from './azure-retry.service.js';
import { CacheInvalidationService } from './cache-invalidation.js';

export interface FinanceMolliePaymentMetadata extends MolliePaymentMetadata {
    paymentType?: string;
    tripId?: number;
}

/**
 * PaymentService: Centralized logic for finalizing payments.
 * Handles database updates, event publishing, and downstream service triggers.
 * This is the SINGLE SOURCE OF TRUTH for payment finalization.
 */
export class PaymentService {
    static async finalizePayment(
        fastify: FastifyInstance,
        paymentId: string,
        newStatus: string,
        metadata: FinanceMolliePaymentMetadata | null | undefined,
        accessToken: string
    ) {
        // 1. Fetch current status to ensure idempotency and prevent duplicate events
        const transaction = await fastify.db
            .selectFrom('transactions')
            .select(['payment_status', 'approval_status', 'user_id', 'email', 'first_name', 'last_name', 'product_type', 'coupon_code'])
            .where('mollie_id', '=', paymentId)
            .executeTakeFirst();

        if (!transaction) {
            fastify.log.warn(`[FINANCE] Attempted to finalize non-existent transaction: ${paymentId}`);
            return;
        }

        const oldStatus = transaction.payment_status;

        // 2. Update Database Status (Immediate update for consistency)
        if (oldStatus !== newStatus) {
            await fastify.db
                .updateTable('transactions')
                .set({
                    payment_status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .where('mollie_id', '=', paymentId)
                .execute();
            fastify.log.info(`[FINANCE] Updated payment status for ${paymentId}: ${oldStatus} -> ${newStatus}`);

            // Release coupon if payment failed/canceled/expired and was not already finalized
            if (['failed', 'canceled', 'expired'].includes(newStatus) && 
                oldStatus !== 'paid' && 
                !['failed', 'canceled', 'expired'].includes(oldStatus || '') && 
                transaction.coupon_code) {
                try {
                    const { sql } = await import('kysely');
                    await sql`UPDATE coupons SET usage_count = GREATEST(0, usage_count - 1) WHERE UPPER(coupon_code) = UPPER(${transaction.coupon_code})`.execute(fastify.db);
                    fastify.log.info(`[FINANCE] Released coupon ${transaction.coupon_code} for failed/canceled/expired payment ${paymentId}`);
                } catch (couponErr) {
                    fastify.log.error({ err: couponErr }, `[FINANCE] Failed to release coupon ${transaction.coupon_code} for payment ${paymentId}`);
                }
            }
        }

        // 3. Only proceed with success logic if transitioning to 'paid' for the first time
        if (newStatus === 'paid' && oldStatus !== 'paid') {
            const userId = metadata?.userId || transaction.user_id;
            const isContribution = !!metadata?.isContribution || transaction.product_type === 'membership';
            const registrationId = metadata?.registrationId;
            const registrationType = metadata?.registrationType;

            if (userId) {
                await CacheInvalidationService.queueInvalidation(fastify.redis, userId);
            }

            // A. Handle Manual Approval Logic for Memberships
            let approvalStatus = transaction.approval_status;
            if (approvalStatus === 'auto_approved') { // Default state, might need update
                let manualApproval = false;
                try {
                    const { createDirectus, rest, staticToken, readItems } = await import('@directus/sdk');
                    const directusUrl = process.env.DIRECTUS_SERVICE_URL || process.env.DIRECTUS_URL || '';
                    const directusToken = process.env.DIRECTUS_STATIC_TOKEN || '';
                    
                    if (!directusUrl || !directusToken) {
                        throw new Error('Directus configuration is missing');
                    }

                    const directus = createDirectus<DirectusSchema>(directusUrl).with(staticToken(directusToken)).with(rest());

                    const flags = await directus.request(readItems('feature_flags', {
                        filter: { name: { _eq: 'manual_approval' } },
                        fields: ['is_active']
                    })) as DbFeatureFlag[];
                    manualApproval = flags[0]?.is_active ?? false;
                } catch (authErr) {
                    fastify.log.error({ err: authErr }, `[FINANCE] Failed to check manual_approval flag: ${authErr instanceof Error ? authErr.message : String(authErr)}`);
                }

                approvalStatus = (isContribution && manualApproval) ? 'pending' : 'approved';
                await fastify.db
                    .updateTable('transactions')
                    .set({
                        approval_status: approvalStatus
                    })
                    .where('mollie_id', '=', paymentId)
                    .execute();
            }

            // B. Process Success Actions (Only if approved)
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
                fastify.log.info(`[FINANCE] Payment ${paymentId} is PAID but pending manual approval.`);
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
                DbTransaction,
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

        // 1. Update Registration Status (SQL + Directus Shadow Write)
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
                fastify.log.error({ err: regErr }, `[FINANCE] Failed to update registration for ${paymentId}`);
            }
        }

        // 2. Fetch QR Token if applicable
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
                fastify.log.error({ err: qrErr }, `[FINANCE] Failed to fetch QR token for registration ${registrationId}`);
            }
        }

        // 3. Publish Success Event
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
            fastify.log.info(`[FINANCE] Published PAYMENT_SUCCESS event for ${paymentId}`);
        } catch (eventErr) {
            fastify.log.error({ err: eventErr }, `[FINANCE] Event validation failed for ${paymentId}`);
        }

        // 4. Handle Azure Sync for Memberships
        if (isContribution && userId) {
            await this.triggerAzureSync(fastify, userId);
        }
    }

    private static async triggerAzureSync(fastify: FastifyInstance, userId: string) {
        try {
            const { createDirectus, rest, staticToken, readUser } = await import('@directus/sdk');
            const directusUrl = process.env.DIRECTUS_SERVICE_URL || process.env.DIRECTUS_URL || '';
            const directusToken = process.env.DIRECTUS_STATIC_TOKEN || '';
            
            if (!directusUrl || !directusToken) {
                throw new Error('Directus configuration is missing');
            }

            const directus = createDirectus<DirectusSchema>(directusUrl).with(staticToken(directusToken)).with(rest());

            const user = await directus.request(readUser(userId, { fields: ['id', 'entra_id'] })) as { entra_id?: string | null };

            if (user.entra_id) {
                const now = new Date();
                const expiry = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

                await AzureRetryService.queueUpdate(fastify.redis, user.entra_id, {
                    membershipExpiry: expiry.toISOString().split('T')[0],
                    originalPaymentDate: now.toISOString().split('T')[0]
                });
                fastify.log.info(`[FINANCE] Queued Azure membership update for user ${userId}`);
            }
        } catch (error) {
            fastify.log.error({ err: error }, `[FINANCE] Azure sync trigger failed for user ${userId}`);
        }
    }
}
