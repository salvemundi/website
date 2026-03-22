'use server';

import { 
    whatsappGroupSchema, 
    transactionSchema, 
    eventSignupSchema,
    type WhatsAppGroup,
    type Transaction,
    type EventSignup
} from '@salvemundi/validations';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';

import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';

// ─── Event Signups ────────────────────────────────────────────────────────────

export async function getUserEventSignups(): Promise<EventSignup[]> {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;

    if (!user?.id) return [];

    try {
        const res = await getSystemDirectus().request(readItems('event_signups' as any, {
            filter: { directus_relations: { _eq: user.id } },
            fields: ['id', 'created_at', { event_id: ['id', 'name', 'event_date', 'description', 'image', 'contact'] }],
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

// ─── Transactions ────────────────────────────────────────────────────────────

export async function getUserTransactions(): Promise<Transaction[]> {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;

    if (!user?.id) return [];

    try {
        const res = await getSystemDirectus().request(readItems('transactions' as any, {
            filter: {
                _or: [
                    { user_id: { _eq: user.id } },
                    { email: { _eq: user.email } }
                ]
            },
            fields: ['id', 'user_id', 'email', 'amount', 'currency', 'payment_status', 'description', 'created_at'],
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

// ─── WhatsApp Groups ─────────────────────────────────────────────────────────

export async function getWhatsAppGroups(): Promise<WhatsAppGroup[]> {
    try {
        const res = await getSystemDirectus().request(readItems('whatsapp_groups' as any, {
            filter: { is_active: { _eq: true } },
            fields: ['id', 'name', 'link', 'is_active'],
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

