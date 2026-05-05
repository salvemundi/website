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

            const metadata = payment.metadata as any;
            const userId = metadata?.userId;

            // 2. Fetch transaction details from DB (needed for access_token)
            const txResult = await fastify.db.query(
                `SELECT access_token FROM transactions WHERE mollie_id = $1 LIMIT 1`,
                [id]
            );
            const accessToken = txResult.rows[0]?.access_token;

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
                // Optional: Log failure to system_logs if needed, but PaymentService handles main flow
            }

            return { success: true };
        } catch (err: any) {
            fastify.log.error(`[FINANCE] Error processing webhook ${id}:`, err);
            return reply.status(500).send({ error: 'Internal processing error' });
        }
    });
}

