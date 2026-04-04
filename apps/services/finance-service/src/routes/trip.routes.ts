import { FastifyInstance } from 'fastify';
import { createDirectus, rest, staticToken, readItem, readItems, updateItem } from '@directus/sdk';
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

            // 1. Fetch Trip, Signup and Selected Activities data
            const [signup, trip, signupActivities] = await Promise.all([
                directus.request(readItem('trip_signups', signupId, { fields: [...TRIP_SIGNUP_FIELDS] })),
                directus.request(readItem('trips', tripId, { fields: [...TRIP_FIELDS] })),
                directus.request(readItems('trip_signup_activities', {
                    filter: { trip_signup_id: { _eq: signupId } },
                    fields: ['id', 'trip_activity_id', { trip_activity_id: ['id', 'price', 'name'] }] as any
                }))
            ]) as [any, any, any[]];

            if (!signup || !trip) {
                return reply.status(404).send({ error: 'Trip or Signup not found' });
            }

            // 2. Calculate Total Price
            const basePrice = Number(trip.base_price || 0);
            const crewDiscount = (signup.role === 'crew' ? Number(trip.crew_discount || 0) : 0);
            
            const activitiesPrice = (signupActivities || []).reduce((sum, sa) => {
                const price = Number(sa.trip_activity_id?.price || 0);
                return sum + price;
            }, 0);

            const totalPrice = basePrice - crewDiscount + activitiesPrice;
            const depositAmount = Number(trip.deposit_amount || 0);

            // 3. Calculate Final Amount based on paymentType
            let amount = 0;
            let description = '';
            
            if (paymentType === 'deposit') {
                amount = depositAmount;
                description = `Aanbetaling: ${trip.name || 'Reis'}`;
            } else if (paymentType === 'final') {
                // Final payment = total - deposit
                // We assume deposit was either paid or will be paid. 
                // In a perfect system, we'd check actual transactions, but this follows the business logic provided.
                amount = totalPrice - depositAmount;
                description = `Restbetaling: ${trip.name || 'Reis'}`;
                
                if (!trip.allow_final_payments && signup.role !== 'admin') {
                    return reply.status(403).send({ error: 'Final payments are not yet enabled for this trip' });
                }
            } else {
                return reply.status(400).send({ error: 'Invalid paymentType' });
            }

            if (amount <= 0) {
                return reply.status(400).send({ error: 'Calculated amount is zero or negative' });
            }

            // 3. Create Mollie Payment
            const accessToken = crypto.randomUUID();
            const baseRedirectUrl = `${process.env.PUBLIC_URL}/reis/bevestiging?id=${signupId}`;
            const finalRedirectUrl = `${baseRedirectUrl}&t=${accessToken}`;

            const mollie = getMollieClient();
            const payment = await mollie.payments.create({
                amount: {
                    currency: 'EUR',
                    value: amount.toFixed(2)
                },
                description,
                redirectUrl: finalRedirectUrl,
                webhookUrl: `${process.env.PUBLIC_URL}/api/finance/webhook/mollie`,
                metadata: {
                    registrationId: signupId,
                    registrationType: 'trip_signup',
                    paymentType, // 'deposit' or 'final'
                    tripId,
                    email: signup.email,
                    userId: signup.directus_relations || null // Link to user if available
                }
            });

            // 4. Store transaction in PostgreSQL
            await fastify.db.query(
                `INSERT INTO transactions (
                    mollie_id, amount, payment_status, product_name, product_type,
                    user_id, email, first_name, last_name, access_token, trip_signup,
                    created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
                [
                    payment.id, amount, 'open', description, 'trip_signup',
                    signup.directus_relations || null, signup.email, signup.first_name || '', signup.last_name || '',
                    accessToken, signupId
                ]
            );

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
                                tripName: trip.name,
                                paymentType: paymentType === 'deposit' ? 'aanbetaling' : 'restbetaling',
                                amount: amount.toFixed(2),
                                checkoutUrl: payment._links?.checkout?.href,
                                description
                            }
                        })
                    });
                } catch (mailErr) {
                    fastify.log.error({ err: mailErr }, '[TRIP] Mail sending failed');
                    // We don't fail the whole request if mail fails, but we log it
                }

                // 6. Update Directus with mail-sent status
                try {
                    const { updateItem } = await import('@directus/sdk');
                    const fieldToUpdate = paymentType === 'deposit' ? 'deposit_email_sent' : 'final_email_sent';
                    await directus.request(updateItem('trip_signups', signupId, {
                        [fieldToUpdate]: true
                    }));
                    fastify.log.info(`[TRIP] Updated ${fieldToUpdate} for signup ${signupId}`);
                } catch (directusErr) {
                    fastify.log.error({ err: directusErr }, `[TRIP] Failed to update mail-sent status for signup ${signupId}`);
                }
            }

            return { success: true, checkoutUrl: payment._links?.checkout?.href };
        } catch (err: any) {
            fastify.log.error(err, '[TRIP] Error creating payment request');
            return reply.status(500).send({ error: 'Failed to create payment request', message: err.message });
        }
    });
}
