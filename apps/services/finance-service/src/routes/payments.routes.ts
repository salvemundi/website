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
                // Only provide webhookUrl if it's not localhost (Mollie requirement)
                ...(process.env.PUBLIC_URL && !process.env.PUBLIC_URL.includes('localhost') ? {
                    webhookUrl: `${process.env.PUBLIC_URL}/api/finance/webhook/mollie`
                } : {}),
                metadata: {
                    registrationId,
                    registrationType,
                    userId,
                    email,
                    isContribution
                }
            });

            // 2. Store transaction in PostgreSQL
            let regColumnStr = '';
            let valTokens = '$1, $2, $3, $4, $5, $6, $7, $8';
            let params = [
                payment.id,
                amount,
                'open',
                description,
                userId || null,
                email || null,
                firstName || null,
                lastName || null
            ];

            if (registrationId && registrationType) {
                const colMap: Record<string, string> = {
                    'pub_crawl_signup': 'pub_crawl_signup',
                    'trip_signup': 'trip_signup',
                    'event_signup': 'registration'
                };
                const colName = colMap[registrationType] || 'registration';
                regColumnStr = `, ${colName}`;
                valTokens += ', $9';
                params.push(registrationId);
            }

            // We use the exact Directus fields
            await fastify.db.query(
                `INSERT INTO transactions (
                    mollie_id, amount, payment_status, product_name, 
                    user_id, email, first_name, last_name${regColumnStr},
                    created_at, updated_at
                ) VALUES (${valTokens}, NOW(), NOW())`,
                params
            );

            return { checkoutUrl: payment.getCheckoutUrl() };
        } catch (err: any) {
            fastify.log.error({ err, message: err?.message, code: err?.code, detail: err?.detail }, '[FINANCE] Error creating payment');
            return reply.status(500).send({ error: 'Failed to create payment', message: err.message });
        }
    });
}
