'use server';

import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { revalidateTag } from 'next/cache';
import { 
    pubCrawlEventSchema, 
    pubCrawlSignupSchema, 
    type PubCrawlEvent, 
    type PubCrawlSignup 
} from '@salvemundi/validations';

import { getSystemDirectus, getUserDirectus } from "@/lib/directus";
import { 
    readItems, 
    readItem, 
    updateItem, 
    deleteItem, 
    createItem 
} from '@directus/sdk';

/**
 * Access check for Pub Crawl Admin
 */
async function requireKroegAdmin() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error('Niet ingelogd');

    const userRoles: string[] = (session.user as any).committees?.map((c: any) =>
        (c.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    ) ?? [];

    const hasAccess = userRoles.some(r => ['reiscommissie', 'reis', 'ictcommissie', 'ict', 'bestuur'].includes(r));
    if (!hasAccess) throw new Error('Geen toegang tot Kroegentocht beheer');

    return session;
}

// ── Events ──────────────────────────────────────────────────────────────────

export async function getPubCrawlEvents(): Promise<PubCrawlEvent[]> {
    await requireKroegAdmin();
    try {
        const items = await getSystemDirectus().request(readItems('pub_crawl_events', {
            sort: ['-date'],
            limit: 100,
            fields: ['id', 'name', 'date', 'price', 'max_tickets_per_person']
        }));
        return (items ?? []).map((e: any) => pubCrawlEventSchema.parse(e));
    } catch (e) {
        console.error('[AdminKroegentocht] Fetch events failed:', e);
        throw new Error('Kon events niet ophalen');
    }
}

export async function getPubCrawlEvent(id: string | number): Promise<PubCrawlEvent> {
    await requireKroegAdmin();
    try {
        const item = await getSystemDirectus().request(readItem('pub_crawl_events', id, {
            fields: ['id', 'name', 'date', 'price', 'max_tickets_per_person']
        }));
        return pubCrawlEventSchema.parse(item);
    } catch (e) {
        console.error('[AdminKroegentocht] Fetch event failed:', e);
        throw new Error('Kon event niet ophalen');
    }
}

export async function upsertPubCrawlEvent(data: Partial<PubCrawlEvent>) {
    const session = await requireKroegAdmin();
    const { id, ...payload } = data;
    
    try {
        const client = getUserDirectus(session.session.token);
        if (id) {
            await client.request(updateItem('pub_crawl_events', id, payload));
        } else {
            await client.request(createItem('pub_crawl_events', payload));
        }
        revalidateTag('kroegentocht-events', 'default');
        revalidateTag('kroegentocht-event', 'default');
        return { success: true };
    } catch (e) {
        console.error('[AdminKroegentocht] Upsert event failed:', e);
        throw new Error('Opslaan van event mislukt');
    }
}

// ── Signups ────────────────────────────────────────────────────────────────

export async function getPubCrawlSignups(eventId: number) {
    await requireKroegAdmin();
    try {
        const items = await getSystemDirectus().request(readItems('pub_crawl_signups', {
            filter: { pub_crawl_event_id: { _eq: eventId } },
            fields: [
                'id', 'pub_crawl_event_id', 'name', 'email', 'association', 
                'amount_tickets', 'name_initials', 'payment_status', 'approval_status', 
                'date_created',
                { tickets: ['id', 'name', 'initial', 'qr_token', 'checked_in'] }
            ] as any,
            limit: 1000,
            sort: ['-date_created'],
        }));

        return (items ?? []).map((s: any) => ({
            ...s,
            participants: s.tickets?.map((t: any) => ({ name: t.name, initial: t.initial })) ?? []
        }));
    } catch (e) {
        console.error('[AdminKroegentocht] Fetch signups failed:', e);
        throw new Error('Kon aanmeldingen niet ophalen');
    }
}

export async function getPubCrawlSignup(id: number) {
    await requireKroegAdmin();
    try {
        const item = await getSystemDirectus().request(readItem('pub_crawl_signups', id, {
            fields: [
                'id', 'pub_crawl_event_id', 'name', 'email', 'association', 
                'amount_tickets', 'name_initials', 'payment_status', 'approval_status', 
                'date_created',
                { tickets: ['id', 'name', 'initial', 'qr_token', 'checked_in'] }
            ] as any
        }));
        return item;
    } catch (e) {
        console.error('[AdminKroegentocht] Fetch signup failed:', e);
        throw new Error('Kon aanmelding niet ophalen');
    }
}

export async function deletePubCrawlSignup(id: number, eventId: number) {
    const session = await requireKroegAdmin();
    try {
        await getUserDirectus(session.session.token).request(deleteItem('pub_crawl_signups', id));
        revalidateTag(`signups-${eventId}`, 'default');
        return { success: true };
    } catch (e) {
        console.error('[AdminKroegentocht] Delete signup failed:', e);
        throw new Error('Verwijderen mislukt');
    }
}

export async function updatePubCrawlSignup(id: number, eventId: number, data: any) {
    const session = await requireKroegAdmin();
    try {
        await getUserDirectus(session.session.token).request(updateItem('pub_crawl_signups', id, data));
        revalidateTag(`signups-${eventId}`, 'default');
        return { success: true };
    } catch (e) {
        console.error('[AdminKroegentocht] Update signup failed:', e);
        throw new Error('Bijwerken mislukt');
    }
}

// ── Settings ───────────────────────────────────────────────────────────────

export async function toggleKroegentochtVisibility(current: boolean) {
    const session = await requireKroegAdmin();
    const key = 'kroegentocht';
    const payload = { id: key, show: !current };
    
    try {
        // Try update first
        await getUserDirectus(session.session.token).request(updateItem('site_settings', key, payload));
    } catch (e) {
        // If update fails, try create
        try {
            await getUserDirectus(session.session.token).request(createItem('site_settings', payload));
        } catch (postErr) {
            console.error('[AdminKroegentocht] Toggle visibility failed:', postErr);
            throw new Error('Bijwerken mislukt');
        }
    }

    revalidateTag('site_settings', 'default');
    return { success: true, show: !current };
}

export async function getKroegentochtSettings() {
    await requireKroegAdmin();
    try {
        const item = await getSystemDirectus().request(readItem('site_settings', 'kroegentocht'));
        return item;
    } catch (e) {
        console.error('[AdminKroegentocht] Get settings failed:', e);
        return { show: true };
    }
}

