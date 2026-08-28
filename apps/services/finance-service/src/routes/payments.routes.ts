import { type FastifyInstance } from 'fastify';
import { type MolliePaymentMetadata } from '@salvemundi/validations';
import { getMollieClient } from '../services/mollie.service.js';
import { PaymentService } from '../services/payment.service.js';
import crypto from 'node:crypto';
import { verifyInternalToken } from '../middleware/auth.js';
import { schema, eq } from '@salvemundi/db';

const PRODUCT_TYPE_MAP = new Map<string, string>([
    ['pub_crawl_signup', 'Kroegentocht'],
    ['trip_signup', 'Reis'],
    ['event_signup', 'Activiteit'],
    ['webshop_preorder', 'Webshop']
]);

export default async function paymentsRoutes(fastify: FastifyInstance) {
    await Promise.resolve();

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
            paymentType?: string;
        }
    }>('/create', { preHandler: [verifyInternalToken] }, async (request, reply) => {
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
            couponCode,
            paymentType
        } = request.body;

        if (!Number.isFinite(amount) || amount < 0 || !description || !redirectUrl) {
            return reply.status(400).send({ error: 'Missing required fields (amount, description, redirectUrl)' });
        }

        // A coupon can discount a registration down to 0. Mollie doesn't support 0-value
        // payments, so we skip the checkout entirely and finalize the transaction as paid
        // right away instead of forcing the user through a real (e.g. 1 cent) payment.
        const isFree = amount <= 0;

        try {
            const accessToken = crypto.randomUUID();
            const separator = redirectUrl.includes('?') ? '&' : '?';
            const finalRedirectUrl = `${redirectUrl}${separator}t=${accessToken}`;

            const metadata: MolliePaymentMetadata = {
                registrationId,
                registrationType,
                userId,
                email,
                firstName,
                lastName,
                phoneNumber,
                dateOfBirth,
                isContribution,
                couponCode,
                paymentType
            };

            let molliePaymentId: string;
            let checkoutUrl: string | undefined;

            if (isFree) {
                molliePaymentId = `free_${crypto.randomUUID()}`;
            } else {
                const mollie = getMollieClient();

                const webhookUrl = process.env.PUBLIC_URL && !process.env.PUBLIC_URL.includes('localhost')
                    ? `${process.env.PUBLIC_URL}/api/finance/webhook/mollie`
                    : undefined;

                fastify.log.info(`[payments.routes.ts][paymentRoutes] Creating Mollie payment with webhookUrl: ${webhookUrl || 'undefined'}`);

                const payment = await mollie.payments.create({
                    amount: {
                        currency: 'EUR',
                        value: amount.toFixed(2)
                    },
                    description,
                    redirectUrl: finalRedirectUrl,
                    ...(webhookUrl ? { webhookUrl } : {}),
                    metadata
                });

                molliePaymentId = payment.id;
                checkoutUrl = payment._links.checkout?.href;
            }

            let productType = 'Overig';
            if (isContribution) {
                productType = 'membership';
            } else if (registrationType && PRODUCT_TYPE_MAP.has(registrationType)) {
                productType = PRODUCT_TYPE_MAP.get(registrationType) || 'Overig';
            } else if (registrationType) {
                productType = registrationType;
            }

            const insertData = {
                mollie_id: molliePaymentId,
                transaction_id: molliePaymentId,
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
            } as typeof schema.transactions.$inferInsert;

            if (registrationType === 'event_signup' || registrationType === 'membership') {
                insertData.registration = Number(registrationId) || null;
            } else if (registrationType === 'trip_signup') {
                insertData.trip_signup = Number(registrationId) || null;
            } else if (registrationType === 'pub_crawl_signup') {
                insertData.pub_crawl_signup = Number(registrationId) || null;
            } else if (registrationType === 'webshop_preorder') {
                insertData.webshop_preorder = Number(registrationId) || null;
            }

            const dbResult = await fastify.db
                .insert(schema.transactions)
                .values(insertData)
                .returning({ id: schema.transactions.id })
                .then((res: { id: number }[]) => res[0]);

            const transactionDbId = dbResult.id;
            if (!transactionDbId) {
                throw new Error('Failed to retrieve inserted transaction ID');
            }

            if (registrationType === 'pub_crawl_signup' && registrationId) {
                await fastify.db
                    .insert(schema.pub_crawl_signups_transactions)
                    .values({
                        pub_crawl_signups_id: Number(registrationId),
                        transactions_id: transactionDbId
                    });
                fastify.log.info(`[payments.routes.ts][paymentRoutes] Linked transaction ${transactionDbId} to pub_crawl_signup ${registrationId}`);
            }

            if (isFree) {
                await PaymentService.finalizePayment(fastify, molliePaymentId, 'paid', metadata, accessToken);
                fastify.log.info(`[payments.routes.ts][paymentRoutes] Finalized free (coupon-covered) transaction ${transactionDbId} without Mollie checkout`);
                return { checkoutUrl: finalRedirectUrl, mollie_id: molliePaymentId, access_token: accessToken, free: true };
            }

            return { checkoutUrl, mollie_id: molliePaymentId, access_token: accessToken };
        } catch (error: unknown) {
            const err = error as { message?: string; code?: string; detail?: string };
            fastify.log.error({ error, message: err.message, code: err.code, detail: err.detail }, '[payments.routes.ts][paymentRoutes] Error creating payment');
            return reply.status(500).send({ error: 'Failed to create payment', message: err.message || 'Unknown error' });
        }
    });

    fastify.post<{ Body: { mollieId: string } }>('/approve', { preHandler: [verifyInternalToken] }, async (request, reply) => {
        const { mollieId } = request.body;
        if (!mollieId) return reply.status(400).send({ error: 'Missing mollieId' });

        try {
            await fastify.db
                .update(schema.transactions)
                .set({
                    approval_status: 'approved',
                    updated_at: new Date().toISOString()
                })
                .where(eq(schema.transactions.mollie_id, mollieId));

            const tx = (await fastify.db
                .select()
                .from(schema.transactions)
                .where(eq(schema.transactions.mollie_id, mollieId))
                .limit(1))[0];

            if (tx.payment_status !== 'paid') {
                return reply.status(400).send({ error: 'Transaction not found or not paid yet' });
            }

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
            fastify.log.info(`[payments.routes.ts][paymentRoutes] Manually approved and published success event for ${mollieId}`);

            return { success: true };
        } catch (error: unknown) {
            const err = error as Error;
            fastify.log.error(error as Error, `[payments.routes.ts][paymentRoutes] Approval failed for ${mollieId}`);
            
            if (err.message && err.message.includes('wrong mode is used')) {
                return reply.status(400).send({ 
                    error: 'Approval failed', 
                    message: 'Deze betaling is gedaan in een andere modus (live/test) dan de actieve API-key van deze container. Schakel over naar de juiste omgeving.' 
                });
            }
            
            return reply.status(500).send({ error: 'Approval failed', message: err.message });
        }
    });
}
