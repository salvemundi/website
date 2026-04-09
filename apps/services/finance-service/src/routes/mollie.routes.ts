import { FastifyInstance } from 'fastify';
import { timingSafeCompare, PaymentSuccessEventSchema } from '@salvemundi/validations';
import { DirectusRetryService } from '../services/directus-retry.service.js';
import { AzureRetryService } from '../services/azure-retry.service.js';

export default async function mollieRoutes(fastify: FastifyInstance) {
    /**
     * POST /api/finance/webhook/mollie
     * Payload: { id: "tr_..." }
     */
    fastify.post('/webhook/mollie', async (request: any, reply) => {
        const webhookSecret = process.env.MOLLIE_WEBHOOK_SECRET;
        if (webhookSecret) {
            const headerSecretRaw = request.headers['x-webhook-secret'];
            const headerSecret = Array.isArray(headerSecretRaw) ? headerSecretRaw[0] : headerSecretRaw;
            const queryTokenRaw = request.query?.token;
            const queryToken = Array.isArray(queryTokenRaw) ? queryTokenRaw[0] : queryTokenRaw;

            const isAuthorized = timingSafeCompare(headerSecret || '', webhookSecret) || 
                                timingSafeCompare(queryToken || '', webhookSecret);

            if (!isAuthorized) {
                return reply.status(401).send({ error: 'Unauthorized' });
            }
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

            // 3. Trigger Cache Invalidation for Next.js
            const { CacheInvalidationService } = await import('../services/cache-invalidation.js');

            if (userId) {
                await CacheInvalidationService.queueInvalidation(fastify.redis, userId);
            }

            // 4. Publish Event to Redis Stream & Direct Update to Directus
            if (payment.status === 'paid') {
                const registrationType = metadata?.registrationType;

                // Fetch qr_token if it's an event signup
                let qrToken: string | undefined = undefined;
                if (registrationId && registrationType === 'event_signup') {
                    const qrResult = await fastify.db.query(
                        `SELECT qr_token FROM event_signups WHERE id = $1`,
                        [registrationId]
                    );
                    qrToken = qrResult.rows[0]?.qr_token;
                }
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
                    timestamp: new Date().toISOString()
                };

                // Validate payload with Zod
                const validatedEvent = PaymentSuccessEventSchema.parse(eventData);

                await fastify.redis.xadd('v7:events', '*', 'payload', JSON.stringify(validatedEvent));

                fastify.log.info(`[FINANCE] Published PAYMENT_SUCCESS event for payment ${id}`);

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

                // Handle regular registrations (Pub Crawl, Events, Trips)
                if (registrationId && registrationType) {
                    const collectionMap: Record<string, string> = {
                        'event_signup': 'event_signups',
                        'pub_crawl_signup': 'pub_crawl_signups',
                        'trip_signup': 'trip_signups'
                    };

                    const targetCollection = collectionMap[registrationType];

                    if (targetCollection) {
                        let updateData: any = { payment_status: 'paid' };

                        if (registrationType === 'trip_signup' && metadata?.paymentType) {
                            if (metadata.paymentType === 'deposit') {
                                updateData = { 
                                    deposit_paid: true, 
                                    deposit_paid_at: new Date().toISOString() 
                                };
                            } else if (metadata.paymentType === 'final') {
                                updateData = { 
                                    full_payment_paid: true, 
                                    full_payment_paid_at: new Date().toISOString() 
                                };
                            }
                        }

                        try {
                            await DirectusRetryService.queueUpdate(fastify.redis, targetCollection, registrationId, updateData);
                            fastify.log.info(`[FINANCE] Queued Directus update for ${targetCollection} ${registrationId}`);
                        } catch (qErr: any) {
                            fastify.log.error(`[FINANCE] Failed to queue Directus update for ${registrationId}:`, qErr);
                        }
                    }
                }
            }

            return { success: true };
        } catch (err: any) {
            fastify.log.error(`[FINANCE] Error processing webhook ${id}:`, err);
            return reply.status(500).send({ error: 'Internal processing error' });
        }
    });
}

