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
    
    fastify.get('/test-graph', async (request, reply) => {
        const authHeader = request.headers['authorization'];
        const token = process.env.INTERNAL_SERVICE_TOKEN;

        if (!authHeader || !token || !timingSafeCompare(authHeader, `Bearer ${token}`)) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        try {
            const token = await TokenService.getAccessToken(fastify.redis);
            const client = GraphService['getClient'](token); // Access private method for testing
            
            fastify.log.info('[TEST-GRAPH] Fetching organization info...');
            const org = await client.api('/organization').get();
            
            fastify.log.info('[TEST-GRAPH] Fetching users (top 1)...');
            const users = await client.api('/users').top(1).get();
            
            return {
                status: 'success',
                organization: org.value?.[0]?.displayName,
                userCount: users.value?.length,
                firstUser: users.value?.[0]?.userPrincipalName
            };
        } catch (err: any) {
            fastify.log.error('[TEST-GRAPH] Failed:', err);
            return reply.status(500).send({ 
                error: 'Graph test failed', 
                statusCode: err.statusCode,
                code: err.code,
                message: err.message,
                body: err.body
            });
        }
    });
}
