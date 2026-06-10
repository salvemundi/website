import { type FastifyInstance, type FastifyRequest, type FastifyReply } from 'fastify';
import { type MolliePaymentMetadata } from '@salvemundi/validations';
import { timingSafeCompare } from '@salvemundi/validations/security';
import { getMollieClient } from '../services/mollie.service.js';
import { PaymentService } from '../services/payment.service.js';

async function verifyMollieWebhook(request: FastifyRequest<{ Querystring: { token?: string } }>, reply: FastifyReply) {
    const webhookSecret = process.env.MOLLIE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        request.server.log.error('[FINANCE] MOLLIE_WEBHOOK_SECRET is NOT SET. Webhook processing disabled for security.');
        return reply.status(500).send({ error: 'Webhook secret not configured' });
    }

    const headerSecretRaw = request.headers['x-webhook-secret'];
    const headerSecret = Array.isArray(headerSecretRaw) ? headerSecretRaw[0] : headerSecretRaw;
    const queryToken = request.query.token;

    const authHeader = request.headers.authorization;
    const internalToken = process.env.INTERNAL_SERVICE_TOKEN;
    const hasValidBearer = !!(internalToken && authHeader === `Bearer ${internalToken}`);

    const isAuthorized = hasValidBearer ||
        timingSafeCompare(headerSecret || '', webhookSecret) ||
        timingSafeCompare(queryToken || '', webhookSecret);

    if (!isAuthorized) {
        return reply.status(401).send({ error: 'Unauthorized' });
    }
}

export default async function mollieRoutes(fastify: FastifyInstance) {
    await Promise.resolve();

    fastify.post<{ Body: { id: string }, Querystring: { token?: string } }>('/webhook/mollie', { preHandler: [verifyMollieWebhook] }, async (request, reply) => {
        const { id } = request.body;

        if (!id) {
            return reply.status(400).send({ error: 'Missing payment ID' });
        }

        fastify.log.info(`[FINANCE] Received Mollie webhook for payment ${id}`);

        try {
            const mollie = getMollieClient();
            const payment = await mollie.payments.get(id);

            const metadata = payment.metadata as MolliePaymentMetadata;

            const txResult = await fastify.db
                .selectFrom('transactions')
                .select('access_token')
                .where('mollie_id', '=', id)
                .executeTakeFirst();
            const accessToken = txResult?.access_token || '';

            await PaymentService.finalizePayment(
                fastify,
                id,
                payment.status,
                metadata,
                accessToken
            );

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