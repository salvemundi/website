import { query } from '@/lib/db';
import { 
    activiteitenSchema, 
    type Activiteit,
    type DbEventSignup,
    EVENT_SIGNUP_FIELDS 
} from '@salvemundi/validations';
import { z } from 'zod';

/**
 * PURE QUERIES: No 'use server' and No headers() calls.
 * Safe to use in both Server Component renders and Server Actions.
 */

export async function getActivitiesInternal(onlyPublished = true): Promise<Activiteit[]> {
    try {
        const sql = `
            SELECT e.*, c.name as committee_name 
            FROM events e 
            LEFT JOIN committees c ON e.committee_id = c.id
            ${onlyPublished ? "WHERE e.status = 'published'" : ""}
            ORDER BY e.event_date DESC
        `;
        const { rows } = await query(sql);

        const mappedData = rows.map((item) => ({
            id: String(item.id ?? ''),
            titel: item.name ?? '',
            beschrijving: item.description ?? null,
            locatie: item.location ?? null,
            datum_start: item.event_date ? new Date(item.event_date).toISOString() : new Date().toISOString(),
            datum_eind: item.event_date_end ? new Date(item.event_date_end).toISOString() : null,
            afbeelding_id: item.image ?? null,
            status: item.status ?? undefined,
            price_members: item.price_members != null ? Number(item.price_members) : 0,
            price_non_members: item.price_non_members != null ? Number(item.price_non_members) : 0,
            only_members: item.only_members ?? false,
            registration_deadline: item.registration_deadline ?? null,
            contact: item.contact ?? null,
            event_time: item.event_time ?? null,
            event_time_end: item.event_time_end ?? null,
            committee_name: item.committee_name || null,
        }));

        const parsed = activiteitenSchema.safeParse(mappedData);
        if (!parsed.success) {
            console.error('[AdminEventQueries] Zod validation failed:', parsed.error.flatten().fieldErrors);
            return mappedData as any; // Fallback
        }

        return parsed.data;
    } catch (error) {
        console.error('[AdminEventQueries] getActivitiesInternal failed:', error);
        return [];
    }
}

export async function getActivityByIdInternal(id: string): Promise<Activiteit | null> {
    try {
        const sql = `
            SELECT e.*, c.name as committee_name 
            FROM events e 
            LEFT JOIN committees c ON e.committee_id = c.id
            WHERE e.id = $1
            LIMIT 1
        `;
        const { rows } = await query(sql, [id]);
        
        const item = rows?.[0];
        if (!item) return null;

        const mapped = {
            id: String(item.id ?? ''),
            titel: item.name ?? '',
            beschrijving: item.description ?? null,
            locatie: item.location ?? null,
            datum_start: item.event_date ? new Date(item.event_date).toISOString() : new Date().toISOString(),
            datum_eind: item.event_date_end ? new Date(item.event_date_end).toISOString() : null,
            afbeelding_id: item.image ?? null,
            status: item.status ?? undefined,
            price_members: item.price_members != null ? Number(item.price_members) : 0,
            price_non_members: item.price_non_members != null ? Number(item.price_non_members) : 0,
            only_members: item.only_members ?? false,
            registration_deadline: item.registration_deadline ?? null,
            contact: item.contact ?? null,
            event_time: item.event_time ?? null,
            event_time_end: item.event_time_end ?? null,
            committee_name: item.committee_name || null,
        };

        const parsed = activiteitenSchema.element.safeParse(mapped);
        return parsed.success ? parsed.data : (mapped as any);
    } catch (error) {
        console.error('[AdminEventQueries] getActivityByIdInternal failed:', error);
        return null;
    }
}

export async function getActivitySignupsInternal(eventId: string): Promise<DbEventSignup[]> {
    try {
        const sql = 'SELECT * FROM event_signups WHERE event_id = $1 ORDER BY created_at DESC';
        const { rows } = await query(sql, [eventId]);
        return rows as any[];
    } catch (error) {
        console.error(`[AdminEventQueries] Error fetching signups for ${eventId}:`, error);
        return [];
    }
}
