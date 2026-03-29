'use server';

import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { revalidateTag, revalidatePath, unstable_noStore as noStore } from 'next/cache';
import { 
    pubCrawlEventSchema, 
    pubCrawlSignupSchema, 
    type PubCrawlEvent, 
    type PubCrawlSignup,
    PUB_CRAWL_EVENT_FIELDS,
    PUB_CRAWL_SIGNUP_FIELDS,
    PUB_CRAWL_TICKET_FIELDS,
    FEATURE_FLAG_FIELDS
} from '@salvemundi/validations';
import { isSuperAdmin } from "@/lib/auth-utils";
import { getRedis } from '@/server/auth/redis-client';
import { FLAGS_CACHE_KEY } from '@/lib/feature-flags';

import { getSystemDirectus } from "@/lib/directus";
import { 
    readItems, 
    readItem, 
    updateItem, 
    deleteItem, 
    createItem,
    uploadFiles 
} from '@directus/sdk';

async function requireKroegAdmin() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error('Niet ingelogd');

    if (!isSuperAdmin((session.user as any).committees)) {
        throw new Error('Geen toegang tot Kroegentocht beheer: SuperAdmin rechten vereist');
    }

    return session;
}


export async function getPubCrawlEvents(): Promise<PubCrawlEvent[]> {
    await requireKroegAdmin();
    try {
        const items = await getSystemDirectus().request(readItems('pub_crawl_events', {
            sort: ['-date'],
            limit: 100,
            fields: [...PUB_CRAWL_EVENT_FIELDS]
        }));
        return (items ?? []).map((e: any) => {
            e.price = 1;
            e.max_tickets_per_person = 10;
            return pubCrawlEventSchema.parse(e);
        });
    } catch (e) {
        console.error('[AdminKroegentocht] Fetch events failed:', e);
        throw new Error('Kon events niet ophalen');
    }
}

export async function getPubCrawlEvent(id: string | number): Promise<PubCrawlEvent> {
    await requireKroegAdmin();
    try {
        const item = await getSystemDirectus().request(readItem('pub_crawl_events', id, {
            fields: [...PUB_CRAWL_EVENT_FIELDS]
        }));
        const event = item as any;
        event.price = 1;
        event.max_tickets_per_person = 10;
        return pubCrawlEventSchema.parse(event);
    } catch (e) {
        console.error('[AdminKroegentocht] Fetch event failed:', e);
        throw new Error('Kon event niet ophalen');
    }
}

export async function upsertPubCrawlEvent(data: Partial<PubCrawlEvent>) {
    const session = await requireKroegAdmin();
    const { id, ...payload } = data as any;
    
    try {
        const client = getSystemDirectus();
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

export async function uploadPubCrawlImage(formData: FormData) {
    await requireKroegAdmin();
    try {
        const client = getSystemDirectus();
        const response = await client.request(uploadFiles(formData));
        return response;
    } catch (e) {
        console.error('[AdminKroegentocht] Upload failed:', e);
        throw new Error('Afbeelding uploaden mislukt');
    }
}


export async function getPubCrawlSignups(eventId: number) {
    await requireKroegAdmin();
    try {
        const items = await getSystemDirectus().request(readItems('pub_crawl_signups', {
            filter: { pub_crawl_event_id: { _eq: eventId } },
            fields: [
                ...PUB_CRAWL_SIGNUP_FIELDS,
                { tickets: [...PUB_CRAWL_TICKET_FIELDS] }
            ] as any,
            limit: 1000,
            sort: ['-id'],
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
                ...PUB_CRAWL_SIGNUP_FIELDS,
                { tickets: [...PUB_CRAWL_TICKET_FIELDS] }
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
        await getSystemDirectus().request(deleteItem('pub_crawl_signups', id));
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
        await getSystemDirectus().request(updateItem('pub_crawl_signups', id, data));
        revalidateTag(`signups-${eventId}`, 'default');
        return { success: true };
    } catch (e) {
        console.error('[AdminKroegentocht] Update signup failed:', e);
        throw new Error('Bijwerken mislukt');
    }
}


export async function toggleKroegentochtVisibility(): Promise<{ success: boolean; show?: boolean; error?: string }> {
    await requireKroegAdmin();
    const route = '/kroegentocht';
    
    try {
        const client = getSystemDirectus();
        const existing = await client.request(readItems('feature_flags', {
            filter: { route_match: { _eq: route } },
            fields: [...FEATURE_FLAG_FIELDS],
            limit: 1,
            params: { _t: Date.now() }
        }));

        const flag = existing?.[0];
        const oldStatus = flag ? !!flag.is_active : true; // Default to true if not exists
        const newStatus = !oldStatus;

        if (flag) {
            await client.request(updateItem('feature_flags', flag.id as unknown as string, { is_active: newStatus }));
            console.log(`[AdminKroegentocht] Toggle: DB was ${oldStatus}, setting to ${newStatus} (ID: ${flag.id})`);
        } else {
            await client.request(createItem('feature_flags', { 
                name: 'Kroegentocht Inschrijving',
                route_match: route, 
                is_active: newStatus 
            }));
            console.log(`[AdminKroegentocht] Toggle: Created new flag for ${route} with is_active: ${newStatus}`);
        }

        // Extended delay to allow Directus internal caches and DB to fully commit
        console.log(`[AdminKroegentocht] Waiting for DB consistency (200ms)...`);
        await new Promise(resolve => setTimeout(resolve, 200));
        
        console.log(`[AdminKroegentocht] Revalidating: feature_flags (profile: default)`);
        revalidateTag('feature_flags', 'default');
        revalidatePath('/', 'layout');
        
        // Invalidate feature flags cache in Redis to ensure immediate update in proxy
        try {
            const redis = await getRedis();
            const deletedRows = await redis.del(FLAGS_CACHE_KEY);
            console.log(`[AdminKroegentocht] Redis cache cleared. Keys deleted: ${deletedRows}`);
        } catch (e) {
            console.error('[AdminKroegentocht] Failed to clear Redis cache:', e);
        }

        return { success: true, show: newStatus };
    } catch (e) {
        console.error('[AdminKroegentocht] Toggle visibility failed:', e);
        return { success: false, error: 'Bijwerken mislukt' };
    }
}

export async function getKroegentochtSettings() {
    noStore();
    await requireKroegAdmin();
    try {
        const items = await getSystemDirectus().request(readItems('feature_flags', {
            filter: { route_match: { _eq: '/kroegentocht' } },
            fields: [...FEATURE_FLAG_FIELDS],
            limit: 1,
            params: { _t: Date.now() } // Hard bypass for Next.js cache
        }));
        
        const isVisible = items && items.length > 0 ? !!items[0].is_active : true;
        console.log(`[AdminKroegentocht] getKroegentochtSettings: isVisible=${isVisible} (from Directus)`);
        
        return { show: isVisible };
    } catch (e) {
        console.error('[AdminKroegentocht] Get settings failed:', e);
        return { show: true };
    }
}

