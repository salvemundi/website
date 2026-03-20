import { FastifyInstance } from 'fastify';
import { timingSafeCompare } from '@salvemundi/validations';
import { TokenService } from '../services/token.service.js';
import { GraphService } from '../services/graph.service.js';

export default async function groupRoutes(fastify: FastifyInstance) {
    
    // Middleware-like check for internal service token
    fastify.addHook('preHandler', async (request, reply) => {
        const authHeader = request.headers['authorization'];
        const token = process.env.INTERNAL_SERVICE_TOKEN;

        if (!authHeader || !token || !timingSafeCompare(authHeader, `Bearer ${token}`)) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
    });

    // Add member to group
    fastify.post('/:groupId/members', async (request: any, reply) => {
        const { groupId } = request.params;
        const { userId } = request.body;

        if (!userId) {
            return reply.status(400).send({ error: 'Missing userId' });
        }

        try {
            const token = await TokenService.getAccessToken();
            await GraphService.addGroupMember(groupId, userId, token);
            return { success: true, message: 'Member added to Azure group' };
        } catch (err: any) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Failed to add member to Azure group', details: err.message });
        }
    });

    // Remove member from group
    fastify.delete('/:groupId/members/:userId', async (request: any, reply) => {
        const { groupId, userId } = request.params;

        try {
            const token = await TokenService.getAccessToken();
            await GraphService.removeGroupMember(groupId, userId, token);
            return { success: true, message: 'Member removed from Azure group' };
        } catch (err: any) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Failed to remove member from Azure group', details: err.message });
        }
    });

    // Add owner to group (Set Leader)
    fastify.post('/:groupId/owners', async (request: any, reply) => {
        const { groupId } = request.params;
        const { userId } = request.body;

        try {
            const token = await TokenService.getAccessToken();
            await GraphService.addGroupOwner(groupId, userId, token);
            return { success: true };
        } catch (err: any) {
            return reply.status(500).send({ error: 'Failed to add owner', details: err.message });
        }
    });

    // Remove owner from group (Unset Leader)
    fastify.delete('/:groupId/owners/:userId', async (request: any, reply) => {
        const { groupId, userId } = request.params;

        try {
            const token = await TokenService.getAccessToken();
            await GraphService.removeGroupOwner(groupId, userId, token);
            return { success: true };
        } catch (err: any) {
            return reply.status(500).send({ error: 'Failed to remove owner', details: err.message });
        }
    });
}
