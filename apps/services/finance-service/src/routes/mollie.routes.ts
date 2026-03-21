import { FastifyInstance } from 'fastify';
import { timingSafeCompare, PaymentSuccessEventSchema } from '@salvemundi/validations';

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

            // 2. Update status in PostgreSQL
            await fastify.db.query(
                `UPDATE transactions SET status = $1, updated_at = NOW() WHERE mollie_id = $2`,
                [payment.status, id]
            );

            // 3. Trigger Cache Invalidation for Next.js
            const { CacheInvalidationService } = await import('../services/cache-invalidation.js');

            const metadata = payment.metadata as { userId?: string; registrationId?: string | number; registrationType?: string; email?: string } | null;
            const userId = metadata?.userId;

            if (userId) {
                await CacheInvalidationService.queueInvalidation(fastify.redis, userId);
            }

            // 4. Publish Event to Redis Stream & Direct Update to Directus
            if (payment.status === 'paid') {
                const registrationId = metadata?.registrationId;
                const registrationType = metadata?.registrationType;
                const email = (payment as any).consumerEmail || metadata?.email;

                const eventData = {
                    event: 'PAYMENT_SUCCESS',
                    userId: userId,
                    paymentId: id,
                    email: email,
                    registrationId: registrationId,
                    registrationType: registrationType,
                    timestamp: new Date().toISOString()
                };

                // Validate payload with Zod
                const validatedEvent = PaymentSuccessEventSchema.parse(eventData);

                await fastify.redis.xAdd('v7:events', '*', {
                    payload: JSON.stringify(validatedEvent)
                });

                fastify.log.info(`[FINANCE] Published PAYMENT_SUCCESS event for payment ${id}`);

                // Direct Update to Directus for reliability
                if (registrationId && registrationType) {
                    const collectionMap: Record<string, string> = {
                        'event_signup': 'event_signups',
                        'pub_crawl_signup': 'pub_crawl_signups',
                        'trip_signup': 'trip_signups'
                    };

                    const targetCollection = collectionMap[registrationType];

                    if (targetCollection) {
                        const { createDirectus, rest, staticToken, updateItem } = await import('@directus/sdk');
                        const directusUrl = process.env.INTERNAL_DIRECTUS_URL || process.env.DIRECTUS_URL!;
                        const directusToken = process.env.DIRECTUS_STATIC_TOKEN!;
                        
                        const directus = createDirectus(directusUrl)
                            .with(staticToken(directusToken))
                            .with(rest());

                        try {
                            await directus.request(updateItem(targetCollection as any, registrationId as any, {
                                payment_status: 'paid'
                            }));
                            fastify.log.info(`[FINANCE] Directly updated Directus ${targetCollection} ${registrationId} to paid`);
                        } catch (dErr: any) {
                            fastify.log.error(`[FINANCE] Failed to update Directus directly for ${registrationId}:`, dErr);
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

