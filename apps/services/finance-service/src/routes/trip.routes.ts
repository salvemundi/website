import { type FastifyInstance} from 'fastify';
import { getMollieClient } from '../services/mollie.service.js';
import crypto from 'node:crypto';
import { verifyInternalToken } from '../middleware/auth.js';
import { schema, eq } from '@salvemundi/db';

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

export default async function tripRoutes(fastify: FastifyInstance) {
    await Promise.resolve();

    fastify.post('/trip-payment-request', { preHandler: [verifyInternalToken] }, async (request, reply) => {
        const { signupId, tripId, paymentType, isConfirmedByUser } = request.body as TripPaymentRequest;

        if (!signupId || !tripId || !paymentType) {
            return reply.status(400).send({ error: 'Onjuiste velden' });
        }

        try {
            const tripsResult = await fastify.db
                .select()
                .from(schema.trips)
                .where(eq(schema.trips.id, tripId))
                .limit(1);

            if (tripsResult.length === 0) {
                return reply.status(404).send({ error: 'Reis niet gevonden' });
            }
            const trip = tripsResult[0];

            const signupActivities = await fastify.db
                .select({
                    id: schema.trip_signup_activities.id,
                    selected_options: schema.trip_signup_activities.selected_options,
                    trip_activity_id: {
                        id: schema.trip_activities.id,
                        price: schema.trip_activities.price,
                        name: schema.trip_activities.name,
                        options: schema.trip_activities.options
                    }
                })
                .from(schema.trip_signup_activities)
                .leftJoin(schema.trip_activities, eq(schema.trip_signup_activities.trip_activity_id, schema.trip_activities.id))
                .where(eq(schema.trip_signup_activities.trip_signup_id, signupId));

            const signupsResult = await fastify.db
                .select()
                .from(schema.trip_signups)
                .where(eq(schema.trip_signups.id, signupId))
                .limit(1);

            if (signupsResult.length === 0) {
                return reply.status(404).send({ error: 'Inschrijving niet gevonden.' });
            }
            const signup = signupsResult[0];

            if (paymentType === 'deposit' && signup.deposit_paid) {
                return reply.status(400).send({ error: 'Aanbetaling is al voldaan.' });
            }
            if (paymentType === 'deposit' && !trip.allow_deposit_payments && signup.role !== 'admin') {
                return reply.status(403).send({ error: 'Aanbetalingen zijn nog niet geopend voor deze reis.' });
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

                const selectedOpts = (sa.selected_options || {}) as Record<string, unknown>;
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
                    await fastify.db
                        .update(schema.trip_signups)
                        .set({ access_token: accessToken })
                        .where(eq(schema.trip_signups.id, signupId));
                } catch (error: unknown) {
                    fastify.log.error(error, `[trip.routes.ts][tripRoutes] Toegangscode opslaan mislukt voor ${signupId}`);
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
                        await fastify.db
                            .update(schema.trip_signups)
                            .set({ [fieldToUpdate]: true })
                            .where(eq(schema.trip_signups.id, signupId));
                    } catch (error: unknown) {
                        fastify.log.error(error, '[trip.routes.ts][tripRoutes] Betalingsherinnering e-mail mislukt');
                        return reply.status(500).send({ error: 'Betalingsherinnering e-mail mislukt' });
                    }
                }
                return { success: true, message: 'Betalingsherinnering is verzonden naar de reiziger' };
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
                .insert(schema.transactions)
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
                });

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
            }, '[trip.routes.ts][tripRoutes] Error in payment');

            return reply.status(500).send({
                error: 'Interne serverfout bij het verwerken van de betaling.',
                message: 'Er is een fout opgetreden bij de betaalservice.'
            });
        }
    });
}