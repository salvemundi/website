import { FastifyInstance } from 'fastify';
import { createDirectus, rest, staticToken, readItem, readItems, updateItem } from '@directus/sdk';
import { getMollieClient } from '../services/mollie.service.js';
import { TRIP_SIGNUP_FIELDS, TRIP_FIELDS } from '@salvemundi/validations';
import crypto from 'node:crypto';
import { DbTripSignup as TripSignup, DbTrip as Trip } from '@salvemundi/validations/directus/schema';

interface TripPaymentRequest {
    signupId: number;
    tripId: number;
    paymentType: 'deposit' | 'final';
    isConfirmedByUser?: boolean;
}

export default async function tripRoutes(fastify: FastifyInstance) {
    /**
     * POST /api/finance/trip-payment-request
     * Handles both admin enrichment mail generation AND user payment creation.
     */
    fastify.post('/trip-payment-request', async (request, reply) => {
        const { signupId, tripId, paymentType, isConfirmedByUser } = request.body as TripPaymentRequest;

        if (!signupId || !tripId || !paymentType) {
            return reply.status(400).send({ error: 'Missing required fields (signupId, tripId, paymentType)' });
        }

        try {
            const directusUrl = process.env.DIRECTUS_SERVICE_URL || process.env.DIRECTUS_URL!;
            const directusToken = process.env.DIRECTUS_STATIC_TOKEN!;
            
            const directus = createDirectus(directusUrl)
                .with(staticToken(directusToken))
                .with(rest());

            // 1. Fetch Trip and Activities
            const [trip, signupActivities] = await Promise.all([
                directus.request(readItem('trips', tripId, { fields: [...TRIP_FIELDS] })),
                directus.request(readItems('trip_signup_activities', {
                    filter: { trip_signup_id: { _eq: signupId } },
                    fields: ['id', 'trip_activity_id', 'selected_options', { trip_activity_id: ['id', 'price', 'name', 'options'] }] as never[]
                }))
            ]) as [Trip, any[]];

            // 2. Fetch Signup
            let signup: TripSignup;
            try {
                signup = await directus.request(readItem('trip_signups', signupId, { 
                    fields: [...TRIP_SIGNUP_FIELDS] 
                })) as TripSignup;
            } catch (err) {
                return reply.status(404).send({ error: 'Signup not found' });
            }

            if (!signup || !trip) {
                return reply.status(404).send({ error: 'Trip or Signup not found' });
            }

            // 3. Status checks
            if (paymentType === 'deposit' && signup.deposit_paid) {
                return reply.status(400).send({ error: 'Aanbetaling is al voldaan.' });
            }
            if (paymentType === 'final' && signup.full_payment_paid) {
                return reply.status(400).send({ error: 'Restbetaling is al voldaan.' });
            }
            if (paymentType === 'final' && !trip.allow_final_payments && signup.role !== 'admin') {
                return reply.status(403).send({ error: 'Restbetalingen zijn nog niet geopend voor deze reis.' });
            }

            // [VULN-006 Fix] Waitlist protection: Only confirmed signups can pay
            if (signup.status !== 'confirmed' && signup.role !== 'admin') {
                return reply.status(403).send({ 
                    error: 'Je staat nog op de wachtlijst of je aanmelding is nog niet goedgekeurd. Je kunt pas betalen als je status op "bevestigd" staat.' 
                });
            }

            // 4. Calculate Total Price (Robustly include sub-options)
            const basePrice = Number(trip.base_price || 0);
            const crewDiscount = (signup.role === 'crew' ? Number(trip.crew_discount || 0) : 0);
            
            const activitiesPrice = (signupActivities || []).reduce((sum, sa) => {
                const activity = sa.trip_activity_id;
                let price = Number(activity?.price || 0);
                
                // Add sub-option prices
                const selectedOpts = sa.selected_options || {};
                const availableOpts = activity?.options || [];
                
                if (Array.isArray(availableOpts)) {
                    availableOpts.forEach((opt: { id?: string; price?: number }) => {
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

            // 5. Manage Access Token (Generate if missing)
            let accessToken = signup.access_token;
            if (!accessToken) {
                accessToken = crypto.randomUUID();
                try {
                    await directus.request(updateItem('trip_signups', signupId, { 
                        access_token: accessToken 
                    }));
                    fastify.log.info(`[TRIP] Generated and saved access_token for signup ${signupId}`);
                } catch (updateErr) {
                    fastify.log.error(updateErr, `[TRIP] Failed to update access_token for signup ${signupId}`);
                }
            }

            // 6. Case A: Admin just wants to send the enrichment mail
            if (!isConfirmedByUser) {
                const mailServiceUrl = process.env.MAIL_SERVICE_URL;
                const internalToken = process.env.INTERNAL_SERVICE_TOKEN;
                const paymentPath = paymentType === 'final' ? 'restbetaling' : paymentType;
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
                    } catch (mailErr) {
                        fastify.log.error(mailErr, '[TRIP] Enrichment mail failed');
                        return reply.status(500).send({ error: 'Mail delivery failed' });
                    }
                }
                return { success: true, message: 'Enrichment email sent' };
            }

            // 7. Case B: User confirmed on frontend, create REAL Mollie payment
            if (amount <= 0) {
                return reply.status(400).send({ 
                    error: 'Het te betalen bedrag is 0 of negatief. Neem contact op met de reiscommissie als je denkt dat dit een fout is.' 
                });
            }

            const webhookUrl = process.env.PUBLIC_URL && !process.env.PUBLIC_URL.includes('localhost') 
                ? `${process.env.PUBLIC_URL}/api/finance/webhook/mollie` 
                : undefined;

            const confirmationUrl = `${process.env.PUBLIC_URL}/reis/bevestiging?id=${signupId}&t=${accessToken}`;
            const mollie = getMollieClient();
            const payment = await mollie.payments.create({
                amount: { currency: 'EUR', value: amount.toFixed(2) },
                description,
                redirectUrl: confirmationUrl,
                // Only provide webhookUrl if it's not localhost (Mollie requirement)
                ...(webhookUrl ? { webhookUrl } : {}),
                metadata: {
                    registrationId: signupId,
                    registrationType: 'trip_signup',
                    paymentType, 
                    tripId,
                    email: signup.email
                }
            });

            await fastify.db.query(
                `INSERT INTO transactions (
                    mollie_id, amount, payment_status, product_name, product_type,
                    user_id, email, first_name, last_name, access_token, trip_signup,
                    created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
                [
                    payment.id, amount, 'open', description, 'Reis',
                    signup.directus_relations || null, signup.email, signup.first_name || '', signup.last_name || '',
                    accessToken, signupId
                ]
            );

            return { success: true, checkoutUrl: payment._links?.checkout?.href };
        } catch (error) {
            const err = error as Error & { response?: { data?: { errors?: unknown } }; details?: unknown };
            fastify.log.error({ 
                err, 
                message: err.message, 
                stack: err.stack,
                signupId,
                tripId
            }, '[TRIP] Error in payment flow');
            
            return reply.status(500).send({ 
                error: 'Interne serverfout bij het verwerken van de betaling.', 
                message: 'Er is een fout opgetreden bij de betaalservice. Probeer het later opnieuw of neem contact op met de administratie.'
            });
        }
    });
}
