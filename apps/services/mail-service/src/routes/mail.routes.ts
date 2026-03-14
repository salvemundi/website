import { FastifyInstance } from 'fastify';
import { MailerService } from '../services/mailer.js';
import { AuditService } from '../services/audit.js';

export default async function mailRoutes(fastify: FastifyInstance) {
    /**
     * POST /api/mail/send
     * Payload: { to: "user@example.com", templateId: "welcome", data: { ... } }
     */
    fastify.post('/send', async (request: any, reply) => {
        const { to, templateId, data } = request.body;

        if (!to || !templateId) {
            return reply.status(400).send({ error: 'Missing recipient or template ID' });
        }

        fastify.log.info(`[MAIL] Sending ${templateId} email to ${to}`);

        try {
            await MailerService.send(to, templateId, data);

            // Audit Trail: Log to Directus system_logs (as per docs)
            await AuditService.logMail(to, templateId, 'SUCCESS');

            return { success: true };
        } catch (err: any) {
            fastify.log.error(`[MAIL] Failed to send email to ${to}:`, err);
            
            try {
                await AuditService.logMail(to, templateId, 'FAILED', err.message);
            } catch (auditErr: any) {
                fastify.log.error(auditErr, '[MAIL] Failed to log failure to audit trail');
            }

            return reply.status(500).send({ error: 'Failed to dispatch email' });
        }
    });
}
