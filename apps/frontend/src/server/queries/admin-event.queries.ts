import { query } from '@/lib/database';
import { activitiesSchema, type Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { type DbEventSignup } from '@salvemundi/validations/directus/schema';
import { EVENT_SIGNUP_FIELDS } from '@salvemundi/validations/directus/fields';
import { z } from 'zod';

/**
 * Pure database queries for event management.
 * Designed to be safe for both RSC (React Server Components) and Server Actions
 * by avoiding headers() or other request-bound context.
 */

export async function getActivitiesInternal(onlyPublished = true): Promise<Activiteit[]> {
    const sql = `
        SELECT e.*, c.name as committee_name, f.type as image_type
        FROM events e 
        LEFT JOIN committees c ON e.committee_id = c.id
        LEFT JOIN directus_files f ON e.image = f.id
        ${onlyPublished ? "WHERE e.status = 'published'" : ""}
        ORDER BY e.event_date DESC
    `;
    const { rows } = await query(sql);

    const mappedData = rows.map((item) => {
        const safeISO = (d: any) => {
            if (!d) return null;
            const date = d instanceof Date ? d : new Date(d);
            return isNaN(date.getTime()) ? null : date.toISOString();
        };
        
        return {
            id: String(item.id ?? ''),
            titel: item.name ?? '',
            beschrijving: item.description ?? null,
            locatie: item.location ?? null,
            datum_start: safeISO(item.event_date) || new Date().toISOString(),
            datum_eind: safeISO(item.event_date_end),
            afbeelding_id: item.image ? { id: item.image, type: item.image_type } : null,
            status: item.status ?? undefined,
            price_members: item.price_members != null ? Number(item.price_members) : 0,
            price_non_members: item.price_non_members != null ? Number(item.price_non_members) : 0,
            max_sign_ups: item.max_sign_ups != null ? Number(item.max_sign_ups) : null,
            only_members: item.only_members ?? false,
            registration_deadline: safeISO(item.registration_deadline),
            contact: item.contact ?? null,
            event_time: item.event_time ?? null,
            event_time_end: item.event_time_end ?? null,
            committee_id: item.committee_id ? Number(item.committee_id) : null,
            committee_name: item.committee_name || null,
            description_logged_in: item.description_logged_in || null,
            publish_date: safeISO(item.publish_date),
            custom_url: item.custom_url || null,
        };
    });

    const parsed = activitiesSchema.safeParse(mappedData);
    if (!parsed.success) {
        // Log validation error but return mapped data if possible for limited UI resilience
        console.error('[Validation Error] getActivitiesInternal:', parsed.error);
        return mappedData as Activiteit[];
    }

    return parsed.data;
}

export async function getActivityByIdInternal(id: string): Promise<Activiteit | null> {
    const sql = `
        SELECT e.*, c.name as committee_name, f.type as image_type
        FROM events e 
        LEFT JOIN committees c ON e.committee_id = c.id
        LEFT JOIN directus_files f ON e.image = f.id
        WHERE e.id = $1
        LIMIT 1
    `;
    const { rows } = await query(sql, [id]);
    
    const item = rows?.[0];
    if (!item) return null;

    const safeISO = (d: any) => {
        if (!d) return null;
        const date = d instanceof Date ? d : new Date(d);
        return isNaN(date.getTime()) ? null : date.toISOString();
    };

    const mapped = {
        id: String(item.id ?? ''),
        titel: item.name ?? '',
        beschrijving: item.description ?? null,
        locatie: item.location ?? null,
        datum_start: safeISO(item.event_date) || new Date().toISOString(),
        datum_eind: safeISO(item.event_date_end),
        afbeelding_id: item.image ? { id: item.image, type: item.image_type } : null,
        status: item.status ?? undefined,
        price_members: item.price_members != null ? Number(item.price_members) : 0,
        price_non_members: item.price_non_members != null ? Number(item.price_non_members) : 0,
        max_sign_ups: item.max_sign_ups != null ? Number(item.max_sign_ups) : null,
        only_members: item.only_members ?? false,
        registration_deadline: safeISO(item.registration_deadline),
        contact: item.contact ?? null,
        event_time: item.event_time ?? null,
        event_time_end: item.event_time_end ?? null,
        committee_id: item.committee_id ? Number(item.committee_id) : null,
        committee_name: item.committee_name || null,
        description_logged_in: item.description_logged_in || null,
        publish_date: safeISO(item.publish_date),
        custom_url: item.custom_url || null,
    };

    const parsed = activitiesSchema.element.safeParse(mapped);
    if (!parsed.success) {
        console.error('[Validation Error] getActivityByIdInternal:', parsed.error);
        return mapped as Activiteit;
    }
    return parsed.data;
}

export async function getActivityBySlugInternal(slug: string): Promise<Activiteit | null> {
    const sql = `
        SELECT e.*, c.name as committee_name, f.type as image_type
        FROM events e 
        LEFT JOIN committees c ON e.committee_id = c.id
        LEFT JOIN directus_files f ON e.image = f.id
        WHERE e.custom_url = $1 OR e.id::text = $1
        LIMIT 1
    `;
    const { rows } = await query(sql, [slug]);
    
    const item = rows?.[0];
    if (!item) return null;

    const safeISO = (d: any) => {
        if (!d) return null;
        const date = d instanceof Date ? d : new Date(d);
        return isNaN(date.getTime()) ? null : date.toISOString();
    };

    const mapped = {
        id: String(item.id ?? ''),
        titel: item.name ?? '',
        beschrijving: item.description ?? null,
        locatie: item.location ?? null,
        datum_start: safeISO(item.event_date) || new Date().toISOString(),
        datum_eind: safeISO(item.event_date_end),
        afbeelding_id: item.image ? { id: item.image, type: item.image_type } : null,
        status: item.status ?? undefined,
        price_members: item.price_members != null ? Number(item.price_members) : 0,
        price_non_members: item.price_non_members != null ? Number(item.price_non_members) : 0,
        max_sign_ups: item.max_sign_ups != null ? Number(item.max_sign_ups) : null,
        only_members: item.only_members ?? false,
        registration_deadline: safeISO(item.registration_deadline),
        contact: item.contact ?? null,
        event_time: item.event_time ?? null,
        event_time_end: item.event_time_end ?? null,
        committee_id: item.committee_id ? Number(item.committee_id) : null,
        committee_name: item.committee_name || null,
        description_logged_in: item.description_logged_in || null,
        publish_date: safeISO(item.publish_date),
        custom_url: item.custom_url || null,
    };

    const parsed = activitiesSchema.element.safeParse(mapped);
    if (!parsed.success) {
        console.error('[Validation Error] getActivityBySlugInternal:', parsed.error);
        return mapped as Activiteit;
    }
    return parsed.data;
}

export async function getActivitySignupsInternal(eventId: string): Promise<DbEventSignup[]> {
    const sql = `
        SELECT 
            es.*, 
            COALESCE(es.is_member, (u.id IS NOT NULL)) as calculated_is_member,
            u.id as user_id
        FROM event_signups es
        LEFT JOIN directus_users u ON es.participant_email = u.email
        WHERE es.event_id = $1 
        AND es.payment_status = 'paid'
        ORDER BY calculated_is_member DESC, es.created_at DESC
    `;
    const { rows } = await query(sql, [eventId]);
    
    // Map back to ensure compatibility with existing components that expect is_member
    return rows.map(r => ({
        ...r,
        is_member: r.calculated_is_member
    }));
}

/**
 * Fetch all activities with their valid signup counts using SQL.
 * High performance alternative to Directus aggregates.
 */
export async function getActivitiesWithSignupCountsInternal(search?: string, filter: 'all' | 'upcoming' | 'past' = 'all'): Promise<any[]> {
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
            (SELECT COUNT(*) FROM event_signups es WHERE es.event_id = e.id AND es.payment_status = 'paid') as signup_count,
            f.type as image_type
        FROM events e 
        LEFT JOIN committees c ON e.committee_id = c.id
        LEFT JOIN directus_files f ON e.image = f.id
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
        image: r.image ? { id: r.image, type: r.image_type } : null // Map to object for AdminActivitySchema compatibility
    }));
}
