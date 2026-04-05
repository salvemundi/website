import { FastifyInstance } from 'fastify';
import { createDirectus, rest, staticToken, readItem, readItems, updateItem } from '@directus/sdk';
import { getMollieClient } from '../services/mollie.service.js';
import { TRIP_SIGNUP_FIELDS, TRIP_FIELDS } from '@salvemundi/validations';

export default async function tripRoutes(fastify: FastifyInstance) {
    /**
     * POST /api/finance/trip-payment-request
     * Handles both admin enrichment mail generation AND user payment creation.
     */
    fastify.post('/trip-payment-request', async (request: any, reply) => {
        const { signupId, tripId, paymentType, isConfirmedByUser } = request.body;

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
                    fields: ['id', 'trip_activity_id', { trip_activity_id: ['id', 'price', 'name'] }] as any
                }))
            ]) as [any, any[]];

            // 2. Fetch Signup (Expliciet om te voorkomen dat permissies op access_token de boel blokkeren)
            let signup: any;
            try {
                // We proberen access_token mee te pakken, maar vallen terug op basisvelden als het failt
                signup = await directus.request(readItem('trip_signups', signupId, { 
                    fields: [...TRIP_SIGNUP_FIELDS, 'access_token' as any] 
                }));
            } catch (err) {
                fastify.log.warn(`[TRIP] Could not read access_token from signup ${signupId}. Falling back to standard fields.`);
                signup = await directus.request(readItem('trip_signups', signupId, { 
                    fields: [...TRIP_SIGNUP_FIELDS] 
                }));
            }

            if (!signup || !trip) {
                return reply.status(404).send({ error: 'Trip or Signup not found' });
            }

            // 3. Manage Access Token (Generate if missing)
            let accessToken = signup.access_token;
            if (!accessToken) {
                accessToken = crypto.randomUUID();
                try {
                    await directus.request(updateItem('trip_signups', signupId, { 
                        access_token: accessToken 
                    }));
                    fastify.log.info(`[TRIP] Generated and saved access_token for signup ${signupId}`);
                } catch (updateErr: any) {
                    fastify.log.error(updateErr, `[TRIP] Failed to update access_token for signup ${signupId}. Check Directus permissions!`);
                }
            }

            // 4. Calculate Total Price
            const basePrice = Number(trip.base_price || 0);
            const crewDiscount = (signup.role === 'crew' ? Number(trip.crew_discount || 0) : 0);
            const activitiesPrice = (signupActivities || []).reduce((sum, sa) => {
                const price = Number(sa.trip_activity_id?.price || 0);
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
                if (!trip.allow_final_payments && signup.role !== 'admin' && !isConfirmedByUser) {
                    return reply.status(403).send({ error: 'Final payments are not yet enabled for this trip' });
                }
            }

            // 5. Case A: Admin just wants to send the enrichment mail
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

            // 6. Case B: User confirmed on frontend, create REAL Mollie payment
            if (amount <= 0) {
                return reply.status(400).send({ error: 'Calculated amount is zero or negative' });
            }

            const confirmationUrl = `${process.env.PUBLIC_URL}/reis/bevestiging?id=${signupId}&t=${accessToken}`;
            const mollie = getMollieClient();
            const payment = await mollie.payments.create({
                amount: { currency: 'EUR', value: amount.toFixed(2) },
                description,
                redirectUrl: confirmationUrl,
                webhookUrl: `${process.env.PUBLIC_URL}/api/finance/webhook/mollie`,
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
                    payment.id, amount, 'open', description, 'trip_signup',
                    signup.directus_relations || null, signup.email, signup.first_name || '', signup.last_name || '',
                    accessToken, signupId
                ]
            );

            return { success: true, checkoutUrl: payment._links?.checkout?.href };
        } catch (err: any) {
            fastify.log.error(err, '[TRIP] Error in payment flow');
            return reply.status(500).send({ error: 'Internal server error', details: err.message });
        }
    });
}
