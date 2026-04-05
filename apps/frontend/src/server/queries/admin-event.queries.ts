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

export async function getActivitySignupsInternal(eventId: string): Promise<any[]> {
    try {
        const sql = `
            SELECT 
                es.*, 
                (u.id IS NOT NULL) as is_member,
                u.id as user_id
            FROM event_signups es
            LEFT JOIN directus_users u ON es.participant_email = u.email
            WHERE es.event_id = $1 
            AND es.payment_status = 'paid'
            ORDER BY is_member DESC, es.created_at DESC
        `;
        const { rows } = await query(sql, [eventId]);
        return rows;
    } catch (error) {
        console.error(`[AdminEventQueries] Error fetching signups for ${eventId}:`, error);
        return [];
    }
}

/**
 * Fetch all activities with their valid signup counts using SQL.
 * High performance alternative to Directus aggregates.
 */
export async function getActivitiesWithSignupCountsInternal(search?: string, filter: 'all' | 'upcoming' | 'past' = 'all'): Promise<any[]> {
    try {
        let whereClause = "WHERE 1=1";
        const params: any[] = [];
        
        if (filter === 'upcoming') {
            whereClause += " AND e.event_date >= NOW()";
        } else if (filter === 'past') {
            whereClause += " AND e.event_date < NOW()";
        }

        if (search) {
            params.push(`%${search}%`);
            whereClause += ` AND (e.name ILIKE $${params.length} OR e.description ILIKE $${params.length} OR e.location ILIKE $${params.length})`;
        }

        const sql = `
            SELECT 
                e.*, 
                c.name as committee_name,
                (SELECT COUNT(*) FROM event_signups es WHERE es.event_id = e.id AND es.payment_status = 'paid') as signup_count
            FROM events e 
            LEFT JOIN committees c ON e.committee_id = c.id
            ${whereClause}
            ORDER BY e.event_date DESC
        `;
        
        const { rows } = await query(sql, params);
        
        return rows.map(r => ({
            ...r,
            id: Number(r.id),
            event_date: r.event_date instanceof Date ? r.event_date.toISOString() : r.event_date,
            event_date_end: r.event_date_end instanceof Date ? r.event_date_end.toISOString() : r.event_date_end,
            registration_deadline: r.registration_deadline instanceof Date ? r.registration_deadline.toISOString() : r.registration_deadline,
            created_at: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
            updated_at: r.updated_at instanceof Date ? r.updated_at.toISOString() : r.updated_at,
            price_members: r.price_members ? Number(r.price_members) : 0,
            price_non_members: r.price_non_members ? Number(r.price_non_members) : 0,
            max_sign_ups: r.max_sign_ups ? Number(r.max_sign_ups) : null,
            committee_id: r.committee_id ? Number(r.committee_id) : null,
            signup_count: Number(r.signup_count || 0),
            image: r.image ? { id: r.image } : null // Map to object for AdminActivitySchema compatibility
        }));
    } catch (error) {
        console.error('[AdminEventQueries] getActivitiesWithSignupCountsInternal failed:', error);
        return [];
    }
}
