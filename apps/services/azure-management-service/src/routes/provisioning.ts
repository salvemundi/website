import { FastifyInstance } from 'fastify';
import { ProvisionWorkerService } from '../services/provision-worker.js';

export default async function provisioningRoutes(fastify: FastifyInstance) {
    /**
     * Provision a new user in Azure AD.
     * This is now an ASYNCHRONOUS operation that joins a Redis queue.
     */
    fastify.post('/user', async (request: any, reply) => {
        const { email, firstName, lastName, phoneNumber, dateOfBirth } = request.body;

        if (!email || !firstName || !lastName) {
            return reply.status(400).send({ error: 'Missing required fields (email, firstName, lastName)' });
        }

        try {
            // Queue the provisioning task
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
        } catch (err: any) {
            fastify.log.error(`[PROVISIONING] Failed for ${email}:`, err.message);
            return reply.status(500).send({ error: 'Failed to queue provisioning task' });
        }
    });
}
