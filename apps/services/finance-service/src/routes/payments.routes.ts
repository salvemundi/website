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
            phoneNumber,
            dateOfBirth,
            isContribution,
            isNewMember,
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
                    firstName,
                    lastName,
                    phoneNumber,
                    dateOfBirth,
                    isContribution,
                    isNewMember
                }
            });

            // 2. Store transaction in PostgreSQL
            // Map registrationType to literal Dutch names for the UI as requested
            const productTypeMap: Record<string, string> = {
                'pub_crawl_signup': 'Kroegentocht',
                'trip_signup': 'Reis',
                'event_signup': 'Activiteit'
            };

            let productType = 'Overig';
            if (isContribution) {
                // INTERNAL type for audit logs and system triggers
                productType = 'membership';
            } else if (registrationType && productTypeMap[registrationType]) {
                productType = productTypeMap[registrationType];
            } else if (registrationType) {
                // Pre-mapped or fallback to registrationType itself
                productType = registrationType;
            }

            // 2. Build SQL dynamically to avoid parameter count mismatches
            const columns = [
                'mollie_id', 'amount', 'payment_status', 'product_name', 'product_type',
                'user_id', 'email', 'first_name', 'last_name', 'access_token'
            ];
            const params = [
                payment.id,
                amount,
                'open',
                description,
                productType,
                userId || null,
                email || null,
                firstName || null,
                lastName || null,
                accessToken
            ];

            if (['event_signup', 'trip_signup', 'pub_crawl_signup', 'membership'].includes(registrationType)) {
                columns.push('registration');
                params.push(registrationId || null);
            }

            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
            const dbResult = await fastify.db.query(
                `INSERT INTO transactions (
                    ${columns.join(', ')},
                    created_at, updated_at
                ) VALUES (${placeholders}, NOW(), NOW()) RETURNING id`,
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

    /**
     * POST /api/payments/approve
     * Manually approves a pending payment and triggers automated processing.
     */
    fastify.post('/approve', async (request: any, reply) => {
        const authHeader = request.headers.authorization;
        const internalToken = process.env.INTERNAL_SERVICE_TOKEN;

        if (!internalToken || authHeader !== `Bearer ${internalToken}`) {
            return reply.status(401).send({ error: 'Unauthorized: Internal Service Token required' });
        }

        const { mollieId } = request.body;
        if (!mollieId) return reply.status(400).send({ error: 'Missing mollieId' });

        try {
            // 1. Update approval_status
            await fastify.db.query(
                `UPDATE transactions SET approval_status = 'approved', updated_at = NOW() WHERE mollie_id = $1`,
                [mollieId]
            );

            // 2. Fetch transaction details to re-trigger event
            // Note: In a real system, we would call a centralized "finalizePayment" function.
            // Here we'll rely on the azure-sync-service listener to pick up the change or 
            // the webhook handler to have published a success event that we now 'validate'.
            
            // To be robust, we publish the success event NOW because it was skipped during webhook.
            const result = await fastify.db.query(`SELECT * FROM transactions WHERE mollie_id = $1`, [mollieId]);
            const tx = result.rows[0];

            if (!tx || tx.payment_status !== 'paid') {
                return reply.status(400).send({ error: 'Transaction not found or not paid yet' });
            }

            // Fetch full payment from Mollie to get metadata (names, phone, DOB)
            const mollie = getMollieClient();
            const payment = await mollie.payments.get(mollieId);
            const metadata = payment.metadata as any;

            const eventData = {
                event: 'PAYMENT_SUCCESS',
                userId: tx.user_id,
                paymentId: tx.mollie_id,
                email: tx.email || metadata?.email,
                registrationId: tx.registration || tx.trip_signup || tx.pub_crawl_signup,
                registrationType: tx.product_type === 'pub_crawl' ? 'pub_crawl_signup' : 
                                 tx.product_type === 'trip' ? 'trip_signup' : 
                                 tx.product_type === 'event' ? 'event_signup' : tx.product_type,
                isContribution: tx.product_type === 'membership',
                isNewMember: !tx.user_id && tx.product_type === 'membership',
                accessToken: tx.access_token,
                firstName: tx.first_name || metadata?.firstName,
                lastName: tx.last_name || metadata?.lastName,
                phoneNumber: metadata?.phoneNumber,
                dateOfBirth: metadata?.dateOfBirth,
                timestamp: new Date().toISOString()
            };

            await fastify.redis.xadd('v7:events', '*', 'payload', JSON.stringify(eventData));
            fastify.log.info(`[FINANCE] Manually approved and published success event for ${mollieId}`);

            return { success: true };
        } catch (err: any) {
            fastify.log.error(`[FINANCE] Approval failed for ${mollieId}:`, err);
            return reply.status(500).send({ error: 'Approval failed', message: err.message });
        }
    });
}
