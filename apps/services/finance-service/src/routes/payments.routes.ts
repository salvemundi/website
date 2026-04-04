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
            
            const webhookUrl = process.env.PUBLIC_URL && !process.env.PUBLIC_URL.includes('localhost') 
                ? `${process.env.PUBLIC_URL}/api/finance/webhook/mollie` 
                : undefined;

            console.log(`[FINANCE] Creating Mollie payment with webhookUrl: ${webhookUrl}`);

            // 1. Create payment in Mollie
            // Generate a random access_token for guest security (IDOR mitigation)
            const accessToken = crypto.randomUUID();
            const separator = redirectUrl.includes('?') ? '&' : '?';
            const finalRedirectUrl = `${redirectUrl}${separator}t=${accessToken}`;

            const payment = await mollie.payments.create({
                amount: {
                    currency: 'EUR',
                    value: amount.toFixed(2)
                },
                description,
                redirectUrl: finalRedirectUrl,
                // Only provide webhookUrl if it's not localhost (Mollie requirement)
                ...(webhookUrl ? { webhookUrl } : {}),
                metadata: {
                    registrationId,
                    registrationType,
                    userId,
                    email,
                    isContribution
                }
            });

            // 2. Store transaction in PostgreSQL
            // Map registrationType to the product_type enum value used in Directus
            const productTypeMap: Record<string, string> = {
                'pub_crawl_signup': 'pub_crawl',
                'trip_signup': 'trip',
                'event_signup': 'event'
            };
            const productType = registrationType
                ? (productTypeMap[registrationType] || registrationType)
                : (isContribution ? 'membership' : 'other');

            let regColumnStr = '';
            let valTokens = '$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11';
            let params: any[] = [
                payment.id,
                amount,
                'open',
                description,
                productType,
                userId || null,
                email || null,
                firstName || null,
                lastName || null,
                accessToken,
                null
            ];

            if (registrationType === 'event_signup') {
                regColumnStr = ', registration';
                params[10] = registrationId;
            } else if (registrationType === 'trip_signup') {
                regColumnStr = ', trip_signup';
                params[10] = registrationId;
            } else if (registrationType === 'pub_crawl_signup') {
                regColumnStr = ', pub_crawl_signup';
                params[10] = registrationId;
            } else if (registrationType === 'membership') {
                regColumnStr = ', membership';
                params[10] = registrationId;
            }

            // 2. Store transaction in PostgreSQL
            const dbResult = await fastify.db.query(
                `INSERT INTO transactions (
                    mollie_id, amount, payment_status, product_name, product_type,
                    user_id, email, first_name, last_name, access_token${regColumnStr},
                    created_at, updated_at
                ) VALUES (${valTokens}, NOW(), NOW()) RETURNING id`,
                params
            );

            const transactionDbId = dbResult.rows[0].id;

            // Handle M2M junction table for Pub Crawl
            if (registrationType === 'pub_crawl_signup' && registrationId) {
                await fastify.db.query(
                    `INSERT INTO pub_crawl_signups_transactions (pub_crawl_signups_id, transactions_id)
                     VALUES ($1, $2)`,
                    [registrationId, transactionDbId]
                );
                fastify.log.info(`[FINANCE] Linked transaction ${transactionDbId} to pub_crawl_signup ${registrationId}`);
            }

            return { checkoutUrl: payment._links?.checkout?.href, mollie_id: payment.id, access_token: accessToken };
        } catch (err: any) {
            fastify.log.error({ err, message: err?.message, code: err?.code, detail: err?.detail }, '[FINANCE] Error creating payment');
            return reply.status(500).send({ error: 'Failed to create payment', message: err.message });
        }
    });
}
