import { FastifyInstance } from 'fastify';

export default async function mollieRoutes(fastify: FastifyInstance) {
    /**
     * POST /api/finance/webhook/mollie
     * Payload: { id: "tr_..." }
     */
    fastify.post('/webhook/mollie', async (request: any, reply) => {
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

            return { success: true };
        } catch (err: any) {
            fastify.log.error(`[FINANCE] Error processing webhook ${id}:`, err);
            return reply.status(500).send({ error: 'Internal processing error' });
        }
    });
}
