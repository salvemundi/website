import { safeConsoleError } from '../utils/logger.js';
import { type Redis } from 'ioredis';
import { MailWorkerService } from './mail-worker.js';
import { PaymentSuccessEventSchema, ActivitySignupEventSchema } from '@salvemundi/validations';
import QRCode from 'qrcode';
import { db } from './db.js';
import { z } from 'zod';

interface LocalPaymentSuccessEvent {
    userId?: string | null;
    paymentId: string;
    email: string;
    registrationId?: string | number | null;
    registrationType?: 'event_signup' | 'pub_crawl_signup' | 'trip_signup' | 'membership';
    isContribution?: boolean;
    isNewMember?: boolean;
    qrToken?: string;
    accessToken?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
}

interface LocalActivitySignupEvent {
    email: string;
    name: string;
    eventName: string;
    eventDate: string;
    signupId: string | number;
    qrToken?: string;
    accessToken?: string;
}

const pubCrawlWhatsAppUrlSchema = z.object({
    whatsapp_community_url: z.string().url().nullable().optional()
});

export class EventHandlers {
    private static getDirectusConfig() {
        const url = process.env.DIRECTUS_SERVICE_URL || process.env.DIRECTUS_URL || '';
        const token = process.env.DIRECTUS_STATIC_TOKEN || '';
        return { url, token };
    }

    static async handlePaymentSuccess(redis: Redis, rawPayload: unknown) {
        const data = PaymentSuccessEventSchema.parse(rawPayload) as unknown as LocalPaymentSuccessEvent;
        const { url, token } = this.getDirectusConfig();

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

        mailData.hasAccount = data.userId ? true : (data.email ? await this.checkUserHasAccount(url, token, data.email) : false);

        const baseUrl = process.env.PUBLIC_URL || 'https://salvemundi.nl';
        if (data.registrationId && data.accessToken) {
            const path = data.registrationType === 'membership' || data.isContribution ? '/lidmaatschap/bevestiging' :
                data.registrationType === 'trip_signup' ? '/reis/bevestiging' :
                    '/activiteiten/bevestiging';
            mailData.confirmationUrl = `${baseUrl}${path}?id=${data.registrationId}&t=${data.accessToken}`;
        }

        if (data.isContribution || data.registrationType === 'membership') {
            if (data.isNewMember || !data.userId) return;
            templateId = 'membership_renewal';
            await this.enrichMembershipRenewal(mailData, data, url, token, baseUrl);
        } else if (data.registrationType === 'pub_crawl_signup' && data.registrationId) {
            templateId = 'pub_crawl_ticket';
            const pubCrawlData = await this.preparePubCrawlTickets(data, url, token);
            if (!pubCrawlData) {
                templateId = 'payment_confirmed';
                mailData.eventName = 'Kroegentocht';
                mailData.registrationType = 'pub_crawl_signup';
            } else {
                mailData = { ...mailData, ...pubCrawlData };
            }
        } else {
            await this.enrichGenericEvent(mailData, data, url, token);
        }

        await MailWorkerService.queueMail(redis, data.email, templateId, mailData);
    }

    static async handleActivitySignup(redis: Redis, rawPayload: unknown) {
        const data = ActivitySignupEventSchema.parse(rawPayload) as unknown as LocalActivitySignupEvent;
        const { url, token } = this.getDirectusConfig();
        const hasAccount = await this.checkUserHasAccount(url, token, data.email);

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

    private static async checkUserHasAccount(url: string, token: string, email: string): Promise<boolean> {
        try {
            const res = await fetch(`${url}/users?filter[email][_eq]=${encodeURIComponent(email)}&fields=id&limit=1`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json() as { data?: unknown[] };
            return (json.data?.length ?? 0) > 0;
        } catch (error) {
            safeConsoleError('[EventHandlers][checkUserHasAccount]', error);
            return false;
        }
    }

    private static async enrichMembershipRenewal(mailData: Record<string, unknown>, data: LocalPaymentSuccessEvent, url: string, token: string, baseUrl: string) {
        try {
            const res = await fetch(`${url}/users/${data.userId}?fields=first_name,membership_expiry`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json() as { data?: { first_name?: string; membership_expiry?: string } };
            mailData.firstName = json.data?.first_name || data.firstName || 'Lid';
            mailData.expiryDate = json.data?.membership_expiry || 'Onbekend';
            mailData.amount = '20.00';
            if (!mailData.confirmationUrl && data.paymentId) {
                mailData.confirmationUrl = `${baseUrl}/lidmaatschap/bevestiging?transaction_id=${data.paymentId}&t=${data.accessToken || ''}`;
            }
        } catch (error) {
            safeConsoleError('[EventHandlers][enrichMembershipRenewal]', error);
        }
    }

    private static async preparePubCrawlTickets(data: LocalPaymentSuccessEvent, url: string, token: string) {
        try {
            if (!data.registrationId) return null;
            const res = await fetch(`${url}/items/pub_crawl_signups/${data.registrationId}?fields=name,email,amount_tickets,pub_crawl_event_id.name`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json() as { data?: { name?: string; email?: string; amount_tickets?: number; pub_crawl_event_id?: { name?: string } } };
            const signup = json.data;
            const tickets = await this.fetchPubCrawlTicketsDb(data.registrationId, signup?.amount_tickets || 1);

            const whatsappCommunityUrl = await this.getPubCrawlWhatsAppLink(Number(data.registrationId));

            return {
                name: signup?.name || 'Deelnemer',
                firstName: (signup?.name || 'Deelnemer').split(' ')[0],
                email: data.email,
                paymentId: data.paymentId,
                signupId: data.registrationId,
                eventName: signup?.pub_crawl_event_id?.name || 'Kroegentocht',
                whatsappCommunityUrl,
                tickets: await Promise.all(tickets.map(async (t) => ({
                    ...t,
                    qrDataUrl: t.qr_token ? await this.generateQrDataUrl(String(t.qr_token)) : ''
                }))),
                totalTickets: tickets.length,
                hasAccount: await this.checkUserHasAccount(url, token, data.email)
            };
        } catch (error) {
            safeConsoleError('[EventHandlers][preparePubCrawlTickets]', error);
            return null;
        }
    }

    public static async getPubCrawlWhatsAppLink(signupId: number): Promise<string | null> {
        try {
            const data = await db
                .selectFrom('pub_crawl_signups as s')
                .innerJoin('pub_crawl_events as e', 's.pub_crawl_event_id', 'e.id')
                .select('e.whatsapp_community_url')
                .where('s.id', '=', signupId)
                .executeTakeFirst();

            if (!data) return null;

            const validated = pubCrawlWhatsAppUrlSchema.parse(data);
            return validated.whatsapp_community_url ?? null;
        } catch (error) {
            safeConsoleError('[EventHandlers][getPubCrawlWhatsAppLink]', error);
            throw error;
        }
    }

    private static async enrichGenericEvent(mailData: Record<string, unknown>, data: LocalPaymentSuccessEvent, url: string, token: string) {
        try {
            const collection = data.registrationType === 'trip_signup' ? 'trip_signups' : 'event_signups';
            const fields = data.registrationType === 'trip_signup' ? 'trip_id,first_name' : 'event_id,first_name,qr_token';

            const signupRes = await fetch(`${url}/items/${collection}/${data.registrationId}?fields=${fields}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await signupRes.json() as { data?: { first_name?: string; qr_token?: string; trip_id?: number | string; event_id?: number | string } };
            const signup = json.data;
            mailData.firstName = signup?.first_name || mailData.firstName;
            if (signup?.qr_token) mailData.qrToken = signup.qr_token;

            const eventId = signup?.trip_id || signup?.event_id;
            if (eventId) {
                const eventCollection = data.registrationType === 'trip_signup' ? 'trips' : 'events';
                const eventRes = await fetch(`${url}/items/${eventCollection}/${eventId}?fields=name`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const eventJson = await eventRes.json() as { data?: { name?: string } };
                mailData.eventName = eventJson.data?.name || mailData.eventName;
            }
        } catch (error) {
            safeConsoleError('[EventHandlers][enrichGenericEvent]', error);
        }
    }

    private static async fetchPubCrawlTicketsDb(signupId: string | number, expectedCount: number) {
        for (let i = 0; i < 5; i++) {
            const tickets = await db
                .selectFrom('pub_crawl_tickets')
                .select(['id', 'name', 'initial', 'qr_token'])
                .where('signup_id', '=', Number(signupId))
                .execute();
            if (tickets.length >= expectedCount) return tickets;
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
        } catch (error) {
            safeConsoleError('[EventHandlers][generateQrDataUrl]', error);
            return '';
        }
    }
}