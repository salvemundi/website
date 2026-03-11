import { FastifyInstance } from 'fastify';
import { azureGroupOwnerSchema } from '@salvemundi/validations';

// PLACEHOLDER: This needs a Graph Client with Write permissions (WebsiteV7-Provisioning)
export default async function groupRoutes(fastify: FastifyInstance) {
    // Add owner to group (Set Leader)
    fastify.post('/:groupId/owners', async (request, reply) => {
        // Implementation moved here for architectural separation
        return reply.status(501).send({ message: 'Provisioning service is currently a placeholder.' });
    });

    // Remove owner from group (Unset Leader)
    fastify.delete('/:groupId/owners/:userId', async (request, reply) => {
        return reply.status(501).send({ message: 'Provisioning service is currently a placeholder.' });
    });
}
