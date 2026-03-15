import { FastifyInstance } from 'fastify';
import { MailerService } from '../services/mailer.js';
import { AuditService } from '../services/audit.js';

export default async function mailRoutes(fastify: FastifyInstance) {
    /**
     * POST /api/mail/send
     * Payload: { to: "user@example.com", templateId: "welcome", data: { ... } }
     */
    fastify.post('/send', async (request: any, reply) => {
        const token = process.env.INTERNAL_SERVICE_TOKEN;
        if (!token) {
            return reply.status(500).send({ error: 'INTERNAL_SERVICE_TOKEN is not configured' });
        }

        const authHeader = request.headers['authorization'];
        if (authHeader !== `Bearer ${token}`) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        const { to, templateId, data } = request.body;

        if (!to || !templateId) {
            return reply.status(400).send({ error: 'Missing recipient or template ID' });
        }

        fastify.log.info(`[MAIL] Queueing ${templateId} email for ${to}`);

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
