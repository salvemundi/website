import { type FastifyInstance, type FastifyRequest, type FastifyReply } from 'fastify';
import { createDirectus, rest, staticToken, readItem, readItems, updateItem } from '@directus/sdk';
import { getMollieClient } from '../services/mollie.service.js';
import { TRIP_SIGNUP_FIELDS, TRIP_FIELDS } from '@salvemundi/validations';
import crypto from 'node:crypto';
import { DbTripSignup as TripSignup, DbTrip as Trip } from '@salvemundi/validations/directus/schema';
import { verifyInternalToken } from '../middleware/auth.js';

interface TripPaymentRequest {
    signupId?: number;
    tripId?: number;
    paymentType?: 'deposit' | 'final';
    isConfirmedByUser?: boolean;
}

interface SignupActivityOption {
    id?: string;
    price?: number;
}

interface SignupActivityWithDetails {
    id: number | null;
    trip_activity_id?: {
        id: number;
        price?: number | null;
        name?: string | null;
        options?: SignupActivityOption[] | null;
    } | null;
    selected_options?: Record<string, boolean> | null;
}

export default async function tripRoutes(fastify: FastifyInstance) {
    await Promise.resolve();

    fastify.post('/trip-payment-request', { preHandler: [verifyInternalToken] }, async (request, reply) => {
        const { signupId, tripId, paymentType, isConfirmedByUser } = request.body as TripPaymentRequest;

        if (!signupId || !tripId || !paymentType) {
            return reply.status(400).send({ error: 'Missing required fields (signupId, tripId, paymentType)' });
        }

        try {
            const directusUrl = process.env.DIRECTUS_SERVICE_URL || process.env.DIRECTUS_URL || '';
            const directusToken = process.env.DIRECTUS_STATIC_TOKEN || '';

            if (!directusUrl || !directusToken) {
                throw new Error('Directus configuration is missing');
            }

            const directus = createDirectus(directusUrl)
                .with(staticToken(directusToken))
                .with(rest());

            const [trip, signupActivities] = await Promise.all([
                directus.request(readItem('trips', tripId, { fields: [...TRIP_FIELDS] })),
                directus.request(readItems('trip_signup_activities', {
                    filter: { trip_signup_id: { _eq: signupId } },
                    fields: ['id', 'trip_activity_id', 'selected_options', { trip_activity_id: ['id', 'price', 'name', 'options'] }] as never[]
                }))
            ]) as [Trip, SignupActivityWithDetails[]];

            let signup: TripSignup;
            try {
                signup = await directus.request(readItem('trip_signups', signupId, {
                    fields: [...TRIP_SIGNUP_FIELDS]
                })) as TripSignup;
            } catch {
                return reply.status(404).send({ error: 'Signup not found' });
            }

            if (paymentType === 'deposit' && signup.deposit_paid) {
                return reply.status(400).send({ error: 'Aanbetaling is al voldaan.' });
            }
            if (paymentType === 'final' && signup.full_payment_paid) {
                return reply.status(400).send({ error: 'Restbetaling is al voldaan.' });
            }
            if (paymentType === 'final' && !trip.allow_final_payments && signup.role !== 'admin') {
                return reply.status(403).send({ error: 'Restbetalingen zijn nog niet geopend voor deze reis.' });
            }

            if (signup.status !== 'confirmed' && signup.role !== 'admin') {
                return reply.status(403).send({
                    error: 'Je staat nog op de wachtlijst of je aanmelding is nog niet goedgekeurd. Je kunt pas betalen als je status op "bevestigd" staat.'
                });
            }

            const basePrice = Number(trip.base_price || 0);
            const crewDiscount = (signup.role === 'crew' ? Number(trip.crew_discount || 0) : 0);

            const activitiesPrice = signupActivities.reduce((sum, sa) => {
                const activity = sa.trip_activity_id;
                let price = Number(activity?.price || 0);

                const selectedOpts = sa.selected_options || {};
                const availableOpts = activity?.options || [];

                if (Array.isArray(availableOpts)) {
                    availableOpts.forEach((opt: SignupActivityOption) => {
                        if (opt.id && selectedOpts[opt.id]) {
                            price += Number(opt.price || 0);
                        }
                    });
                }

                return sum + price;
            }, 0);

            const totalPrice = basePrice - crewDiscount + activitiesPrice;
            const depositAmount = Number(trip.deposit_amount || 0);

            let amount = 0;
            let description = '';

            if (paymentType === 'deposit') {
                amount = depositAmount;
                description = `Aanbetaling: ${trip.name}`;
            } else {
                amount = totalPrice - depositAmount;
                description = `Restbetaling: ${trip.name}`;
            }

            let accessToken = signup.access_token;
            if (!accessToken) {
                accessToken = crypto.randomUUID();
                try {
                    await directus.request(updateItem('trip_signups', signupId, {
                        access_token: accessToken
                    }));
                } catch (error: unknown) {
                    fastify.log.error(error, `[TRIP] Failed to update access_token for signup ${signupId}`);
                }
            }

            if (!isConfirmedByUser) {
                const mailServiceUrl = process.env.MAIL_SERVICE_URL;
                const internalToken = (process.env.INTERNAL_SERVICE_TOKEN || '').replace(/^"|"$/g, '').trim();
                const paymentPath = paymentType === 'final' ? 'restbetaling' : 'aanbetaling';
                const enrichmentUrl = `${process.env.PUBLIC_URL}/reis/betalen/${paymentPath}?id=${signupId}&t=${accessToken}`;

                if (mailServiceUrl) {
                    try {
                        const mailPayload = {
                            templateId: 'trip-payment-request',
                            to: signup.email,
                            data: {
                                firstName: signup.first_name,
                                tripName: trip.name,
                                paymentType: paymentType === 'deposit' ? 'aanbetaling' : 'restbetaling',
                                amount: amount.toFixed(2),
                                checkoutUrl: enrichmentUrl,
                                description
                            }
                        };

                        await fetch(`${mailServiceUrl}/api/mail/send`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${internalToken}`
                            },
                            body: JSON.stringify(mailPayload)
                        });

                        const fieldToUpdate = paymentType === 'deposit' ? 'deposit_email_sent' : 'final_email_sent';
                        await directus.request(updateItem('trip_signups', signupId, {
                            [fieldToUpdate]: true
                        }));
                    } catch (error: unknown) {
                        fastify.log.error(error, '[TRIP] Enrichment mail failed');
                        return reply.status(500).send({ error: 'Mail delivery failed' });
                    }
                }
                return { success: true, message: 'Enrichment email sent' };
            }

            if (amount <= 0) {
                return reply.status(400).send({
                    error: 'Het te betalen bedrag is 0 of negatief. Neem contact op met de reiscommissie.'
                });
            }

            const webhookUrl = process.env.PUBLIC_URL && !process.env.PUBLIC_URL.includes('localhost')
                ? `${process.env.PUBLIC_URL}/api/finance/webhook/mollie`
                : undefined;

            const transactionToken = crypto.randomUUID();
            const confirmationUrl = `${process.env.PUBLIC_URL}/reis/bevestiging?id=${signupId}&t=${accessToken}&tr=${transactionToken}`;
            const mollie = getMollieClient();
            const payment = await mollie.payments.create({
                amount: { currency: 'EUR', value: amount.toFixed(2) },
                description,
                redirectUrl: confirmationUrl,
                ...(webhookUrl ? { webhookUrl } : {}),
                metadata: {
                    registrationId: signupId,
                    registrationType: 'trip_signup',
                    paymentType,
                    tripId,
                    email: signup.email
                }
            });

            await fastify.db
                .insertInto('transactions')
                .values({
                    mollie_id: payment.id,
                    amount,
                    payment_status: 'open',
                    product_name: description,
                    product_type: 'Reis',
                    user_id: signup.directus_relations ? String(signup.directus_relations) : null,
                    email: signup.email,
                    first_name: signup.first_name || '',
                    last_name: signup.last_name || '',
                    access_token: transactionToken,
                    trip_signup: signupId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .execute();

            return { success: true, checkoutUrl: payment._links.checkout?.href };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            const stack = error instanceof Error ? error.stack : undefined;

            fastify.log.error({
                error,
                message,
                stack,
                signupId,
                tripId
            }, '[TRIP] Error in payment flow');

            return reply.status(500).send({
                error: 'Interne serverfout bij het verwerken van de betaling.',
                message: 'Er is een fout opgetreden bij de betaalservice.'
            });
        }
    });
}