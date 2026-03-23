import { FastifyInstance } from 'fastify';
import { SyncJob } from '../services/sync.job.js';
import { TokenService } from '../services/token.service.js';
import { timingSafeCompare } from '@salvemundi/validations';

export default async function syncRoutes(fastify: FastifyInstance) {
    /**
     * Security hook: Validates the internal service token for all sync routes.
     */
    fastify.addHook('preHandler', async (request, reply) => {
        const token = process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();
        const rawAuthHeader = request.headers.authorization;
        const authHeader = Array.isArray(rawAuthHeader) ? rawAuthHeader[0] : rawAuthHeader;

        if (!token) {
            fastify.log.error('[AUTH] INTERNAL_SERVICE_TOKEN is not configured');
            return reply.status(500).send({ error: 'Internal Server Configuration Error' });
        }

        const expectedHeader = `Bearer ${token}`;
        if (!authHeader || !timingSafeCompare(authHeader, expectedHeader)) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
    });

    /**
     * POST /run
     * Starts the full synchronization job asynchronously.
     */
    fastify.post('/run', async (request, reply) => {
        try {
            const accessToken = await TokenService.getAccessToken(fastify.redis);
            const options = request.body as any;

            // Start sync job asynchronously (Fire-and-forget)
            SyncJob.run(fastify.redis, accessToken, options).catch(err => {
                fastify.log.error(`[SYNC] Full job failed: ${err.message}`);
            });

            return { message: 'Sync job started' };
        } catch (err: any) {
            fastify.log.error(`[SYNC] Failed to start job: ${err.message}`);
            return reply.status(500).send({
                error: 'Failed to start sync job',
                details: err.message
            });
        }
    });

    /**
     * POST /run/:userId
     * Synchronizes a specific user by their ID.
     */
    fastify.post<{ Params: { userId: string } }>('/run/:userId', async (request, reply) => {
        const { userId } = request.params;

        try {
            const accessToken = await TokenService.getAccessToken(fastify.redis);

            await SyncJob.syncUserById(fastify.redis, userId, accessToken);

            return { message: `Sync for user ${userId} completed` };
        } catch (err: any) {
            fastify.log.error(`[SYNC] Failed to sync user ${userId}: ${err.message}`);
            return reply.status(500).send({
                error: 'Failed to sync user',
                details: err.message
            });
        }
    });

    /**
     * GET /status
     * Returns the current status of the synchronization job.
     */
    fastify.get('/status', async (request, reply) => {
        return SyncJob.getStatus(fastify.redis);
    });
}