import { FastifyInstance } from 'fastify';

export default async function provisioningRoutes(fastify: FastifyInstance) {
    /**
     * POST /api/provisioning/user
     * Body: { email: "...", firstName: "...", lastName: "..." }
     */
    fastify.post('/user', async (request: any, reply) => {
        const { email, firstName, lastName } = request.body;

        if (!email) {
            return reply.status(400).send({ error: 'Missing email' });
        }

        fastify.log.info(`[PROVISIONING] Creating/Updating user ${email}`);

        try {
            // Logic to create user in Microsoft Entra ID
            // Since this is the 관리 (Management) service, it uses the Provisioning client ID.
            
            return { success: true, message: 'User provisioned' };
        } catch (err: any) {
            fastify.log.error(`[PROVISIONING] Failed for ${email}:`, err);
            return reply.status(500).send({ error: 'Provisioning failed' });
        }
    });

    /**
     * POST /api/provisioning/group/assign
     * Body: { userId: "...", groupId: "..." }
     */
    fastify.post('/group/assign', async (request: any, reply) => {
        // ... logic for group assignment
        return { success: true };
    });
}
