import { FastifyInstance } from 'fastify';
import { SyncJob } from '../services/sync/sync-job.js';
import { TokenService } from '../services/token.service.js';
import { azureSyncRunSchema } from '@salvemundi/validations';
import { timingSafeCompare } from '@salvemundi/validations/security';
import { SYNC_REDIS_KEY, SYNC_ABORT_KEY, DEFAULT_SYNC_STATUS } from '../services/sync/sync-types.js';

export default async function syncRoutes(fastify: FastifyInstance) {
    /**
     * Security hook: Validates the internal service token for all sync routes.
     */
    fastify.addHook('preHandler', async (request, reply) => {
        const token = process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();
        const rawAuthHeader = request.headers.authorization as string | string[] | undefined;
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
            const options = azureSyncRunSchema.parse(request.body || {});

            // Start sync job asynchronously (Fire-and-forget)
            SyncJob.run(fastify.redis, options).catch((error: unknown) => {
                const message = error instanceof Error ? error.message : String(error);
                fastify.log.error(`[SYNC] Full job failed: ${message}`);
            });

            return { message: 'Sync job started' };
        } catch (error: unknown) {
            const err = error as { stack?: string; message?: string };
            fastify.log.error(`[SYNC] Failed to start job: ${err.stack || err.message || String(error)}`);
            return reply.status(500).send({
                error: 'Failed to start sync job',
                details: err.message || String(error)
            });
        }
    });

    /**
     * POST /run/:userId
     * Synchronizes a specific user by their ID.
     */
    fastify.post<{ Params: { userId: string } }>('/run/:userId', async (request, reply) => {
        const { userId } = request.params;
        const options = azureSyncRunSchema.parse(request.body || {});

        try {
            const accessToken = await TokenService.getAccessToken(fastify.redis);

            await SyncJob.syncByEntraId(fastify.redis, userId, accessToken, options);
            return { message: `Sync for Entra ID ${userId} completed` };
        } catch (error: unknown) {
            const err = error as { stack?: string; message?: string };
            const errMsg = err.message || (typeof error === 'string' ? error : 'Onbekende fout');
            const errStack = err.stack || errMsg;
            fastify.log.error(`[SYNC] Failed to sync user ${userId}: ${errStack}`);
            return reply.status(500).send({
                error: 'Failed to sync user',
                details: errMsg
            });
        }
    });

    /**
     * POST /reset
     * Forcefully resets the sync status to idle.
     */
    fastify.post('/reset', async (request, reply) => {
        try {
            await Promise.all([
                fastify.redis.set(SYNC_REDIS_KEY, JSON.stringify(DEFAULT_SYNC_STATUS), 'EX', 86400 * 7),
                fastify.redis.del(SYNC_ABORT_KEY)
            ]);
            return { message: 'Sync status reset to idle' };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            fastify.log.error(`[SYNC] Failed to reset status: ${message}`);
            return reply.status(500).send({ error: 'Failed to reset sync status' });
        }
    });

    /**
     * GET /status
     * Returns the current status of the synchronization job.
     */
    fastify.get('/status', async (_request, _reply) => {
        return SyncJob.getStatus(fastify.redis);
    });

    await Promise.resolve();
}