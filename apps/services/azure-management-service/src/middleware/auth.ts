import { type FastifyRequest, type FastifyReply } from 'fastify';
import { timingSafeCompare } from '@salvemundi/validations/security';

export async function verifyInternalToken(request: FastifyRequest, reply: FastifyReply) {
    const token = process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();
    const rawAuthHeader = (request.headers as Record<string, unknown>).authorization;
    const authHeader = typeof rawAuthHeader === 'string' ? rawAuthHeader : undefined;

    if (!token) {
        request.server.log.error('[AUTH] INTERNAL_SERVICE_TOKEN is not configured in environment variables');
        return reply.status(500).send({ error: 'Internal Server Configuration Error' });
    }

    const expectedHeader = `Bearer ${token}`;
    if (!authHeader || !timingSafeCompare(authHeader.trim(), expectedHeader)) {
        return reply.status(401).send({ error: 'Unauthorized' });
    }
}