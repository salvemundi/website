import { Redis } from 'ioredis';
import { MailWorkerService } from './mail-worker.js';
import { PaymentSuccessEventSchema, ActivitySignupEventSchema } from '@salvemundi/validations';
import QRCode from 'qrcode';
import { query } from './db.js';

/**
 * EventHandlers: Beheert de business logica voor verschillende soorten events 
 * en bereidt de gegevens voor de mail-service voor.
 */
export class EventHandlers {
    /**
     * Verwerkt een succesvolle betaling en bepaalt welk mail-sjabloon verzonden moet worden.
     */
    static async handlePaymentSuccess(redis: Redis, rawPayload: any) {
        const data = PaymentSuccessEventSchema.parse(rawPayload);
        const directusUrl = process.env.DIRECTUS_SERVICE_URL || process.env.DIRECTUS_URL!;
        const directusToken = process.env.DIRECTUS_STATIC_TOKEN!;

        let templateId = 'payment_confirmed';
        let mailData: Record<string, unknown> = {
            paymentId: data.paymentId,
            userId: data.userId,
            registrationId: data.registrationId,
            registrationType: data.registrationType,
            eventName: 'Evenement',
            firstName: data.firstName || 'Lid',
            qrToken: data.qrToken,
            accessToken: data.accessToken
        };

        // Check account
        mailData.hasAccount = data.userId ? true : (data.email ? await this.checkUserHasAccount(directusUrl, directusToken, data.email) : false);

        // Confirmation URL
        const baseUrl = process.env.PUBLIC_URL || 'https://salvemundi.nl';
        if (data.registrationId && data.accessToken) {
            const path = data.registrationType === 'membership' || (data as any).isContribution ? '/lidmaatschap/bevestiging' :
                         data.registrationType === 'trip_signup' ? '/reis/bevestiging' :
                         '/activiteiten/bevestiging';
            mailData.confirmationUrl = `${baseUrl}${path}?id=${data.registrationId}&t=${data.accessToken}`;
        }

        // Specific Flows
        if ((data as any).isContribution || data.registrationType === 'membership') {
            if (data.isNewMember || !data.userId) return; // Handled elsewhere
            templateId = 'membership_renewal';
            await this.enrichMembershipRenewal(mailData, data, directusUrl, directusToken, baseUrl);
        } else if (data.registrationType === 'pub_crawl_signup' && data.registrationId) {
            templateId = 'pub_crawl_ticket';
            const pubCrawlData = await this.preparePubCrawlTickets(data, directusUrl, directusToken);
            if (!pubCrawlData) {
                templateId = 'welcome_payment';
                mailData.eventName = 'Kroegentocht';
            } else {
                mailData = { ...mailData, ...pubCrawlData };
            }
        } else {
            await this.enrichGenericEvent(mailData, data, directusUrl, directusToken);
        }

        await MailWorkerService.queueMail(redis, data.email, templateId, mailData);
    }

    /**
     * Verwerkt een succesvolle activiteit-inschrijving.
     */
    static async handleActivitySignup(redis: Redis, rawPayload: any) {
        const data = ActivitySignupEventSchema.parse(rawPayload);
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
    }

    // --- Helpers ---

    private static async checkUserHasAccount(url: string, token: string, email: string): Promise<boolean> {
        try {
            const res = await fetch(`${url}/users?filter[email][_eq]=${encodeURIComponent(email)}&fields=id&limit=1`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json() as { data: unknown[] };
            return (json?.data?.length ?? 0) > 0;
        } catch { return false; }
    }

    private static async enrichMembershipRenewal(mailData: any, data: any, url: string, token: string, baseUrl: string) {
        try {
            const res = await fetch(`${url}/users/${data.userId}?fields=first_name,membership_expiry`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json() as { data: { first_name?: string; membership_expiry?: string } };
            mailData.firstName = json?.data?.first_name || data.firstName || 'Lid';
            mailData.expiryDate = json?.data?.membership_expiry || 'Onbekend';
            mailData.amount = '20.00';
            if (!mailData.confirmationUrl && data.paymentId) {
                mailData.confirmationUrl = `${baseUrl}/lidmaatschap/bevestiging?transaction_id=${data.paymentId}&t=${data.accessToken || ''}`;
            }
        } catch {}
    }

    private static async preparePubCrawlTickets(data: any, url: string, token: string) {
        try {
            const res = await fetch(`${url}/items/pub_crawl_signups/${data.registrationId}?fields=name,email,amount_tickets,pub_crawl_event_id.name`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json() as { data: { name?: string; email?: string; amount_tickets?: number; pub_crawl_event_id?: { name?: string } } };
            const signup = json?.data;
            const tickets = await this.fetchPubCrawlTicketsDb(data.registrationId, signup?.amount_tickets || 1);

            return {
                name: signup?.name || 'Deelnemer',
                firstName: (signup?.name || 'Deelnemer').split(' ')[0],
                email: data.email,
                paymentId: data.paymentId,
                signupId: data.registrationId,
                eventName: signup?.pub_crawl_event_id?.name || 'Kroegentocht',
                tickets: await Promise.all(tickets.map(async (t: any) => ({
                    ...t,
                    qrDataUrl: t.qr_token ? await this.generateQrDataUrl(String(t.qr_token)) : ''
                }))),
                totalTickets: tickets.length,
                hasAccount: await this.checkUserHasAccount(url, token, data.email)
            };
        } catch { return null; }
    }

    private static async enrichGenericEvent(mailData: any, data: any, url: string, token: string) {
        try {
            const collection = data.registrationType === 'trip_signup' ? 'trip_signups' : 'event_signups';
            const fields = data.registrationType === 'trip_signup' ? 'trip_id,first_name' : 'event_id,first_name,qr_token';
            
            const signupRes = await fetch(`${url}/items/${collection}/${data.registrationId}?fields=${fields}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const signup = (await signupRes.json() as any)?.data;
            mailData.firstName = signup?.first_name || mailData.firstName;
            if (signup?.qr_token) mailData.qrToken = signup.qr_token;

            const eventId = signup?.trip_id || signup?.event_id;
            if (eventId) {
                const eventCollection = data.registrationType === 'trip_signup' ? 'trips' : 'events';
                const eventRes = await fetch(`${url}/items/${eventCollection}/${eventId}?fields=name`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                mailData.eventName = (await eventRes.json() as any)?.data?.name || mailData.eventName;
            }
        } catch {}
    }

    private static async fetchPubCrawlTicketsDb(signupId: string | number, expectedCount: number) {
        for (let i = 0; i < 5; i++) {
            const res = await query(`SELECT id, name, initial, qr_token FROM pub_crawl_tickets WHERE signup_id = $1`, [signupId]);
            if ((res.rows || []).length >= expectedCount) return res.rows;
            await new Promise(r => setTimeout(r, 1000));
        }
        return [];
    }

    private static async generateQrDataUrl(token: string): Promise<string> {
        try {
            return await QRCode.toDataURL(token, {
                errorCorrectionLevel: 'M', width: 300, margin: 2,
                color: { dark: '#5e2b52', light: '#ffffff' }
            });
        } catch { return ''; }
    }
}
