import { FastifyInstance } from 'fastify';

export default async function statusRoutes(fastify: FastifyInstance) {
    /**
     * GET /api/finance/status/:mollieId
     * Returns the current status of a transaction from the local database.
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
                ? 'SELECT payment_status, amount, product_type, created_at, updated_at FROM transactions WHERE mollie_id = $1 LIMIT 1'
                : 'SELECT payment_status, amount, product_type, created_at, updated_at FROM transactions WHERE access_token = $1 LIMIT 1';

            const result = await fastify.db.query(query, [id]);

            if (result.rows.length === 0) {
                return reply.status(404).send({ error: 'Transaction not found' });
            }

            return result.rows[0];
        } catch (err) {
            fastify.log.error(err, `[STATUS] Error fetching status for ${id}`);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
