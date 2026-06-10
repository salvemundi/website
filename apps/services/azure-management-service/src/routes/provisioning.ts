import { type FastifyInstance } from 'fastify';
import { ProvisionWorkerService } from '../services/provision-worker.js';
import { verifyInternalToken } from '../middleware/auth.js';

export default async function provisioningRoutes(fastify: FastifyInstance) {
    fastify.post('/user', { preHandler: [verifyInternalToken] }, async (request, reply) => {
        const { email, firstName, lastName, phoneNumber, dateOfBirth } = request.body as Record<string, string>;

        if (!email || !firstName || !lastName) {
            return reply.status(400).send({ error: 'Missing required fields (email, firstName, lastName)' });
        }

        try {
            await ProvisionWorkerService.queueProvisioning(fastify.redis, {
                email,
                firstName,
                lastName,
                phoneNumber,
                dateOfBirth
            });

            return reply.status(202).send({
                success: true,
                message: 'Provisioning task queued successfully. The account will be created and welcome email sent shortly.'
            });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            fastify.log.error(`[PROVISIONING] Failed for ${email}: ${msg}`);
            return reply.status(500).send({ error: 'Failed to queue provisioning task' });
        }
    });
}