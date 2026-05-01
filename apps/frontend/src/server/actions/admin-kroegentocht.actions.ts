'use server';

import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { revalidateTag, revalidatePath, unstable_noStore as noStore } from 'next/cache';
import { 
    pubCrawlEventSchema, 
    pubCrawlSignupSchema, 
    type PubCrawlEvent, 
    type PubCrawlSignup
} from '@salvemundi/validations/schema/pub-crawl.zod';
import { 
    PUB_CRAWL_EVENT_FIELDS, 
    PUB_CRAWL_SIGNUP_FIELDS, 
    PUB_CRAWL_TICKET_FIELDS 
} from '@salvemundi/validations/directus/fields';
import { getRedis } from '@/server/auth/redis-client';
import { FLAGS_CACHE_KEY } from '@/lib/config/feature-flags';

import { getSystemDirectus } from "@/lib/directus";
import { query } from '@/lib/database';
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
    fetchPubCrawlTicketsDb,
    updatePubCrawlSignupDb,
    deletePubCrawlSignupDb
} from './kroegentocht-db.utils';
import { requireAdminResource } from '../auth/auth-utils';
import { AdminResource } from '@/shared/lib/permissions-config';

async function requireKroegAdmin() {
    return requireAdminResource(AdminResource.Kroegentocht);
}


export async function getPubCrawlEvents(): Promise<PubCrawlEvent[]> {
    await requireKroegAdmin();
    try {
        // Direct DB fetch to bypass API cache
        return await fetchPubCrawlEventsDb();
    } catch (e) {
        
        throw new Error('Kon events niet ophalen');
    }
}

export async function getPubCrawlEvent(id: string | number): Promise<PubCrawlEvent> {
    await requireKroegAdmin();
    try {
        const item = await getSystemDirectus().request(readItem('pub_crawl_events', id, {
            fields: [...PUB_CRAWL_EVENT_FIELDS]
        }));
        const event = item as unknown as PubCrawlEvent;
        return pubCrawlEventSchema.parse(event);
    } catch (e) {
        
        throw new Error('Kon event niet ophalen');
    }
}

export async function upsertPubCrawlEvent(data: Partial<PubCrawlEvent>) {
    await requireKroegAdmin();
    const { id, name, description, date, email, image } = data;
    
    // Alleen velden sturen die daadwerkelijk in de Directus collectie zitten
    const payload = { name, description, date, email, image };

    try {
        const client = getSystemDirectus();
        if (id) {
            await client.request(updateItem('pub_crawl_events', id, payload));
        } else {
            await client.request(createItem('pub_crawl_events', payload));
        }
        
        // Standaard Next.js cache revalidatie (met 'max' argument om deprecation te voorkomen)
        revalidateTag('kroegentocht-events', 'max');
        revalidateTag('kroegentocht-event', 'max');
        revalidatePath('/beheer/kroegentocht');
        
        return { success: true };
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Onbekende fout';
        console.error('[Kroegentocht-Action] Upsert failed:', message);
        throw new Error('Opslaan van event mislukt: ' + message);
    }
}

export async function uploadPubCrawlImage(formData: FormData) {
    await requireKroegAdmin();
    try {
        const client = getSystemDirectus();
        const response = await client.request(uploadFiles(formData));
        return response;
    } catch (e) {
        
        throw new Error('Afbeelding uploaden mislukt');
    }
}


export async function getPubCrawlSignups(eventId: number) {
    noStore();
    await requireKroegAdmin();
    try {
        // 1. Fetch from SQL (fastest)
        const sqlSignups = await fetchPubCrawlSignupsDb(eventId);
        
        // 2. Identify 'open' signups that might have been paid (Directus is source of truth via webhooks)
        const openSignupIds = sqlSignups.filter(s => s.payment_status === 'open').map(s => s.id);
        
        if (openSignupIds.length > 0) {
            try {
                // Check Directus for latest status
                const directusItems = await getSystemDirectus().request(readItems('pub_crawl_signups', {
                    filter: { id: { _in: openSignupIds } },
                    fields: ['id', 'payment_status']
                })) as unknown as { id: number; payment_status: string }[];
                
                const directusStatusMap = new Map<number, string>(directusItems.map((item) => [item.id, item.payment_status]));
                
                // Update SQL for those that changed
                for (const signup of sqlSignups) {
                    if (!signup.id) continue;
                    const latestStatus = directusStatusMap.get(Number(signup.id));
                    if (latestStatus && latestStatus !== signup.payment_status) {
                        (signup as Record<string, unknown>).payment_status = latestStatus;
                        // Background update SQL
                        updatePubCrawlSignupDb(Number(signup.id), { payment_status: latestStatus as 'open' | 'paid' | 'failed' | 'canceled' | 'expired' }).catch(() => {});
                    }
                }
            } catch (err) {
                // Directus check failed, fall back to SQL only (silent error)
                console.error('[Kroegentocht-Action] Directus sync check failed:', err);
            }
        }

        return sqlSignups;
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Onbekende fout';
        console.error('[Kroegentocht-Action] getPubCrawlSignups failed:', message);
        throw new Error('Kon aanmeldingen niet ophalen');
    }
}

export async function getPubCrawlSignup(id: number) {
    await requireKroegAdmin();
    try {
        // Direct DB fetch to bypass API cache
        return await fetchPubCrawlSignupByIdDb(id);
    } catch (e) {
        
        throw new Error('Kon aanmelding niet ophalen');
    }
}

export async function deletePubCrawlSignup(id: number, eventId: number) {
    await requireKroegAdmin();
    try {
        await deletePubCrawlSignupDb(id);
        revalidateTag(`signups-${eventId}`, 'max');

        // Background sync to Directus
        getSystemDirectus().request(deleteItem('pub_crawl_signups', id)).catch(() => {});

        return { success: true };
    } catch (e) {
        throw new Error('Verwijderen mislukt');
    }
}

export async function updatePubCrawlSignup(id: number, eventId: number, data: Partial<PubCrawlSignup>) {
    await requireKroegAdmin();
    
    // PENTEST HARDENING: Strictly validate update payload
    const allowedFields = ['payment_status', 'association', 'name', 'email'];
    const filteredData = Object.fromEntries(
        Object.entries(data).filter(([key]) => allowedFields.includes(key))
    );

    if (Object.keys(filteredData).length === 0) {
        throw new Error('Geen geldige velden om bij te werken');
    }

    try {
        await updatePubCrawlSignupDb(id, filteredData);
        revalidateTag(`signups-${eventId}`, 'max');

        // Background sync to Directus
        getSystemDirectus().request(updateItem('pub_crawl_signups', id, filteredData)).catch(() => {});

        return { success: true };
    } catch (e) {
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
        } else {
            await query('INSERT INTO feature_flags (name, route_match, is_active) VALUES ($1, $2, $3)', 
                ['Kroegentocht Inschrijving', route, newStatus]);
        }

        // Clear Redis feature flag cache immediately
        try {
            const redis = await getRedis();
            await redis.del(FLAGS_CACHE_KEY);
        } catch (e) {
            
        }

        // Wait for Directus cache consistency
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        revalidateTag('feature_flags', 'max');
        revalidatePath('/', 'layout');
        
        // Final Redis flush
        try {
            const redis = await getRedis();
            await redis.del(FLAGS_CACHE_KEY);
        } catch (e) {
            
        }

        return { success: true, show: newStatus };
    } catch (e) {
        
        return { success: false, error: 'Bijwerken mislukt' };
    }
}

export async function getKroegentochtSettings() {
    noStore();
    await requireKroegAdmin();
    try {
        const { rows } = await query('SELECT is_active FROM feature_flags WHERE route_match = $1 LIMIT 1', ['/kroegentocht']);
        const isVisible = rows && rows.length > 0 ? !!rows[0].is_active : true;
        return { show: isVisible };
    } catch (e) {
        
        return { show: true };
    }
}

export async function togglePubCrawlTicketCheckIn(ticketId: number, currentStatus: boolean, eventId: number) {
    await requireKroegAdmin();
    const newStatus = !currentStatus;
    const now = newStatus ? new Date().toISOString() : null;

    try {
        // 1. Update SQL (fast source of truth for admin list)
        await query(
            'UPDATE pub_crawl_tickets SET checked_in = $1, checked_in_at = $2 WHERE id = $3',
            [newStatus, now, ticketId]
        );

        // 2. Background update Directus
        getSystemDirectus().request(updateItem('pub_crawl_tickets', ticketId, {
            checked_in: newStatus,
            checked_in_at: now
        })).catch(() => {});

        revalidateTag(`signups-${eventId}`, 'max');
        return { success: true, newStatus };
    } catch (e) {
        throw new Error('Inchecken mislukt');
    }
}
