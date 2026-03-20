import { FastifyInstance } from 'fastify';
import { MailRequestSchema, timingSafeCompare } from '@salvemundi/validations';

export default async function mailRoutes(fastify: FastifyInstance) {
    /**
     * Security hook: Valideert het interne service token voor alle routes in deze scope.
     */
    fastify.addHook('preHandler', async (request, reply) => {
        const token = process.env.INTERNAL_SERVICE_TOKEN;
        const authHeader = request.headers.authorization;

        if (!token) {
            fastify.log.error('[AUTH] INTERNAL_SERVICE_TOKEN is not configured in environment variables');
            return reply.status(500).send({ error: 'Internal Server Configuration Error' });
        }

        if (!authHeader || !timingSafeCompare(authHeader, `Bearer ${token}`)) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
    });

    /**
     * POST /send
     * Verwerkt aanvragen voor het versturen van e-mails via de MailWorkerService.
     */
    fastify.post('/send', async (request, reply) => {
        const validation = MailRequestSchema.safeParse(request.body);

        if (!validation.success) {
            return reply.status(400).send({
                error: 'Invalid payload',
                details: validation.error.format()
            });
        }

        const { to, templateId, data } = validation.data;

        try {
            const { MailWorkerService } = await import('../services/mail-worker.js');
            await MailWorkerService.queueMail(fastify.redis, to, templateId, data);

            return { success: true, message: 'Email queued for delivery' };
        } catch (err: any) {
            fastify.log.error(`[MAIL] Failed to queue email to ${to}:`, err);
            return reply.status(500).send({ error: 'Failed to queue email' });
        }
    });
}