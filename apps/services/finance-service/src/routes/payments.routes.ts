import { type FastifyInstance } from 'fastify';
import { type MolliePaymentMetadata } from '@salvemundi/validations';
import { getMollieClient } from '../services/mollie.service.js';
import crypto from 'node:crypto';

export default async function paymentsRoutes(fastify: FastifyInstance) {
    await Promise.resolve();
    /**
     * POST /api/payments/create
     * Creates a new Mollie payment and stores a transaction record.
     */
    fastify.post<{
        Body: {
            amount: number;
            description: string;
            registrationId: string | number;
            registrationType: string;
            email: string;
            firstName: string;
            lastName: string;
            phoneNumber?: string;
            dateOfBirth?: string;
            isContribution?: boolean;
            isNewMember?: boolean;
            userId?: string | null;
            redirectUrl: string;
            couponCode?: string | null;
        }
    }>('/create', async (request, reply) => {
        const {
            amount,
            description,
            registrationId,
            registrationType,
            email,
            firstName,
            lastName,
            phoneNumber,
            dateOfBirth,
            isContribution,
            userId,
            redirectUrl,
            couponCode
        } = request.body;

        if (!amount || !description || !redirectUrl) {
            return reply.status(400).send({ error: 'Missing required fields (amount, description, redirectUrl)' });
        }

        try {
            const mollie = getMollieClient();

            const webhookUrl = process.env.PUBLIC_URL && !process.env.PUBLIC_URL.includes('localhost')
                ? `${process.env.PUBLIC_URL}/api/finance/webhook/mollie`
                : undefined;

            fastify.log.info(`[FINANCE] Creating Mollie payment with webhookUrl: ${webhookUrl || 'undefined'}`);

            // 1. Create payment in Mollie
            // Generate a random access_token for guest security (IDOR mitigation)
            const accessToken = crypto.randomUUID();
            const separator = redirectUrl.includes('?') ? '&' : '?';
            const finalRedirectUrl = `${redirectUrl}${separator}t=${accessToken}`;

            const payment = await mollie.payments.create({
                amount: {
                    currency: 'EUR',
                    value: amount.toFixed(2)
                },
                description,
                redirectUrl: finalRedirectUrl,
                // Only provide webhookUrl if it's not localhost (Mollie requirement)
                ...(webhookUrl ? { webhookUrl } : {}),
                metadata: {
                    registrationId,
                    registrationType,
                    userId,
                    email,
                    firstName,
                    lastName,
                    phoneNumber,
                    dateOfBirth,
                    isContribution,
                    couponCode
                }
            });

            // 2. Store transaction in PostgreSQL
            // Map registrationType to literal Dutch names for the UI as requested
            const productTypeMap = new Map<string, string>([
                ['pub_crawl_signup', 'Kroegentocht'],
                ['trip_signup', 'Reis'],
                ['event_signup', 'Activiteit']
            ]);

            let productType = 'Overig';
            if (isContribution) {
                // INTERNAL type for audit logs and system triggers
                productType = 'membership';
            } else if (registrationType && productTypeMap.has(registrationType)) {
                productType = productTypeMap.get(registrationType) || 'Overig';
            } else if (registrationType) {
                // Pre-mapped or fallback to registrationType itself
                productType = registrationType;
            }

            // 2. Build insertion object dynamically
            const insertData: Record<string, unknown> = {
                mollie_id: payment.id,
                amount: amount,
                payment_status: 'open',
                product_name: description,
                product_type: productType,
                user_id: userId || null,
                email: email || null,
                first_name: firstName || null,
                last_name: lastName || null,
                access_token: accessToken,
                coupon_code: couponCode || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            if (registrationType === 'event_signup' || registrationType === 'membership') {
                insertData['registration'] = Number(registrationId) || null;
            } else if (registrationType === 'trip_signup') {
                insertData['trip_signup'] = Number(registrationId) || null;
            } else if (registrationType === 'pub_crawl_signup') {
                insertData['pub_crawl_signup'] = Number(registrationId) || null;
            }

            const dbResult = await fastify.db
                .insertInto('transactions')
                .values(insertData as never)
                .returning('id')
                .executeTakeFirst();

            const transactionDbId = dbResult?.id;
            if (!transactionDbId) {
                throw new Error('Failed to retrieve inserted transaction ID');
            }

            // Handle M2M junction table for Pub Crawl
            if (registrationType === 'pub_crawl_signup' && registrationId) {
                await fastify.db
                    .insertInto('pub_crawl_signups_transactions')
                    .values({
                        pub_crawl_signups_id: Number(registrationId),
                        transactions_id: transactionDbId
                    })
                    .execute();
                fastify.log.info(`[FINANCE] Linked transaction ${transactionDbId} to pub_crawl_signup ${registrationId}`);
            }

            return { checkoutUrl: payment._links.checkout?.href, mollie_id: payment.id, access_token: accessToken };
        } catch (error: unknown) {
            const err = error as { message?: string; code?: string; detail?: string };
            fastify.log.error({ error, message: err.message, code: err.code, detail: err.detail }, '[FINANCE] Error creating payment');
            return reply.status(500).send({ error: 'Failed to create payment', message: err.message || 'Unknown error' });
        }
    });

    /**
     * POST /api/payments/approve
     * Manually approves a pending payment and triggers automated processing.
     */
    fastify.post<{ Body: { mollieId: string } }>('/approve', async (request, reply) => {
        const authHeader = request.headers.authorization;
        const internalToken = process.env.INTERNAL_SERVICE_TOKEN;

        if (!internalToken || authHeader !== `Bearer ${internalToken}`) {
            return reply.status(401).send({ error: 'Unauthorized: Internal Service Token required' });
        }

        const { mollieId } = request.body;
        if (!mollieId) return reply.status(400).send({ error: 'Missing mollieId' });

        try {
            // 1. Update approval_status
            await fastify.db
                .updateTable('transactions')
                .set({
                    approval_status: 'approved',
                    updated_at: new Date().toISOString()
                })
                .where('mollie_id', '=', mollieId)
                .execute();

            // 2. Fetch transaction details to re-trigger event
            const tx = await fastify.db
                .selectFrom('transactions')
                .selectAll()
                .where('mollie_id', '=', mollieId)
                .executeTakeFirst();

            if (!tx || tx.payment_status !== 'paid') {
                return reply.status(400).send({ error: 'Transaction not found or not paid yet' });
            }

            // Fetch full payment from Mollie to get metadata (names, phone, DOB)
            const mollie = getMollieClient();
            const payment = await mollie.payments.get(mollieId);
            const metadata = payment.metadata as MolliePaymentMetadata;

            const eventData = {
                event: 'PAYMENT_SUCCESS',
                userId: tx.user_id,
                paymentId: tx.mollie_id,
                email: tx.email || metadata.email,
                registrationId: tx.registration || tx.trip_signup || tx.pub_crawl_signup,
                registrationType: tx.product_type === 'pub_crawl' ? 'pub_crawl_signup' :
                    tx.product_type === 'trip' ? 'trip_signup' :
                        tx.product_type === 'event' ? 'event_signup' : tx.product_type,
                isContribution: tx.product_type === 'membership',
                isNewMember: !tx.user_id && tx.product_type === 'membership',
                accessToken: tx.access_token,
                firstName: tx.first_name || metadata.firstName,
                lastName: tx.last_name || metadata.lastName,
                phoneNumber: metadata.phoneNumber,
                dateOfBirth: metadata.dateOfBirth,
                timestamp: new Date().toISOString()
            };

            await fastify.redis.xadd('v7:events', '*', 'payload', JSON.stringify(eventData));
            fastify.log.info(`[FINANCE] Manually approved and published success event for ${mollieId}`);

            return { success: true };
        } catch (error: unknown) {
            const err = error as Error;
            fastify.log.error(error as Error, `[FINANCE] Approval failed for ${mollieId}`);
            return reply.status(500).send({ error: 'Approval failed', message: err.message });
        }
    });
}
