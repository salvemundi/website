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

const getDirectusUrl = () => process.env.INTERNAL_DIRECTUS_URL;

const getDirectusHeaders = (): HeadersInit => {
    const token = process.env.DIRECTUS_STATIC_TOKEN;
    if (!token) throw new Error('DIRECTUS_STATIC_TOKEN is missing');
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

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
    const res = await fetch(`${getDirectusUrl()}/items/pub_crawl_events?sort=-date&limit=100`, {
        headers: getDirectusHeaders(),
        next: { tags: ['kroegentocht-events'] }
    });
    if (!res.ok) throw new Error('Kon events niet ophalen');
    const json = await res.json();
    return (json.data ?? []).map((e: any) => pubCrawlEventSchema.parse(e));
}

export async function getPubCrawlEvent(id: string | number): Promise<PubCrawlEvent> {
    await requireKroegAdmin();
    const res = await fetch(`${getDirectusUrl()}/items/pub_crawl_events/${id}`, {
        headers: getDirectusHeaders()
    });
    if (!res.ok) throw new Error('Kon event niet ophalen');
    const json = await res.json();
    return pubCrawlEventSchema.parse(json.data);
}

export async function upsertPubCrawlEvent(data: Partial<PubCrawlEvent>) {
    await requireKroegAdmin();
    const { id, ...payload } = data;
    const method = id ? 'PATCH' : 'POST';
    const url = id 
        ? `${getDirectusUrl()}/items/pub_crawl_events/${id}` 
        : `${getDirectusUrl()}/items/pub_crawl_events`;

    const res = await fetch(url, {
        method,
        headers: getDirectusHeaders(),
        body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error('Opslaan van event mislukt');
    revalidateTag('kroegentocht-events', 'default');
    revalidateTag('kroegentocht-event', 'default');
    return { success: true };
}

// ── Signups ────────────────────────────────────────────────────────────────

export async function getPubCrawlSignups(eventId: number) {
    await requireKroegAdmin();
    const res = await fetch(
        `${getDirectusUrl()}/items/pub_crawl_signups?filter[pub_crawl_event_id][_eq]=${eventId}&fields=*,tickets.*&limit=1000&sort=-created_at`,
        { headers: getDirectusHeaders(), next: { tags: [`signups-${eventId}`] } }
    );
    if (!res.ok) throw new Error('Kon aanmeldingen niet ophalen');
    const json = await res.json();
    
    // In V7/Directus signups table has "tickets" relation (o2m)
    return (json.data ?? []).map((s: any) => ({
        ...s,
        participants: s.tickets?.map((t: any) => ({ name: t.name, initial: t.initial })) ?? []
    }));
}

export async function getPubCrawlSignup(id: number) {
    await requireKroegAdmin();
    const res = await fetch(
        `${getDirectusUrl()}/items/pub_crawl_signups/${id}?fields=*,tickets.*`,
        { headers: getDirectusHeaders() }
    );
    if (!res.ok) throw new Error('Kon aanmelding niet ophalen');
    const json = await res.json();
    return json.data;
}

export async function deletePubCrawlSignup(id: number, eventId: number) {
    await requireKroegAdmin();
    const res = await fetch(`${getDirectusUrl()}/items/pub_crawl_signups/${id}`, {
        method: 'DELETE',
        headers: getDirectusHeaders(),
    });
    if (!res.ok) throw new Error('Verwijderen mislukt');
    revalidateTag(`signups-${eventId}`, 'default');
    return { success: true };
}

export async function updatePubCrawlSignup(id: number, eventId: number, data: any) {
    await requireKroegAdmin();
    const res = await fetch(`${getDirectusUrl()}/items/pub_crawl_signups/${id}`, {
        method: 'PATCH',
        headers: getDirectusHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Bijwerken mislukt');
    revalidateTag(`signups-${eventId}`, 'default');
    return { success: true };
}

// ── Settings ───────────────────────────────────────────────────────────────

export async function toggleKroegentochtVisibility(current: boolean) {
    await requireKroegAdmin();
    const key = 'kroegentocht';
    const payload = { id: key, show: !current };
    
    const patchRes = await fetch(`${getDirectusUrl()}/items/site_settings/${key}`, {
        method: 'PATCH',
        headers: getDirectusHeaders(),
        body: JSON.stringify(payload),
    });

    if (!patchRes.ok) {
        await fetch(`${getDirectusUrl()}/items/site_settings`, {
            method: 'POST',
            headers: getDirectusHeaders(),
            body: JSON.stringify(payload),
        });
    }

    revalidateTag('site_settings', 'default');
    return { success: true, show: !current };
}

export async function getKroegentochtSettings() {
    await requireKroegAdmin();
    const res = await fetch(`${getDirectusUrl()}/items/site_settings/kroegentocht`, {
        headers: getDirectusHeaders(),
        next: { tags: ['site_settings'] }
    });
    if (!res.ok) return { show: true };
    const json = await res.json();
    return json.data;
}

