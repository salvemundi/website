import { FastifyInstance } from 'fastify';
import { PaymentSuccessEventSchema } from '@salvemundi/validations';
import { RegistrationService } from './registration.service.js';
import { AzureRetryService } from './azure-retry.service.js';
import { CacheInvalidationService } from './cache-invalidation.js';

/**
 * PaymentService: Centralized logic for finalizing payments.
 * Handles database updates, event publishing, and downstream service triggers.
 */
export class PaymentService {
    static async finalizePayment(
        fastify: FastifyInstance,
        paymentId: string,
        status: string,
        metadata: any,
        accessToken: string
    ) {
        const userId = metadata?.userId;
        const isContribution = !!metadata?.isContribution;
        const registrationId = metadata?.registrationId;
        const registrationType = metadata?.registrationType;

        // 1. Update Database Status
        await fastify.db.query(
            `UPDATE transactions SET payment_status = $1, updated_at = NOW() WHERE mollie_id = $2`,
            [status, paymentId]
        );

        if (userId) {
            await CacheInvalidationService.queueInvalidation(fastify.redis, userId);
        }

        // 2. Handle Manual Approval Logic for Memberships
        let manualApproval = false;
        try {
            const { createDirectus, rest, staticToken, readItems } = await import('@directus/sdk');
            const directusUrl = process.env.DIRECTUS_SERVICE_URL || process.env.DIRECTUS_URL!;
            const directusToken = process.env.DIRECTUS_STATIC_TOKEN!;
            const directus = createDirectus(directusUrl).with(staticToken(directusToken)).with(rest());

            const flags = await directus.request(readItems('feature_flags' as any, {
                filter: { name: { _eq: 'manual_approval' } },
                fields: ['is_active']
            }));
            manualApproval = (flags?.[0] as any)?.is_active ?? false;
        } catch (authErr) {
            fastify.log.error(`[FINANCE] Failed to check manual_approval flag: ${authErr}`);
        }

        const approvalStatus = (isContribution && manualApproval) ? 'pending' : 'approved';
        await fastify.db.query(
            `UPDATE transactions SET approval_status = $1 WHERE mollie_id = $2`,
            [approvalStatus, paymentId]
        );

        // 3. Process Success Actions (Only if approved)
        if (status === 'paid' && approvalStatus === 'approved') {
            // Update Registration Status
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
                    fastify.log.error(regErr, `[FINANCE] Failed to update registration for ${paymentId}`);
                }
            }

            // Fetch QR Token if applicable
            let qrToken: string | undefined = undefined;
            if (registrationId && registrationType === 'event_signup') {
                try {
                    const qrResult = await fastify.db.query(
                        'SELECT qr_token FROM event_signups WHERE id = $1',
                        [registrationId]
                    );
                    qrToken = qrResult.rows[0]?.qr_token;
                } catch (qrErr) {
                    fastify.log.error(qrErr, `[FINANCE] Failed to fetch QR token for registration ${registrationId}`);
                }
            }

            // Publish Event
            const eventData = {
                event: 'PAYMENT_SUCCESS',
                userId: userId,
                paymentId: paymentId,
                email: metadata?.email,
                registrationId: registrationId,
                registrationType: registrationType,
                isContribution: isContribution,
                isNewMember: metadata?.isNewMember === 'true' || metadata?.isNewMember === true,
                qrToken: qrToken,
                accessToken: accessToken,
                firstName: metadata?.firstName,
                lastName: metadata?.lastName,
                phoneNumber: metadata?.phoneNumber,
                dateOfBirth: metadata?.dateOfBirth,
                timestamp: new Date().toISOString()
            };

            try {
                const validatedEvent = PaymentSuccessEventSchema.parse(eventData);
                await fastify.redis.xadd('v7:events', '*', 'payload', JSON.stringify(validatedEvent));
                fastify.log.info(`[FINANCE] Published PAYMENT_SUCCESS event for ${paymentId}`);
            } catch (eventErr) {
                fastify.log.error(eventErr, `[FINANCE] Event validation failed for ${paymentId}`);
            }

            // Handle Azure Sync for Memberships
            if (isContribution && userId) {
                await this.triggerAzureSync(fastify, userId);
            }
        }
    }

    private static async triggerAzureSync(fastify: FastifyInstance, userId: string) {
        try {
            const { createDirectus, rest, staticToken, readUser } = await import('@directus/sdk');
            const directusUrl = process.env.DIRECTUS_SERVICE_URL || process.env.DIRECTUS_URL!;
            const directusToken = process.env.DIRECTUS_STATIC_TOKEN!;
            const directus = createDirectus(directusUrl).with(staticToken(directusToken)).with(rest());

            const user = await directus.request(readUser(userId, { fields: ['id', 'entra_id'] }));
            
            if (user?.entra_id) {
                const now = new Date();
                const expiry = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
                
                await AzureRetryService.queueUpdate(fastify.redis, user.entra_id, {
                    membershipExpiry: expiry.toISOString().split('T')[0],
                    originalPaymentDate: now.toISOString().split('T')[0]
                });
                fastify.log.info(`[FINANCE] Queued Azure membership update for user ${userId}`);
            }
        } catch (err) {
            fastify.log.error(err, `[FINANCE] Azure sync trigger failed for user ${userId}`);
        }
    }
}
