import { Redis } from 'ioredis';
import { MailWorkerService } from './mail-worker.js';
import { PaymentSuccessEventSchema, ActivitySignupEventSchema } from '@salvemundi/validations';
import QRCode from 'qrcode';
import { query } from './db.js';

export class EventListenerService {
    private static readonly STREAM_KEY = 'v7:events';
    private static readonly GROUP_NAME = 'mail-service-group';
    private static readonly CONSUMER_NAME = 'mail-consumer-1';
    private static shouldStop = false;

    static async start(redis: Redis) {
        console.log('[MailEventListener] Starting Redis Stream listener...');

        try {
            await redis.xgroup('CREATE', this.STREAM_KEY, this.GROUP_NAME, '0', 'MKSTREAM');
        } catch (err: any) {
            if (!err.message.includes('BUSYGROUP')) {
                console.error('[MailEventListener] Error creating consumer group:', err);
            }
        }

        while (!this.shouldStop) {
            try {
                const response = (await redis.xreadgroup(
                    'GROUP', this.GROUP_NAME, this.CONSUMER_NAME,
                    'COUNT', 1, 'BLOCK', 5000,
                    'STREAMS', this.STREAM_KEY, '>'
                )) as any[];

                if (response && response.length > 0) {
                    for (const [stream, messages] of response) {
                        for (const [id, fields] of messages) {
                            const data: any = {};
                            for (let i = 0; i < fields.length; i += 2) {
                                data[fields[i]] = fields[i + 1];
                            }

                            await this.handleEvent(redis, { id, data });
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

    /**
     * Fetches tickets for a pub crawl signup directly from the database.
     */
    private static async fetchPubCrawlTicketsDb(
        signupId: string | number,
        expectedCount: number,
        maxAttempts = 5,
        delayMs = 1000
    ): Promise<any[]> {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const res = await query(
                    `SELECT id, name, initial, qr_token FROM pub_crawl_tickets WHERE signup_id = $1`,
                    [signupId]
                );
                const tickets = res.rows || [];

                if (tickets.length >= expectedCount) {
                    return tickets;
                }
            } catch (err) {
                console.error(`[MailEventListener] SQL ticket fetch attempt ${attempt} failed:`, err);
            }

            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
        return [];
    }

    /**
     * Checks if a Directus user account exists for a given email.
     */
    private static async checkUserHasAccount(directusUrl: string, directusToken: string, email: string): Promise<boolean> {
        try {
            const res = await fetch(
                `${directusUrl}/users?filter[email][_eq]=${encodeURIComponent(email)}&fields=id&limit=1`,
                { headers: { 'Authorization': `Bearer ${directusToken}` } }
            );
            const json: any = await res.json();
            return (json?.data?.length ?? 0) > 0;
        } catch {
            return false;
        }
    }

    /**
     * Generates a base64 PNG data URL from a QR token string.
     */
    private static async generateQrDataUrl(token: string): Promise<string> {
        try {
            return await QRCode.toDataURL(token, {
                errorCorrectionLevel: 'M',
                width: 300,
                margin: 2,
                color: { dark: '#5e2b52', light: '#ffffff' }
            });
        } catch (err) {
            console.error('[MailEventListener] QR generation failed:', err);
            return '';
        }
    }

    private static async handleEvent(redis: Redis, message: any) {
        try {
            const payload = JSON.parse(message.data.payload);
            console.log(`[MailEventListener] Received event: ${payload.event}`);

            if (payload.event === 'PAYMENT_SUCCESS') {
                const data = PaymentSuccessEventSchema.parse(payload);

                const directusUrl = process.env.DIRECTUS_SERVICE_URL || process.env.DIRECTUS_URL!;
                const directusToken = process.env.DIRECTUS_STATIC_TOKEN!;

                let templateId = 'payment_confirmed';
                let mailData: any = {
                    paymentId: data.paymentId,
                    userId: data.userId,
                    registrationId: data.registrationId,
                    registrationType: data.registrationType,
                    eventName: 'Evenement',
                    firstName: data.firstName || 'Lid',
                    qrToken: data.qrToken,
                    accessToken: data.accessToken
                };

                // Check if user has an account
                mailData.hasAccount = data.userId ? true : (data.email ? await this.checkUserHasAccount(directusUrl, directusToken, data.email) : false);

                // Build confirmation URL if registrationId and accessToken are present
                const baseUrl = process.env.PUBLIC_URL || 'https://salvemundi.nl';
                if (data.registrationId && data.accessToken) {
                    const path = data.registrationType === 'membership' || (data as any).isContribution ? '/lidmaatschap/bevestiging' :
                                 data.registrationType === 'trip_signup' ? '/reis/bevestiging' :
                                 '/activiteiten/bevestiging';
                    
                    mailData.confirmationUrl = `${baseUrl}${path}?id=${data.registrationId}&t=${data.accessToken}`;
                }

                // Handle Membership (New vs Renewal)
                if ((data as any).isContribution || data.registrationType === 'membership') {
                    if (data.isNewMember || !data.userId) {
                        console.log(`[MailEventListener] Skipping welcome_payment for member ${data.email}. Handled by provisioning service or missing userId.`);
                        return;
                    }

                    templateId = 'membership_renewal';
                    try {
                        const userRes = await fetch(`${directusUrl}/users/${data.userId}?fields=first_name,membership_expiry`, {
                            headers: { 'Authorization': `Bearer ${directusToken}` }
                        });
                        const userData: any = await userRes.json();
                        mailData.firstName = userData?.data?.first_name || data.firstName || 'Lid';
                        mailData.expiryDate = userData?.data?.membership_expiry || 'Onbekend';
                        mailData.amount = '20.00';
                        
                        // Ensure confirmationUrl is also available for renewals
                        if (!mailData.confirmationUrl && data.paymentId) {
                            mailData.confirmationUrl = `${baseUrl}/lidmaatschap/bevestiging?transaction_id=${data.paymentId}&t=${data.accessToken || ''}`;
                        }
                    } catch (err) {
                        console.error('[MailEventListener] Failed to fetch user info for renewal:', err);
                    }
                } else if (data.registrationType === 'pub_crawl_signup' && data.registrationId) {
                    // Pub Crawl: send dedicated ticket mail with QR codes
                    templateId = 'pub_crawl_ticket';
                    try {
                        // Fetch signup details (name, amount_tickets, event name)
                        const signupRes = await fetch(
                            `${directusUrl}/items/pub_crawl_signups/${data.registrationId}?fields=name,email,amount_tickets,pub_crawl_event_id.name`,
                            { headers: { 'Authorization': `Bearer ${directusToken}` } }
                        );
                        const signupJson: any = await signupRes.json();
                        const signup = signupJson?.data;

                        const signupName = signup?.name || 'Deelnemer';
                        const firstName = signupName.split(' ')[0];
                        const eventName = signup?.pub_crawl_event_id?.name || 'Kroegentocht';
                        const amountTickets = signup?.amount_tickets || 1;

                        const rawTickets = await this.fetchPubCrawlTicketsDb(data.registrationId, amountTickets);

                        // Generate QR code data URLs for each ticket
                        const tickets = await Promise.all(rawTickets.map(async (t: any) => ({
                            ...t,
                            qrDataUrl: t.qr_token ? await this.generateQrDataUrl(t.qr_token) : ''
                        })));

                        // Check if this email belongs to a registered user
                        const hasAccount = data.email
                            ? await this.checkUserHasAccount(directusUrl, directusToken, data.email)
                            : false;

                        mailData = {
                            name: signupName,
                            firstName,
                            email: data.email,
                            paymentId: data.paymentId,
                            signupId: data.registrationId,
                            eventName,
                            tickets,
                            totalTickets: tickets.length,
                            hasAccount
                        };

                        console.log(`[MailEventListener] Queuing pub_crawl_ticket mail — ${tickets.length} tickets, hasAccount=${hasAccount}`);
                    } catch (err) {
                        console.error('[MailEventListener] Failed to build pub crawl ticket mail:', err);
                        // Fall back to welcome_payment so the user at least gets something
                        templateId = 'welcome_payment';
                        mailData.eventName = 'Kroegentocht';
                    }
                } else {
                    // Trip or generic event
                    try {
                        if (data.registrationType === 'trip_signup' && data.registrationId) {
                            templateId = 'trip-signup';
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

                            // If qrToken is missing from event and it's an event_signup, try to fetch it
                            if (!mailData.qrToken && data.registrationId) {
                                try {
                                    const qrRes = await fetch(`${directusUrl}/items/event_signups/${data.registrationId}?fields=qr_token`, {
                                        headers: { 'Authorization': `Bearer ${directusToken}` }
                                    });
                                    const qrJson: any = await qrRes.json();
                                    mailData.qrToken = qrJson?.data?.qr_token;
                                } catch (qrErr) {
                                    console.error('[MailEventListener] Failed to fetch qr_token:', qrErr);
                                }
                            }
                        }
                    } catch (fetchErr) {
                        console.error('[MailEventListener] Failed to fetch event name:', fetchErr);
                    }
                }

                await MailWorkerService.queueMail(redis, data.email, templateId, mailData);
                console.log(`[MailEventListener] Queued ${templateId} for ${data.email}`);

            } else if (payload.event === 'ACTIVITY_SIGNUP_SUCCESS') {
                const data = ActivitySignupEventSchema.parse(payload);
                
                const hasAccount = await this.checkUserHasAccount(
                    process.env.DIRECTUS_SERVICE_URL || process.env.DIRECTUS_URL!,
                    process.env.DIRECTUS_STATIC_TOKEN!,
                    data.email
                );

                let confirmationUrl = '';
                if (data.signupId && data.accessToken) {
                    const baseUrl = process.env.PUBLIC_URL || 'https://salvemundi.nl';
                    confirmationUrl = `${baseUrl}/activiteiten/bevestiging?id=${data.signupId}&t=${data.accessToken}`;
                }

                await MailWorkerService.queueMail(redis, data.email, 'event-ticket', {
                    name: data.name,
                    eventName: data.eventName,
                    eventDate: data.eventDate,
                    signupId: data.signupId,
                    qrToken: data.qrToken,
                    hasAccount,
                    confirmationUrl
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
