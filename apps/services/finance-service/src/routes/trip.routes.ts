import { FastifyInstance } from 'fastify';
import { createDirectus, rest, staticToken, readItem } from '@directus/sdk';
import { getMollieClient } from '../services/mollie.service.js';
import { TRIP_SIGNUP_FIELDS, TRIP_FIELDS } from '@salvemundi/validations';

export default async function tripRoutes(fastify: FastifyInstance) {
    /**
     * POST /api/finance/trip-payment-request
     * Triggered by admin to send a payment link for a trip (deposit or final).
     */
    fastify.post('/trip-payment-request', async (request: any, reply) => {
        const { signupId, tripId, paymentType } = request.body;

        if (!signupId || !tripId || !paymentType) {
            return reply.status(400).send({ error: 'Missing required fields (signupId, tripId, paymentType)' });
        }

        try {
            const directusUrl = process.env.DIRECTUS_SERVICE_URL || process.env.DIRECTUS_URL!;
            const directusToken = process.env.DIRECTUS_STATIC_TOKEN!;
            
            const directus = createDirectus(directusUrl)
                .with(staticToken(directusToken))
                .with(rest());

            // 1. Fetch Trip and Signup data
            const [signup, trip] = await Promise.all([
                directus.request(readItem('trip_signups', signupId, { fields: [...TRIP_SIGNUP_FIELDS] })),
                directus.request(readItem('trips', tripId, { fields: [...TRIP_FIELDS] }))
            ]) as [any, any];

            if (!signup || !trip) {
                return reply.status(404).send({ error: 'Trip or Signup not found' });
            }

            // 2. Calculate Amount
            let amount = 0;
            let description = '';
            
            if (paymentType === 'deposit') {
                amount = Number(trip.deposit_amount);
                description = `Aanbetaling: ${trip.title || 'Reis'}`;
            } else if (paymentType === 'final') {
                // Final payment = base_price - deposit_amount (assuming deposit was already paid)
                // In reality, it should probably be base_price - amount_already_paid
                amount = Number(trip.base_price) - Number(trip.deposit_amount);
                description = `Restbetaling: ${trip.title || 'Reis'}`;
            } else {
                return reply.status(400).send({ error: 'Invalid paymentType' });
            }

            if (amount <= 0) {
                return reply.status(400).send({ error: 'Calculated amount is zero or negative' });
            }

            // 3. Create Mollie Payment
            const mollie = getMollieClient();
            const payment = await mollie.payments.create({
                amount: {
                    currency: 'EUR',
                    value: amount.toFixed(2)
                },
                description,
                redirectUrl: `${process.env.PUBLIC_URL}/reis/betaling-bevestiging?id=${signupId}`,
                webhookUrl: `${process.env.PUBLIC_URL}/api/finance/webhook/mollie`,
                metadata: {
                    registrationId: signupId,
                    registrationType: 'trip_signup',
                    paymentType, // 'deposit' or 'final'
                    tripId,
                    email: signup.email
                }
            });

            // 4. Send Email via Mail Service
            const mailServiceUrl = process.env.MAIL_SERVICE_URL;
            const internalToken = process.env.INTERNAL_SERVICE_TOKEN;

            if (mailServiceUrl) {
                try {
                    await fetch(`${mailServiceUrl}/api/mail/send`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${internalToken}`
                        },
                        body: JSON.stringify({
                            templateId: 'trip-payment-request',
                            to: signup.email,
                            data: {
                                firstName: signup.first_name,
                                tripName: trip.title,
                                paymentType: paymentType === 'deposit' ? 'aanbetaling' : 'restbetaling',
                                amount: amount.toFixed(2),
                                checkoutUrl: payment.getCheckoutUrl(),
                                description
                            }
                        })
                    });
                } catch (mailErr) {
                    fastify.log.error({ err: mailErr }, '[TRIP] Mail sending failed');
                    // We don't fail the whole request if mail fails, but we log it
                }
            }

            return { success: true, checkoutUrl: payment.getCheckoutUrl() };
        } catch (err: any) {
            fastify.log.error('[TRIP] Error creating payment request:', err);
            return reply.status(500).send({ error: 'Failed to create payment request', message: err.message });
        }
    });
}
