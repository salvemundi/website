import { type FastifyRequest, type FastifyReply } from 'fastify';

export async function verifyInternalToken(request: FastifyRequest, reply: FastifyReply) {
    const authHeader = request.headers.authorization;
    const internalToken = process.env.INTERNAL_SERVICE_TOKEN;

    if (!internalToken || authHeader !== `Bearer ${internalToken}`) {
        return reply.status(401).send({ error: 'Unauthorized: Internal Service Token required' });
    }
}