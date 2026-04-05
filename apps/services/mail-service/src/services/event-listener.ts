import { Redis } from 'ioredis';
import { MailWorkerService } from './mail-worker.js';
import { PaymentSuccessEventSchema, ActivitySignupEventSchema } from '@salvemundi/validations';

export class EventListenerService {
    private static readonly STREAM_KEY = 'v7:events';
    private static readonly GROUP_NAME = 'mail-service-group';
    private static readonly CONSUMER_NAME = 'mail-consumer-1';
    private static shouldStop = false;

    static async start(redis: Redis) {
        console.log('[MailEventListener] Starting Redis Stream listener...');

        // 1. Ensure Consumer Group exists
        try {
            await redis.xgroup('CREATE', this.STREAM_KEY, this.GROUP_NAME, '0', 'MKSTREAM');
        } catch (err: any) {
            if (!err.message.includes('BUSYGROUP')) {
                console.error('[MailEventListener] Error creating consumer group:', err);
            }
        }

        // 2. Listener Loop
        while (!this.shouldStop) {
            try {
                // Read from group
                const response = (await redis.xreadgroup(
                    'GROUP', this.GROUP_NAME, this.CONSUMER_NAME,
                    'COUNT', 1, 'BLOCK', 5000,
                    'STREAMS', this.STREAM_KEY, '>'
                )) as any[];

                if (response && response.length > 0) {
                    for (const [stream, messages] of response) {
                        for (const [id, fields] of messages) {
                            // Convert flat fields array [f1, v1, f2, v2] to object
                            const data: any = {};
                            for (let i = 0; i < fields.length; i += 2) {
                                data[fields[i]] = fields[i + 1];
                            }
                            
                            await this.handleEvent(redis, { id, data });
                            // Acknowledge message
                            await redis.xack(this.STREAM_KEY, this.GROUP_NAME, id);
                        }
                    }
                }
            } catch (err: any) {
                console.error('[MailEventListener] Loop Error:', err.message);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    private static async handleEvent(redis: Redis, message: any) {
        try {
            const payload = JSON.parse(message.data.payload);
            console.log(`[MailEventListener] Received event: ${payload.event}`);

            if (payload.event === 'PAYMENT_SUCCESS') {
                const data = PaymentSuccessEventSchema.parse(payload);
                
                let eventName = 'Evenement';
                let templateId = 'welcome_payment';
                let mailData: any = { 
                    paymentId: data.paymentId, 
                    userId: data.userId,
                    registrationId: data.registrationId,
                    registrationType: data.registrationType,
                    eventName: eventName
                };

                const directusUrl = process.env.DIRECTUS_SERVICE_URL || process.env.DIRECTUS_URL!;
                const directusToken = process.env.DIRECTUS_STATIC_TOKEN!;
                
                // 1. Handle Membership (New vs Renewal)
                if ((data as any).isContribution || data.registrationType === 'membership') {
                    templateId = data.isNewMember ? 'welcome_payment' : 'membership_renewal';
                    try {
                        const userRes = await fetch(`${directusUrl}/users/${data.userId}?fields=first_name,membership_expiry`, {
                            headers: { 'Authorization': `Bearer ${directusToken}` }
                        });
                        const userData: any = await userRes.json();
                        mailData.firstName = userData?.data?.first_name || 'Lid';
                        mailData.expiryDate = userData?.data?.membership_expiry || 'Onbekend';
                        mailData.amount = '20.00'; 
                    } catch (err) {
                        console.error('[MailEventListener] Failed to fetch user info for renewal:', err);
                    }
                } else {
                    // 2. Fetch Event/Trip details
                    try {
                        if (data.registrationType === 'trip_signup' && data.registrationId) {
                            const signupRes = await fetch(`${directusUrl}/items/trip_signups/${data.registrationId}?fields=trip_id,first_name`, {
                                headers: { 'Authorization': `Bearer ${directusToken}` }
                            });
                            const signupData: any = await signupRes.json();
                            const tripId = signupData?.data?.trip_id;
                            mailData.firstName = signupData?.data?.first_name;
                            
                            if (tripId) {
                                const tripRes = await fetch(`${directusUrl}/items/trips/${tripId}?fields=name`, {
                                    headers: { 'Authorization': `Bearer ${directusToken}` }
                                });
                                const tripData: any = await tripRes.json();
                                mailData.eventName = tripData?.data?.name || 'Reis';
                            }
                        } else if (data.registrationType === 'pub_crawl_signup') {
                            mailData.eventName = 'Kroegentocht';
                        } else if (data.registrationType === 'event_signup' && data.registrationId) {
                            const signupRes = await fetch(`${directusUrl}/items/event_signups/${data.registrationId}?fields=event_id,first_name`, {
                                headers: { 'Authorization': `Bearer ${directusToken}` }
                            });
                            const signupData: any = await signupRes.json();
                            const eventId = signupData?.data?.event_id;
                            mailData.firstName = signupData?.data?.first_name;
                            
                            if (eventId) {
                                const eventRes = await fetch(`${directusUrl}/items/events/${eventId}?fields=name`, {
                                    headers: { 'Authorization': `Bearer ${directusToken}` }
                                });
                                const eventData: any = await eventRes.json();
                                mailData.eventName = eventData?.data?.name || 'Evenement';
                            }
                        }
                    } catch (fetchErr) {
                        console.error('[MailEventListener] Failed to fetch event name:', fetchErr);
                    }
                }

                await MailWorkerService.queueMail(redis, data.email, templateId, mailData);
                console.log(`[MailEventListener] Queued ${templateId} for ${data.email} (${mailData.eventName})`);
            } else if (payload.event === 'ACTIVITY_SIGNUP_SUCCESS') {
                const data = ActivitySignupEventSchema.parse(payload);

                await MailWorkerService.queueMail(redis, data.email, 'event-ticket', {
                    name: data.name,
                    eventName: data.eventName,
                    eventDate: data.eventDate,
                    signupId: data.signupId
                });

                console.log(`[MailEventListener] Queued activity ticket mail for ${data.email}`);
            }
        } catch (err: any) {
            console.error('[MailEventListener] Error handling event:', err.message);
        }
    }

    static stop() {
        this.shouldStop = true;
    }
}

