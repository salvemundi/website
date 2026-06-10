import { type FastifyInstance } from 'fastify';
import { SyncJob } from '../services/sync/sync-job.js';
import { TokenService } from '../services/token.service.js';
import { azureSyncRunSchema } from '@salvemundi/validations';
import { SYNC_REDIS_KEY, SYNC_ABORT_KEY, DEFAULT_SYNC_STATUS } from '../services/sync/sync-types.js';
import { verifyInternalToken } from '../middleware/auth.js';

export default async function syncRoutes(fastify: FastifyInstance) {
    fastify.post('/run', { preHandler: [verifyInternalToken] }, async (request, reply) => {
        try {
            const options = azureSyncRunSchema.parse(request.body || {});

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

    fastify.post<{ Params: { userId: string } }>('/run/:userId', { preHandler: [verifyInternalToken] }, async (request, reply) => {
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

    fastify.post('/reset', { preHandler: [verifyInternalToken] }, async (request, reply) => {
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

    fastify.get('/status', { preHandler: [verifyInternalToken] }, async (_request, _reply) => {
        return SyncJob.getStatus(fastify.redis);
    });

    await Promise.resolve();
}