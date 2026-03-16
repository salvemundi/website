import { FastifyInstance } from 'fastify';
import { timingSafeCompare } from '@salvemundi/validations';

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
            // Idempotency: ON CONFLICT handled by existing schema or simple update
            // We assume 'transacties' table exists as per docs.
            await fastify.db.query(
                `UPDATE transactions SET status = $1, updated_at = NOW() WHERE mollie_id = $2`,
                [payment.status, id]
            );

            // 3. Trigger Cache Invalidation for Next.js
            // We'll use a separate service for this
            const { CacheInvalidationService } = await import('../services/cache-invalidation.js');

            // Get user identifier from payment metadata (assumed stored during checkout)
            const metadata = payment.metadata as { userId?: string } | null;
            const userId = metadata?.userId;

            if (userId) {
                await CacheInvalidationService.queueInvalidation(fastify.redis, userId);
            }

            // 4. Publish Event to Redis Stream
            if (payment.status === 'paid') {
                const eventData = {
                    event: 'PAYMENT_SUCCESS',
                    userId: userId,
                    paymentId: id,
                    email: (payment as any).consumerEmail || (payment.metadata as any)?.email,
                    timestamp: new Date().toISOString()
                };

                await fastify.redis.xAdd('v7:events', '*', {
                    payload: JSON.stringify(eventData)
                });

                fastify.log.info(`[FINANCE] Published PAYMENT_SUCCESS event for payment ${id}`);
            }

            return { success: true };
        } catch (err: any) {
            fastify.log.error(`[FINANCE] Error processing webhook ${id}:`, err);
            return reply.status(500).send({ error: 'Internal processing error' });
        }
    });
}
