import { type FastifyInstance } from 'fastify';
import { MailRequestSchema } from '@salvemundi/validations';
import { MailWorkerService } from '../services/mail-worker.js';
import { verifyInternalToken } from '../middleware/auth.js';

export default async function mailRoutes(fastify: FastifyInstance) {
    await Promise.resolve();

    fastify.post('/send', { preHandler: [verifyInternalToken] }, async (request, reply) => {
        const validation = MailRequestSchema.safeParse(request.body);

        if (!validation.success) {
            return reply.status(400).send({
                error: 'Invalid payload',
                details: validation.error.format()
            });
        }

        const { to, templateId, data } = validation.data;

        try {
            await MailWorkerService.queueMail(fastify.redis, to, templateId, (data || {}) as Record<string, unknown>);
            return { success: true, message: 'Email queued for delivery' };
        } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error(String(error));
            fastify.log.error(err, `[MAIL] Failed to queue email to ${to}`);
            return reply.status(500).send({ error: 'Failed to queue email' });
        }
    });
}