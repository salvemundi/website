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

const getDirectusUrl = () =>
    process.env.INTERNAL_DIRECTUS_URL;

const getDirectusHeaders = (): HeadersInit | null => {
    const token = process.env.DIRECTUS_STATIC_TOKEN;
    if (!token) {
        console.warn('[profiel.actions] DIRECTUS_STATIC_TOKEN missing.');
        return null;
    }
    return {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
    };
};

// ─── Event Signups ────────────────────────────────────────────────────────────

export async function getUserEventSignups(): Promise<EventSignup[]> {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;

    if (!user?.id) return [];

    const directusUrl = getDirectusUrl();
    const headersInit = getDirectusHeaders();
    if (!headersInit) return [];

    // Column names in V7 database: 'directus_relations' refers to the User ID.
    const url = `${directusUrl}/items/event_signups?filter[directus_relations][_eq]=${user.id}&fields=id,created_at,event_id.id,event_id.name,event_id.event_date,event_id.description,event_id.image,event_id.contact&sort=-created_at`;

    try {
        const res = await fetch(url, {
            headers: headersInit,
            next: { revalidate: 0 } // Signups should be always fresh
        });

        if (!res.ok) {
            console.error('[profiel.actions#getUserEventSignups] Directus error:', res.statusText);
            await res.text();
            return [];
        }

        const json = await res.json();
        const parsed = eventSignupSchema.array().safeParse(json?.data ?? []);

        if (!parsed.success) {
            console.error('[profiel.actions#getUserEventSignups] Validation failed:', parsed.error.flatten());
            return [];
        }

        return parsed.data;
    } catch (err) {
        console.error('[profiel.actions#getUserEventSignups] Fetch failed:', err);
        return [];
    }
}

// ─── Transactions ────────────────────────────────────────────────────────────

export async function getUserTransactions(): Promise<Transaction[]> {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;

    if (!user?.id) return [];

    const directusUrl = getDirectusUrl();
    const headersInit = getDirectusHeaders();
    if (!headersInit) return [];

    // Column names in V7 database: 'user_id' can be empty for legacy/migrated records.
    // We filter on both user_id and email (linked to the session user) for completeness.
    const url = `${directusUrl}/items/transactions?filter[_or][0][user_id][_eq]=${user.id}&filter[_or][1][email][_eq]=${encodeURIComponent(user.email)}&sort=-created_at&limit=-1`;

    try {
        const res = await fetch(url, {
            headers: headersInit,
            next: { revalidate: 0 }
        });

        if (!res.ok) {
            console.error('[profiel.actions#getUserTransactions] Directus error:', res.statusText);
            await res.text();
            return [];
        }

        const json = await res.json();
        const parsed = transactionSchema.array().safeParse(json?.data ?? []);

        if (!parsed.success) {
            console.error('[profiel.actions#getUserTransactions] Validation failed:', parsed.error.flatten());
            return [];
        }

        return parsed.data;
    } catch (err) {
        console.error('[profiel.actions#getUserTransactions] Fetch failed:', err);
        return [];
    }
}

// ─── WhatsApp Groups ─────────────────────────────────────────────────────────

export async function getWhatsAppGroups(): Promise<WhatsAppGroup[]> {
    const directusUrl = getDirectusUrl();
    const headersInit = getDirectusHeaders();
    if (!headersInit) return [];

    const url = `${directusUrl}/items/whatsapp_groups?filter[is_active][_eq]=true&sort=id`;

    try {
        const res = await fetch(url, {
            headers: headersInit,
            next: { tags: ['whatsapp_groups'], revalidate: 300 }
        });

        if (!res.ok) {
            console.error('[profiel.actions#getWhatsAppGroups] Directus error:', res.statusText);
            await res.text();
            return [];
        }

        const json = await res.json();
        const parsed = whatsappGroupSchema.array().safeParse(json?.data ?? []);

        if (!parsed.success) {
            console.error('[profiel.actions#getWhatsAppGroups] Validation failed:', parsed.error.flatten());
            return [];
        }

        return parsed.data;
    } catch (err) {
        console.error('[profiel.actions#getWhatsAppGroups] Fetch failed:', err);
        return [];
    }
}

