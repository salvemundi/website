'use server';

import { serverDirectusFetch, CACHE_PRESETS, COLLECTION_TAGS } from '@/shared/lib/server-directus';
import { COLLECTIONS, FIELDS } from '@/shared/lib/constants/collections';

export interface PubCrawlEvent {
    id: number;
    name: string;
    email: string;
    date: string;
    description: string;
    image: string;
    created_at: string;
    association?: string;
}

export interface PubCrawlSignupData {
    name: string;
    email: string;
    association: string;
    amount_tickets: number;
    pub_crawl_event_id: number;
    name_initials: string; // JSON string
    payment_status: string;
}

export async function getPubCrawlEventsAction() {
    try {
        const query = new URLSearchParams({
            fields: 'id,name,email,date,description,image,created_at,association',
            sort: '-date'
        }).toString();

        return await serverDirectusFetch<PubCrawlEvent[]>(`/items/pub_crawl_events?${query}`, {
            tags: ['pub_crawl_events'],
            ...CACHE_PRESETS.FREQUENT
        });
    } catch (error) {
        console.error('[Action] Failed to fetch pub crawl events:', error);
        return [];
    }
}

export async function getKroegentochtSettingsAction() {
    try {
        const query = new URLSearchParams({
            filter: JSON.stringify({ page: { _eq: 'kroegentocht' } }),
            limit: '1'
        }).toString();

        const results = await serverDirectusFetch<any[]>(`/items/site_settings?${query}`, {
            tags: [COLLECTION_TAGS.SITE_SETTINGS],
            ...CACHE_PRESETS.STATIC
        });

        return results[0] || null;
    } catch (error) {
        console.error('[Action] Failed to fetch kroegentocht settings:', error);
        return null; // Fail gracefully
    }
}

export async function checkExistingTicketsAction(email: string, eventId: number) {
    if (!email || !eventId) return 0;

    try {
        const query = new URLSearchParams({
            filter: JSON.stringify({
                [FIELDS.SIGNUPS.EMAIL]: { _eq: email },
                [FIELDS.SIGNUPS.PUB_CRAWL_EVENT_ID]: { _eq: eventId },
                [FIELDS.SIGNUPS.PAYMENT_STATUS]: { _eq: 'paid' }
            }),
            fields: FIELDS.SIGNUPS.AMOUNT_TICKETS
        }).toString();

        const signups = await serverDirectusFetch<any[]>(`/items/${COLLECTIONS.PUB_CRAWL_SIGNUPS}?${query}`, {
            revalidate: 0 // Always fetch fresh data for validation
        });

        return signups?.reduce((sum, s) => sum + (s[FIELDS.SIGNUPS.AMOUNT_TICKETS] || 0), 0) || 0;
    } catch (error) {
        console.error('[Action] Failed to check existing tickets:', error);
        return 0; // Assume 0 on error so we don't block, but backend create will likely fail if strict
    }
}

export async function createPubCrawlSignupAction(data: PubCrawlSignupData) {
    try {
        // 1. Validate constraints server-side
        const existingCount = await checkExistingTicketsAction(data.email, data.pub_crawl_event_id);
        const newTotal = existingCount + data.amount_tickets;

        if (newTotal > 10) {
            return {
                success: false,
                error: `Je hebt al ${existingCount} tickets. Het maximum is 10.`
            };
        }

        // 2. Create Signup
        const result = await serverDirectusFetch<any>(`/items/${COLLECTIONS.PUB_CRAWL_SIGNUPS}`, {
            method: 'POST',
            body: JSON.stringify(data),
            revalidate: 0
        });

        return { success: true, signup: result };
    } catch (error: any) {
        console.error('[Action] Failed to create pub crawl signup:', error);
        return { success: false, error: 'Kon inschrijving niet aanmaken.' };
    }
}

export async function getMyPubCrawlTicketsAction(email: string) {
    if (!email) return [];

    try {
        const query = new URLSearchParams({
            filter: JSON.stringify({
                [FIELDS.TICKETS.SIGNUP_ID]: {
                    [FIELDS.SIGNUPS.EMAIL]: { _eq: email },
                    [FIELDS.SIGNUPS.PAYMENT_STATUS]: { _eq: 'paid' }
                }
            }),
            fields: `*,${FIELDS.TICKETS.SIGNUP_ID}.${FIELDS.SIGNUPS.PUB_CRAWL_EVENT_ID}.name`,
            sort: '-created_at'
        }).toString();

        return await serverDirectusFetch<any[]>(`/items/${COLLECTIONS.PUB_CRAWL_TICKETS}?${query}`, {
            revalidate: 0
        });
    } catch (error) {
        console.error('[Action] Failed to fetch member pub crawl tickets:', error);
        return [];
    }
}
