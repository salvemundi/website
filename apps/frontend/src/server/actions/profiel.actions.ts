'use server';

import { 
    type Transaction,
    type WhatsAppGroup,
    type EventSignup,
    EVENT_SIGNUP_FIELDS,
    TRANSACTION_FIELDS,
    WHATSAPP_GROUP_FIELDS,
    eventSignupSchema,
    transactionSchema,
    whatsappGroupSchema
} from '@salvemundi/validations';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';

import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';


export async function getUserEventSignups(overrideUserId?: string): Promise<EventSignup[]> {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;

    const targetUserId = overrideUserId || user?.id;
    if (!targetUserId) return [];

    try {
        const client = getSystemDirectus();
        
        // We now fetch signups via transactions that are linked to this user
        // This is more reliable than directus_relations since it directly links to the payment record
        const res = await client.request(readItems('transactions' as any, {
            filter: { 
                user_id: { _eq: targetUserId },
                registration: { _neq: null }
            },
            fields: [
                { 
                    registration: [
                        ...EVENT_SIGNUP_FIELDS, 
                        { event_id: ['id', 'name', 'event_date', 'description', 'image', 'contact'] }
                    ] 
                }
            ] as any,
            sort: ['-created_at'],
            limit: -1
        }));

        // Extract unique registrations from transactions
        const registrationsMap = new Map<number, any>();
        (res as any[]).forEach(tx => {
            if (tx.registration && tx.registration.id) {
                registrationsMap.set(tx.registration.id, tx.registration);
            }
        });
        
        const registrations = Array.from(registrationsMap.values());
        const parsed = eventSignupSchema.array().safeParse(registrations);

        if (!parsed.success) {
            console.error('[profiel.actions#getUserEventSignups] Validation failed:', parsed.error.flatten());
            return [];
        }

        return parsed.data;
    } catch (err) {
        console.error('[profiel.actions#getUserEventSignups] failed:', err);
        return [];
    }
}


export async function getUserPubCrawlSignups(overrideUserId?: string): Promise<any[]> {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;

    const targetUserId = overrideUserId || user?.id;
    if (!targetUserId) return [];

    try {
        const client = getSystemDirectus();
        
        // Fetch Pub Crawl signups via transactions
        const res = await client.request(readItems('transactions' as any, {
            filter: { 
                user_id: { _eq: targetUserId },
                pub_crawl_signup: { _neq: null }
            },
            fields: [
                { 
                    pub_crawl_signup: [
                        'id', 'name', 'email', 'amount_tickets', 'payment_status', 'created_at',
                        { pub_crawl_event_id: ['id', 'name', 'date', 'description', 'image'] }
                    ] 
                }
            ] as any,
            sort: ['-created_at'],
            limit: -1
        }));

        // Extract unique signups from transactions
        const signupsMap = new Map<number, any>();
        (res as any[]).forEach(tx => {
            if (tx.pub_crawl_signup && tx.pub_crawl_signup.id) {
                signupsMap.set(tx.pub_crawl_signup.id, tx.pub_crawl_signup);
            }
        });
        
        return Array.from(signupsMap.values());
    } catch (err) {
        console.error('[profiel.actions#getUserPubCrawlSignups] failed:', err);
        return [];
    }
}


export async function getUserTransactions(overrideUserId?: string): Promise<Transaction[]> {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;

    const targetUserId = overrideUserId || user?.id;
    if (!targetUserId) return [];

    try {
        const client = getSystemDirectus();
        const res = await client.request(readItems('transactions' as any, {
            filter: {
                _or: [
                    { user_id: { _eq: targetUserId } },
                    { email: { _eq: user?.email } }
                ]
            },
            fields: [...TRANSACTION_FIELDS],
            sort: ['-created_at'],
            limit: -1
        }));

        const parsed = transactionSchema.array().safeParse(res);

        if (!parsed.success) {
            console.error('[profiel.actions#getUserTransactions] Validation failed:', parsed.error.flatten());
            return [];
        }

        return parsed.data;
    } catch (err) {
        console.error('[profiel.actions#getUserTransactions] failed:', err);
        return [];
    }
}


export async function getWhatsAppGroups(): Promise<WhatsAppGroup[]> {
    try {
        const res = await getSystemDirectus().request(readItems('whatsapp_groups' as any, {
            filter: { is_active: { _eq: true } },
            fields: [...WHATSAPP_GROUP_FIELDS],
            sort: ['id'],
            limit: -1
        }));

        const parsed = whatsappGroupSchema.array().safeParse(res);

        if (!parsed.success) {
            console.error('[profiel.actions#getWhatsAppGroups] Validation failed:', parsed.error.flatten());
            return [];
        }

        return parsed.data;
    } catch (err) {
        console.error('[profiel.actions#getWhatsAppGroups] failed:', err);
        return [];
    }
}

