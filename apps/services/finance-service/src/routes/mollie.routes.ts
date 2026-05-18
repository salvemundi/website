import { FastifyInstance } from 'fastify';
import { type MolliePaymentMetadata } from '@salvemundi/validations';
import { timingSafeCompare } from '@salvemundi/validations/security';

export default async function mollieRoutes(fastify: FastifyInstance) {
    await Promise.resolve();
    /**
     * POST /api/finance/webhook/mollie
     * Payload: { id: "tr_..." }
     */
    fastify.post<{ Body: { id: string }, Querystring: { token?: string } }>('/webhook/mollie', async (request, reply) => {
        const webhookSecret = process.env.MOLLIE_WEBHOOK_SECRET;
        if (!webhookSecret) {
            fastify.log.error('[FINANCE] MOLLIE_WEBHOOK_SECRET is NOT SET. Webhook processing disabled for security.');
            return reply.status(500).send({ error: 'Webhook secret not configured' });
        }

        const headerSecretRaw = request.headers['x-webhook-secret'];
        const headerSecret = Array.isArray(headerSecretRaw) ? headerSecretRaw[0] : headerSecretRaw;
        const queryToken = request.query.token;

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

            const metadata = payment.metadata as MolliePaymentMetadata;

            // 2. Fetch transaction details from DB (needed for access_token)
            const txResult = await fastify.db
                .selectFrom('transactions')
                .select('access_token')
                .where('mollie_id', '=', id)
                .executeTakeFirst();
            const accessToken = txResult?.access_token || '';

            // 3. Finalize Payment via Service (Centralized Logic)
            const { PaymentService } = await import('../services/payment.service.js');
            await PaymentService.finalizePayment(
                fastify,
                id,
                payment.status,
                metadata,
                accessToken
            );

            // 4. Log specific statuses for visibility
            if (['failed', 'canceled', 'expired'].includes(payment.status)) {
                fastify.log.info(`[FINANCE] Payment ${id} failed with status: ${payment.status}.`);
            }

            return { success: true };
        } catch (error: unknown) {
            fastify.log.error(error as Error, `[FINANCE] Error processing webhook ${id}`);
            return reply.status(500).send({ error: 'Internal processing error' });
        }
    });
}
