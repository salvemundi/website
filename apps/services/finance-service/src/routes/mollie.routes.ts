import { FastifyInstance } from 'fastify';
import { timingSafeCompare, PaymentSuccessEventSchema } from '@salvemundi/validations';
import { DirectusRetryService } from '../services/directus-retry.service.js';
import { AzureRetryService } from '../services/azure-retry.service.js';
import { RegistrationService } from '../services/registration.service.js';

export default async function mollieRoutes(fastify: FastifyInstance) {
    /**
     * POST /api/finance/webhook/mollie
     * Payload: { id: "tr_..." }
     */
    fastify.post('/webhook/mollie', async (request: any, reply) => {
        const webhookSecret = process.env.MOLLIE_WEBHOOK_SECRET;
        if (!webhookSecret) {
            fastify.log.error('[FINANCE] MOLLIE_WEBHOOK_SECRET is NOT SET. Webhook processing disabled for security.');
            return reply.status(500).send({ error: 'Webhook secret not configured' });
        }

        const headerSecretRaw = request.headers['x-webhook-secret'];
        const headerSecret = Array.isArray(headerSecretRaw) ? headerSecretRaw[0] : headerSecretRaw;
        const queryTokenRaw = request.query?.token;
        const queryToken = Array.isArray(queryTokenRaw) ? queryTokenRaw[0] : queryTokenRaw;

        const isAuthorized = timingSafeCompare(headerSecret || '', webhookSecret) || 
                            timingSafeCompare(queryToken || '', webhookSecret);

        if (!isAuthorized) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        const { id } = request.body;

        if (!id) {
            return reply.status(400).send({ error: 'Missing payment ID' });
        }

        fastify.log.info(`[FINANCE] Received Mollie webhook for payment ${id}`);

        try {
            // 1. Fetch current status from Mollie
            const { getMollieClient } = await import('../services/mollie.service.js');
            const mollie = getMollieClient();
            const payment = await mollie.payments.get(id);

            const metadata = payment.metadata as { 
                userId?: string; 
                registrationId?: string | number; 
                registrationType?: string; 
                email?: string;
                isContribution?: boolean;
                paymentType?: string;
            } | null;
            const userId = metadata?.userId;

            // 2. Update payment_status in PostgreSQL (matches Directus schema)
            const dbUpdate = await fastify.db.query(
                `UPDATE transactions SET payment_status = $1, updated_at = NOW() WHERE mollie_id = $2 RETURNING access_token, registration`,
                [payment.status, id]
            );
            const accessToken = dbUpdate.rows[0]?.access_token;
            const registrationId = dbUpdate.rows[0]?.registration || metadata?.registrationId;

            if (userId) {
                const { CacheInvalidationService } = await import('../services/cache-invalidation.js');
                await CacheInvalidationService.queueInvalidation(fastify.redis, userId);
            }

            // [NEW] Check Manual Approval Status for Memberships
            const isContribution = !!metadata?.isContribution;
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
                [approvalStatus, id]
            );

            // 4. Publish Event & Processing (Only if approved or NOT a membership)
            if (payment.status === 'paid' && approvalStatus === 'approved') {
                const registrationType = metadata?.registrationType;

                // 4a. Update Registration status (SQL + Directus Shadow Write)
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
                        fastify.log.error(regErr, `[FINANCE] Failed to update registration for ${id}`);
                    }
                }

                // 4b. Fetch qr_token if it's an event signup
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

                // 5. Publish Event for async processing (Mail, Azure, etc.)
                const email = (payment as any).consumerEmail || metadata?.email;
                const eventData = {
                    event: 'PAYMENT_SUCCESS',
                    userId: userId,
                    paymentId: id,
                    email: email,
                    registrationId: registrationId,
                    registrationType: registrationType,
                    isContribution: !!metadata?.isContribution,
                    isNewMember: (metadata as any)?.isNewMember === 'true' || (metadata as any)?.isNewMember === true,
                    qrToken: qrToken,
                    accessToken: accessToken,
                    firstName: (metadata as any)?.firstName,
                    lastName: (metadata as any)?.lastName,
                    phoneNumber: (metadata as any)?.phoneNumber,
                    dateOfBirth: (metadata as any)?.dateOfBirth,
                    timestamp: new Date().toISOString()
                };

                try {
                    // Validate payload with Zod
                    const validatedEvent = PaymentSuccessEventSchema.parse(eventData);
                    await fastify.redis.xadd('v7:events', '*', 'payload', JSON.stringify(validatedEvent));
                    fastify.log.info(`[FINANCE] Published PAYMENT_SUCCESS event for payment ${id}`);
                } catch (eventErr) {
                    fastify.log.error(eventErr, `[FINANCE] Failed to publish event for payment ${id} (Update was still processed)`);
                }

                // Handle Membership (isContribution)
                const isContribution = metadata?.isContribution;
                if (isContribution && userId) {
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
                            fastify.log.info(`[FINANCE] Queued Azure membership update for user ${userId} (${user.entra_id})`);
                        } else {
                            fastify.log.warn(`[FINANCE] Membership payment for user ${userId} but no Entra ID found.`);
                        }
                    } catch (dErr) {
                        fastify.log.error({ err: dErr }, `[FINANCE] Failed to fetch user ${userId} for Azure update`);
                    }
                }

            } else if (payment.status === 'paid' && approvalStatus === 'pending') {
                fastify.log.info(`[FINANCE] Payment ${id} is PAID but pending manual approval.`);
            } else if (['failed', 'canceled', 'expired'].includes(payment.status)) {
                fastify.log.info(`[FINANCE] Payment ${id} failed with status: ${payment.status}. Logging to system_logs.`);
                try {
                    const { createDirectus, rest, staticToken, createItem } = await import('@directus/sdk');
                    const directusUrl = process.env.DIRECTUS_SERVICE_URL || process.env.DIRECTUS_URL!;
                    const directusToken = process.env.DIRECTUS_STATIC_TOKEN!;
                    const directus = createDirectus(directusUrl).with(staticToken(directusToken)).with(rest());

                    const adminPayload = {
                        action: 'PAYMENT_FAILED',
                        mollie_id: id,
                        status: payment.status,
                        email: metadata?.email,
                        name: `${(metadata as any)?.firstName || ''} ${(metadata as any)?.lastName || ''}`.trim(),
                        amount: payment.amount?.value,
                        product_type: metadata?.registrationType || 'membership',
                        timestamp: new Date().toISOString()
                    };

                    await directus.request(createItem('system_logs' as any, {
                        type: 'payment_failed',
                        status: 'INFO',
                        payload: adminPayload
                    }));
                } catch (logErr) {
                    fastify.log.error(`[FINANCE] Failed to log payment failure for ${id}: ${logErr}`);
                }
            }

            return { success: true };
        } catch (err: any) {
            fastify.log.error(`[FINANCE] Error processing webhook ${id}:`, err);
            return reply.status(500).send({ error: 'Internal processing error' });
        }
    });
}

