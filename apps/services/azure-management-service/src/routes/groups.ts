import { FastifyInstance } from 'fastify';
import { timingSafeCompare } from '@salvemundi/validations';
import { TokenService } from '../services/token.service.js';
import { GraphService } from '../services/graph.service.js';

export default async function groupRoutes(fastify: FastifyInstance) {
    
    // Middleware-like check for internal service token
    fastify.addHook('preHandler', async (request, reply) => {
        const rawAuthHeader = request.headers['authorization'];
        const authHeader = Array.isArray(rawAuthHeader) ? rawAuthHeader[0] : rawAuthHeader;
        const token = process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();

        const expectedHeader = `Bearer ${token}`;
        if (!authHeader || !token || !timingSafeCompare(authHeader.trim(), expectedHeader)) {
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
            // Idempotent: Already a member?
            const msg = err.message || '';
            if (msg.includes('already exist') || msg.includes('already exists') || err.statusCode === 400 && msg.includes('object references')) {
                return { success: true, message: 'User is already a member of this group' };
            }
            
            fastify.log.error({ groupId, userId, err }, 'Failed to add group member');
            return reply.status(500).send({ error: 'Failed to add member to Azure group', details: msg });
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
            // Idempotent: Not a member?
            const msg = err.message || '';
            if (err.statusCode === 404 || msg.includes('does not exist') || msg.includes('not found')) {
                return { success: true, message: 'User was not a member of this group' };
            }
            
            fastify.log.error({ groupId, userId, err }, 'Failed to remove group member');
            return reply.status(500).send({ error: 'Failed to remove member from Azure group', details: msg });
        }
    });

    // Add owner to group (Set Leader)
    fastify.post('/:groupId/owners', async (request: any, reply) => {
        const { groupId } = request.params;
        const { userId } = request.body;

        try {
            const token = await TokenService.getAccessToken();
            await GraphService.addGroupOwner(groupId, userId, token);
            return { success: true, message: 'Owner added to Azure group' };
        } catch (err: any) {
            const msg = err.message || '';
            if (msg.includes('already exist') || msg.includes('already exists')) {
                return { success: true, message: 'User is already an owner of this group' };
            }
            fastify.log.error({ groupId, userId, err }, 'Failed to add group owner');
            return reply.status(500).send({ error: 'Failed to add owner', details: msg });
        }
    });

    // Remove owner from group (Unset Leader)
    fastify.delete('/:groupId/owners/:userId', async (request: any, reply) => {
        const { groupId, userId } = request.params;

        try {
            const token = await TokenService.getAccessToken();
            await GraphService.removeGroupOwner(groupId, userId, token);
            return { success: true, message: 'Owner removed from Azure group' };
        } catch (err: any) {
            const msg = err.message || '';
            if (err.statusCode === 404 || msg.includes('does not exist')) {
                return { success: true, message: 'User was not an owner of this group' };
            }
            fastify.log.error({ groupId, userId, err }, 'Failed to remove owner');
            return reply.status(500).send({ error: 'Failed to remove owner', details: msg });
        }
    });
}
