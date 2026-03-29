import { FastifyInstance } from 'fastify';
import { getMollieClient } from '../services/mollie.service.js';

export default async function paymentsRoutes(fastify: FastifyInstance) {
    /**
     * POST /api/payments/create
     * Creates a new Mollie payment and stores a transaction record.
     */
    fastify.post('/create', async (request: any, reply) => {
        const {
            amount,
            description,
            registrationId,
            registrationType,
            email,
            firstName,
            lastName,
            isContribution,
            userId,
            redirectUrl
        } = request.body;

        if (!amount || !description || !redirectUrl) {
            return reply.status(400).send({ error: 'Missing required fields (amount, description, redirectUrl)' });
        }

        try {
            const mollie = getMollieClient();
            
            // 1. Create payment in Mollie
            const payment = await mollie.payments.create({
                amount: {
                    currency: 'EUR',
                    value: amount.toFixed(2)
                },
                description,
                redirectUrl,
                webhookUrl: `${process.env.PUBLIC_URL}/api/finance/webhook/mollie`,
                metadata: {
                    registrationId,
                    registrationType,
                    userId,
                    email,
                    isContribution
                }
            });

            // 2. Store transaction in PostgreSQL
            // We use the fields that the webhook (mollie.routes.ts) expects
            await fastify.db.query(
                `INSERT INTO transactions (
                    mollie_id, amount, status, description, 
                    user_id, email, first_name, last_name,
                    registration_id, registration_type,
                    created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
                [
                    payment.id,
                    amount,
                    'open',
                    description,
                    userId || null,
                    email || null,
                    firstName || null,
                    lastName || null,
                    registrationId || null,
                    registrationType || null
                ]
            );

            return { checkoutUrl: payment.getCheckoutUrl() };
        } catch (err: any) {
            fastify.log.error('[FINANCE] Error creating payment:', err);
            return reply.status(500).send({ error: 'Failed to create payment', message: err.message });
        }
    });
}
