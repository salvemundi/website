import { type FastifyInstance } from 'fastify';
import { verifyInternalToken } from '../middleware/auth.js';

export default async function monitoringRoutes(fastify: FastifyInstance) {
    fastify.get('/status', { preHandler: [verifyInternalToken] }, async (request, reply) => {
        try {
            const newUserQueue = 'v7:queue:provision:new_user';
            const syncQueue = 'v7:queue:provision:sync_existing';

            const [newUsersCount, syncUsersCount] = await Promise.all([
                fastify.redis.zcard(newUserQueue),
                fastify.redis.zcard(syncQueue)
            ]);

            const [newUserSamples, syncSamples] = await Promise.all([
                fastify.redis.zrange(newUserQueue, 0, 9),
                fastify.redis.zrange(syncQueue, 0, 9)
            ]);

            return {
                success: true,
                queues: {
                    new_users: {
                        count: newUsersCount,
                        samples: newUserSamples.map(s => JSON.parse(s) as unknown)
                    },
                    sync_existing: {
                        count: syncUsersCount,
                        samples: syncSamples.map(s => JSON.parse(s) as unknown)
                    }
                },
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            };
        } catch (error: any) {
            fastify.log.error('[MONITORING] Failed to fetch queue status:', error.message);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
}