import { FastifyInstance } from 'fastify';
import { getMollieClient } from '../services/mollie.service.js';
import { RegistrationService } from '../services/registration.service.js';

export default async function statusRoutes(fastify: FastifyInstance) {
    /**
     * GET /api/finance/status/:id
     * Returns the current status of a transaction.
     * If local status is 'open', it attempts a live Mollie check.
     */
    fastify.get('/status/:id', async (request: any, reply) => {
        const { id } = request.params;

        if (!id) {
            return reply.status(400).send({ error: 'Missing ID' });
        }

        const isMollieId = id.startsWith('tr_');
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

        if (!isUuid) {
            return reply.status(400).send({ error: 'Invalid ID format. Only UUID access tokens are allowed for status checks.' });
        }

        try {
            const query = 'SELECT mollie_id, payment_status, amount, product_type, registration, trip_signup, pub_crawl_signup, created_at, updated_at FROM transactions WHERE access_token = $1 LIMIT 1';

            const result = await fastify.db.query(query, [id]);

            if (result.rows.length === 0) {
                return reply.status(404).send({ error: 'Transaction not found' });
            }

            const transaction = result.rows[0];

            // Live status fallback if still open
            if (transaction.payment_status === 'open' && transaction.mollie_id) {
                try {
                    const mollie = getMollieClient();
                    const livePayment = await mollie.payments.get(transaction.mollie_id);
                    
                    if (livePayment.status !== transaction.payment_status) {
                        fastify.log.info(`[STATUS] Live status mismatch for ${transaction.mollie_id}: DB=${transaction.payment_status}, Mollie=${livePayment.status}. Updating DB.`);
                        
                        await fastify.db.query(
                            'UPDATE transactions SET payment_status = $1, updated_at = NOW() WHERE mollie_id = $2',
                            [livePayment.status, transaction.mollie_id]
                        );

                        // If it transitioned to paid, trigger the same logic as the webhook
                        if (livePayment.status === 'paid') {
                            const metadata = livePayment.metadata as any;
                            const registrationId = transaction.registration || metadata?.registrationId;
                            const registrationType = metadata?.registrationType;

                            const eventData = {
                                event: 'PAYMENT_SUCCESS',
                                userId: transaction.user_id,
                                paymentId: transaction.mollie_id,
                                email: transaction.email || metadata?.email,
                                registrationId: registrationId,
                                registrationType: registrationType,
                                isContribution: transaction.product_type === 'membership',
                                isNewMember: !transaction.user_id && transaction.product_type === 'membership',
                                accessToken: transaction.access_token,
                                firstName: transaction.first_name || metadata?.firstName,
                                lastName: transaction.last_name || metadata?.lastName,
                                phoneNumber: metadata?.phoneNumber,
                                dateOfBirth: metadata?.dateOfBirth,
                                timestamp: new Date().toISOString()
                            };

                            await fastify.redis.xadd('v7:events', '*', 'payload', JSON.stringify(eventData));
                            fastify.log.info(`[STATUS] Published PAYMENT_SUCCESS event for ${transaction.mollie_id} via status check fallback`);

                            // Update registration tables via RegistrationService
                            if (registrationId && registrationType) {
                                try {
                                    await RegistrationService.updateStatus(
                                        fastify.db,
                                        fastify.redis,
                                        {
                                            registrationId,
                                            registrationType,
                                            paymentType: metadata?.paymentType
                                        },
                                        fastify.log
                                    );
                                } catch (regErr) {
                                    fastify.log.error(regErr, `[STATUS] Failed to update registration for ${id}`);
                                }
                            }
                        }
                        
                        transaction.payment_status = livePayment.status;
                        transaction.updated_at = new Date();
                    }
                } catch (mollieErr) {
                    fastify.log.error(mollieErr, `[STATUS] Failed to fetch live Mollie status for ${transaction.mollie_id}`);
                }
            }

            return {
                ...transaction,
                signup_id: transaction.registration || transaction.trip_signup || transaction.pub_crawl_signup
            };
        } catch (err) {
            fastify.log.error(err, `[STATUS] Error fetching status for ${id}`);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
