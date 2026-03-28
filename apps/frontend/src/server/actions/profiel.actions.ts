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
        const res = await client.request(readItems('event_signups' as any, {
            filter: { directus_relations: { _eq: targetUserId } },
            fields: [
                ...EVENT_SIGNUP_FIELDS, 
                { event_id: ['id', 'name', 'event_date', 'description', 'image', 'contact'] }
            ] as any,
            sort: ['-created_at'],
            limit: -1
        }));

        const parsed = eventSignupSchema.array().safeParse(res);

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

