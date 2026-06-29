import { safeConsoleError } from '../utils/logger.js';
import { type FastifyInstance } from 'fastify';
import { getMollieClient } from '../services/mollie.service.js';
import { type FinanceMolliePaymentMetadata } from '../services/payment.service.js';
import { verifyInternalToken } from '../middleware/auth.js';

export default async function statusRoutes(fastify: FastifyInstance) {
    await Promise.resolve();

    fastify.get<{ Params: { id: string } }>('/status/:id', { preHandler: [verifyInternalToken] }, async (request, reply) => {
        const { id } = request.params;

        if (!id) {
            return reply.status(400).send({ error: 'Missing ID' });
        }

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

        if (!isUuid) {
            return reply.status(400).send({ error: 'Invalid ID format. Only UUID access tokens are allowed for status checks.' });
        }

        try {
            const { schema, eq, desc } = await import('@salvemundi/db');
            const transactions = await fastify.db
                .select({
                    mollie_id: schema.transactions.mollie_id,
                    payment_status: schema.transactions.payment_status,
                    amount: schema.transactions.amount,
                    product_type: schema.transactions.product_type,
                    registration: schema.transactions.registration,
                    trip_signup: schema.transactions.trip_signup,
                    pub_crawl_signup: schema.transactions.pub_crawl_signup,
                    created_at: schema.transactions.created_at,
                    updated_at: schema.transactions.updated_at,
                    access_token: schema.transactions.access_token
                })
                .from(schema.transactions)
                .where(eq(schema.transactions.access_token, id))
                .orderBy(desc(schema.transactions.created_at));

            if (transactions.length === 0) {
                return reply.status(404).send({ error: 'Transaction not found' });
            }

            const transaction = transactions.find((t: any) => t.payment_status === 'paid') || transactions[0];

            const dbStatus = String(transaction.payment_status);
            const mollieId = transaction.mollie_id;

            if (dbStatus === 'open' && mollieId) {
                try {
                    const mollie = getMollieClient();
                    const livePayment = await mollie.payments.get(mollieId);

                    if (String(livePayment.status) !== dbStatus) {
                        fastify.log.info(`[STATUS] Live status mismatch for ${mollieId}: DB=${dbStatus}, Mollie=${livePayment.status}. Triggering finalization.`);

                        const { PaymentService } = await import('../services/payment.service.js');
                        await PaymentService.finalizePayment(
                            fastify,
                            mollieId,
                            livePayment.status,
                            livePayment.metadata as FinanceMolliePaymentMetadata,
                            transaction.access_token || ''
                        );

                        transaction.payment_status = livePayment.status as typeof transaction.payment_status;
                        (transaction as { updated_at?: string | null }).updated_at = new Date().toISOString();
                    }
                } catch (mollieErr) {
                    fastify.log.error(mollieErr, `[STATUS] Failed to fetch live Mollie status for ${mollieId}`);
                }
            }

            return {
                ...transaction,
                signup_id: transaction.registration || transaction.trip_signup || transaction.pub_crawl_signup
            };
        } catch (error) {
            safeConsoleError(`[status.routes.ts][statusRoutes] Error fetching status for ${id}:`, error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}