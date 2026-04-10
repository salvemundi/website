import { FastifyInstance } from 'fastify';
import { getMollieClient } from '../services/mollie.service.js';

export default async function statusRoutes(fastify: FastifyInstance) {
    /**
     * GET /api/finance/status/:id
     * Returns the current status of a transaction.
     * If local status is 'open', it attempts a live Mollie check.
     */
    fastify.get('/status/:id', async (request: any, reply) => {
        const { id } = request.params;

        if (!id) {
            return reply.status(400).send({ error: 'Missing ID' });
        }

        const isMollieId = id.startsWith('tr_');
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

        if (!isMollieId && !isUuid) {
            return reply.status(400).send({ error: 'Invalid ID format' });
        }

        try {
            const query = isMollieId 
                ? 'SELECT mollie_id, payment_status, amount, product_type, created_at, updated_at FROM transactions WHERE mollie_id = $1 LIMIT 1'
                : 'SELECT mollie_id, payment_status, amount, product_type, created_at, updated_at FROM transactions WHERE access_token = $1 LIMIT 1';

            const result = await fastify.db.query(query, [id]);

            if (result.rows.length === 0) {
                return reply.status(404).send({ error: 'Transaction not found' });
            }

            const transaction = result.rows[0];

            // Live status fallback if still open
            if (transaction.payment_status === 'open' && transaction.mollie_id) {
                try {
                    const mollie = getMollieClient();
                    const livePayment = await mollie.payments.get(transaction.mollie_id);
                    
                    if (livePayment.status !== transaction.payment_status) {
                        fastify.log.info(`[STATUS] Live status mismatch for ${transaction.mollie_id}: DB=${transaction.payment_status}, Mollie=${livePayment.status}. Updating DB.`);
                        
                        await fastify.db.query(
                            'UPDATE transactions SET payment_status = $1, updated_at = NOW() WHERE mollie_id = $2',
                            [livePayment.status, transaction.mollie_id]
                        );
                        
                        transaction.payment_status = livePayment.status;
                        transaction.updated_at = new Date();
                    }
                } catch (mollieErr) {
                    fastify.log.error(mollieErr, `[STATUS] Failed to fetch live Mollie status for ${transaction.mollie_id}`);
                }
            }

            return transaction;
        } catch (err) {
            fastify.log.error(err, `[STATUS] Error fetching status for ${id}`);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
