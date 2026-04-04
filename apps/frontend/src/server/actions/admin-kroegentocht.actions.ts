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
    PUB_CRAWL_TICKET_FIELDS
} from '@salvemundi/validations';
import { isSuperAdmin } from "@/lib/auth-utils";
import { getRedis } from '@/server/auth/redis-client';
import { FLAGS_CACHE_KEY } from '@/lib/feature-flags';

import { getSystemDirectus } from "@/lib/directus";
import { query } from '@/lib/db';
import { 
    readItems, 
    readItem, 
    updateItem, 
    deleteItem, 
    createItem,
    uploadFiles 
} from '@directus/sdk';
import { 
    fetchPubCrawlEventsDb, 
    fetchPubCrawlSignupsDb, 
    fetchPubCrawlSignupByIdDb,
    fetchPubCrawlTicketsDb
} from './kroegentocht-db.utils';

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
        // Direct DB fetch to bypass API cache
        return await fetchPubCrawlEventsDb();
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
        // Direct DB fetch to bypass API cache
        return await fetchPubCrawlSignupsDb(eventId);
    } catch (e) {
        console.error('[AdminKroegentocht] Fetch signups failed:', e);
        throw new Error('Kon aanmeldingen niet ophalen');
    }
}

export async function getPubCrawlSignup(id: number) {
    await requireKroegAdmin();
    try {
        // Direct DB fetch to bypass API cache
        return await fetchPubCrawlSignupByIdDb(id);
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
        const sql = 'SELECT id, is_active FROM feature_flags WHERE route_match = $1 LIMIT 1';
        const { rows } = await query(sql, [route]);

        const flag = rows?.[0];
        const oldStatus = flag ? !!flag.is_active : true;
        const newStatus = !oldStatus;

        if (flag) {
            await query('UPDATE feature_flags SET is_active = $1 WHERE id = $2', [newStatus, flag.id]);
            console.log(`[AdminKroegentocht] Toggle (SQL): DB was ${oldStatus}, setting to ${newStatus} (ID: ${flag.id})`);
        } else {
            await query('INSERT INTO feature_flags (name, route_match, is_active) VALUES ($1, $2, $3)', 
                ['Kroegentocht Inschrijving', route, newStatus]);
            console.log(`[AdminKroegentocht] Toggle (SQL): Created new flag for ${route} with is_active: ${newStatus}`);
        }

        // 1. Immediate clear to disrupt any current stale requests
        try {
            const redis = await getRedis();
            await redis.del(FLAGS_CACHE_KEY);
            console.log(`[AdminKroegentocht] Initial Redis cache clear (immediate)`);
        } catch (e) {
            console.error('[AdminKroegentocht] Initial Redis clear failed:', e);
        }

        // 2. Wait for Directus DB/Cache consistency. 200ms was too short based on logs.
        console.log(`[AdminKroegentocht] Waiting for Directus consistency (1000ms)...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log(`[AdminKroegentocht] Revalidating: feature_flags (profile: default)`);
        revalidateTag('feature_flags', 'default');
        revalidatePath('/', 'layout');
        
        // 3. Final clear to ensure any concurrent requests that fetched stale data are purged
        try {
            const redis = await getRedis();
            const deletedRows = await redis.del(FLAGS_CACHE_KEY);
            console.log(`[AdminKroegentocht] Final Redis cache clear. Keys deleted: ${deletedRows}`);
        } catch (e) {
            console.error('[AdminKroegentocht] Final Redis clear failed:', e);
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
        const { rows } = await query('SELECT is_active FROM feature_flags WHERE route_match = $1 LIMIT 1', ['/kroegentocht']);
        
        const isVisible = rows && rows.length > 0 ? !!rows[0].is_active : true;
        console.log(`[AdminKroegentocht] getKroegentochtSettings (SQL): isVisible=${isVisible}`);
        
        return { show: isVisible };
    } catch (e) {
        console.error('[AdminKroegentocht] Get settings (SQL) failed:', e);
        return { show: true };
    }
}

