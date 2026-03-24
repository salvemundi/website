import { FastifyInstance } from 'fastify';
import { timingSafeCompare } from '@salvemundi/validations';
import { TokenService } from '../services/token.service.js';
import { GraphService } from '../services/graph.service.js';

export default async function userRoutes(fastify: FastifyInstance) {
    
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

    // Update user profile
    fastify.patch('/:entraId', async (request: any, reply) => {
        const { entraId } = request.params;
        const { displayName, phoneNumber, dateOfBirth } = request.body;

        try {
            const token = await TokenService.getAccessToken();
            await GraphService.updateUser(entraId, token, { displayName, phoneNumber, dateOfBirth });
            return { success: true, message: 'User updated in Microsoft Entra ID' };
        } catch (err: any) {
            fastify.log.error(`[USERS] Failed to update user ${entraId}:`, err.message);
            return reply.status(500).send({ error: 'Failed to update user in Azure AD', details: err.message });
        }
    });
}
