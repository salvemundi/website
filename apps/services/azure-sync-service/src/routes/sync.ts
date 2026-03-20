import { FastifyInstance } from 'fastify';
import { SyncJob } from '../services/sync.job.js';
import { TokenService } from '../services/token.service.js';
import { GraphService } from '../services/graph.service.js';
import { timingSafeCompare } from '@salvemundi/validations';

export default async function syncRoutes(fastify: FastifyInstance) {
    fastify.post('/run', async (request, reply) => {
        // Simple internal security check
        const authHeader = request.headers['authorization'];
        const token = process.env.INTERNAL_SERVICE_TOKEN;

        if (!authHeader || !token || !timingSafeCompare(authHeader, `Bearer ${token}`)) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        try {
            // Get token (cached or new)
            const accessToken = await TokenService.getAccessToken(fastify.redis);
            
            // Run sync asynchronously
            SyncJob.run(accessToken).catch(err => console.error('[SYNC] Job failed:', err));

            return { message: 'Sync job started' };
        } catch (err: any) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Failed to start sync job', details: err.message });
        }
    });
    fastify.post('/run/:userId', async (request: any, reply) => {
        const authHeader = request.headers['authorization'];
        const token = process.env.INTERNAL_SERVICE_TOKEN;

        if (!authHeader || !token || !timingSafeCompare(authHeader, `Bearer ${token}`)) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        const { userId } = request.params;

        try {
            const accessToken = await TokenService.getAccessToken(fastify.redis);
            
            // Run sync for specific user
            await SyncJob.syncUserById(userId, accessToken);

            return { message: `Sync for user ${userId} completed` };
        } catch (err: any) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Failed to sync user', details: err.message });
        }
    });
}
