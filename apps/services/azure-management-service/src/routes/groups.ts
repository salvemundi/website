import { type FastifyInstance } from 'fastify';
import { TokenService } from '../services/token.service.js';
import { GraphService } from '../services/graph.service.js';
import { verifyInternalToken } from '../middleware/auth.js';

export default async function groupRoutes(fastify: FastifyInstance) {
    fastify.post('/:groupId/members', { preHandler: [verifyInternalToken] }, async (request, reply) => {
        const { groupId } = request.params as { groupId: string };
        const { userId } = request.body as { userId: string };

        if (!userId) {
            return reply.status(400).send({ error: 'Missing userId' });
        }

        try {
            const token = await TokenService.getAccessToken(fastify.redis);
            await GraphService.addGroupMember(groupId, userId, token);
            return { success: true, message: 'Member added to Azure group' };
        } catch (error: any) {
            const msg = error.message || '';
            if (msg.includes('already exist') || msg.includes('already exists') || (error.statusCode === 400 && msg.includes('object references'))) {
                return { success: true, message: 'User is already a member of this group' };
            }

            fastify.log.error({ groupId, userId, error }, 'Failed to add group member');
            return reply.status(500).send({ error: 'Failed to add member to Azure group', details: msg });
        }
    });

    fastify.delete('/:groupId/members/:userId', { preHandler: [verifyInternalToken] }, async (request, reply) => {
        const { groupId, userId } = request.params as { groupId: string; userId: string };

        try {
            const token = await TokenService.getAccessToken(fastify.redis);
            await GraphService.removeGroupMember(groupId, userId, token);
            return { success: true, message: 'Member removed from Azure group' };
        } catch (error: any) {
            const msg = error.message || '';
            if (error.statusCode === 404 || msg.includes('does not exist') || msg.includes('not found')) {
                return { success: true, message: 'User was not a member of this group' };
            }

            fastify.log.error({ groupId, userId, error }, 'Failed to remove group member');
            return reply.status(500).send({ error: 'Failed to remove member from Azure group', details: msg });
        }
    });

    fastify.post('/:groupId/owners', { preHandler: [verifyInternalToken] }, async (request, reply) => {
        const { groupId } = request.params as { groupId: string };
        const { userId } = request.body as { userId: string };

        try {
            const token = await TokenService.getAccessToken(fastify.redis);
            await GraphService.addGroupOwner(groupId, userId, token);
            return { success: true, message: 'Owner added to Azure group' };
        } catch (error: any) {
            const msg = error.message || '';
            if (msg.includes('already exist') || msg.includes('already exists')) {
                return { success: true, message: 'User is already an owner of this group' };
            }
            fastify.log.error({ groupId, userId, error }, 'Failed to add group owner');
            return reply.status(500).send({ error: 'Failed to add owner', details: msg });
        }
    });

    fastify.delete('/:groupId/owners/:userId', { preHandler: [verifyInternalToken] }, async (request, reply) => {
        const { groupId, userId } = request.params as { groupId: string; userId: string };

        try {
            const token = await TokenService.getAccessToken(fastify.redis);
            await GraphService.removeGroupOwner(groupId, userId, token);
            return { success: true, message: 'Owner removed from Azure group' };
        } catch (error: any) {
            const msg = error.message || '';
            if (error.statusCode === 404 || msg.includes('does not exist')) {
                return { success: true, message: 'User was not an owner of this group' };
            }
            fastify.log.error({ groupId, userId, error }, 'Failed to remove owner');
            return reply.status(500).send({ error: 'Failed to remove owner', details: msg });
        }
    });
}