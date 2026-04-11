import { FastifyInstance } from 'fastify';

export default async function monitoringRoutes(fastify: FastifyInstance) {
    /**
     * Get the status of all provisioning queues.
     */
    fastify.get('/status', async (request, reply) => {
        const authHeader = request.headers.authorization;
        const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

        if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        try {
            const newUserQueue = 'v7:queue:provision:new_user';
            const syncQueue = 'v7:queue:provision:sync_existing';

            const [newUsersCount, syncUsersCount] = await Promise.all([
                fastify.redis.zcard(newUserQueue),
                fastify.redis.zcard(syncQueue)
            ]);

            // Fetch a few sample tasks from each
            const [newUserSamples, syncSamples] = await Promise.all([
                fastify.redis.zrange(newUserQueue, 0, 9),
                fastify.redis.zrange(syncQueue, 0, 9)
            ]);

            return {
                success: true,
                queues: {
                    new_users: {
                        count: newUsersCount,
                        samples: newUserSamples.map(s => JSON.parse(s))
                    },
                    sync_existing: {
                        count: syncUsersCount,
                        samples: syncSamples.map(s => JSON.parse(s))
                    }
                },
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            };
        } catch (err: any) {
            fastify.log.error('[MONITORING] Failed to fetch queue status:', err.message);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
}
