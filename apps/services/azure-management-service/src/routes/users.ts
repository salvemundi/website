import { type FastifyInstance } from 'fastify';
import { TokenService } from '../services/token.service.js';
import { GraphService } from '../services/graph.service.js';
import { verifyInternalToken } from '../middleware/auth.js';

export default async function userRoutes(fastify: FastifyInstance) {
    fastify.patch('/:entraId', { preHandler: [verifyInternalToken] }, async (request, reply) => {
        const { entraId } = request.params as { entraId: string };
        const { displayName, phoneNumber, dateOfBirth, membershipExpiry, originalPaymentDate, userPrincipalName, mail } = request.body as Record<string, string>;

        try {
            const token = await TokenService.getAccessToken(fastify.redis);
            await GraphService.updateUser(entraId, token, { displayName, phoneNumber, dateOfBirth, membershipExpiry, originalPaymentDate, userPrincipalName, mail });
            return { success: true, message: 'User updated in Microsoft Entra ID' };
        } catch (error: any) {
            fastify.log.error(`[USERS] Failed to update user ${entraId}:`, error.message);
            return reply.status(500).send({ error: 'Failed to update user in Azure AD', details: error.message });
        }
    });

    fastify.get('/:entraId/groups', { preHandler: [verifyInternalToken] }, async (request, reply) => {
        const { entraId } = request.params as { entraId: string };

        try {
            const token = await TokenService.getAccessToken(fastify.redis);
            const groups = await GraphService.getUserGroups(entraId, token);
            return { success: true, groups };
        } catch (error: any) {
            fastify.log.error(`[USERS] Failed to fetch groups for user ${entraId}:`, error.message);
            return reply.status(500).send({ error: 'Failed to fetch groups', details: error.message });
        }
    });

    fastify.put('/:entraId/photo', { preHandler: [verifyInternalToken] }, async (request, reply) => {
        const { entraId } = request.params as { entraId: string };

        try {
            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ error: 'No photo provided' });
            }

            const buffer = await data.toBuffer();
            const token = await TokenService.getAccessToken(fastify.redis);

            await GraphService.updateUserPhoto(entraId, buffer, token);

            return { success: true, message: 'Photo updated in Microsoft Entra ID' };
        } catch (error: any) {
            fastify.log.error(`[USERS] Failed to update photo for user ${entraId}:`, error.message);
            return reply.status(500).send({ error: 'Failed to update photo in Azure AD', details: error.message });
        }
    });
}