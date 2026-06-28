/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return */
import 'server-only';
import { query } from '@/lib/database';
import { toLocalISOString } from '@/lib/utils/date-utils';
import { activitiesSchema, type Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { type EventSignup } from '@salvemundi/validations/directus/schema';
import { safeConsoleError } from '@/server/utils/logger';

interface EventRow {
    id: string | number;
    name: string | null;
    description: string | null;
    location: string | null;
    event_date: string | Date | null;
    event_date_end: string | Date | null;
    image: string | null;
    image_type: string | null;
    status: string | null;
    price_members: string | number | null;
    price_non_members: string | number | null;
    max_sign_ups: string | number | null;
    only_members: boolean | null;
    registration_deadline: string | Date | null;
    contact: string | null;
    event_time: string | null;
    event_time_end: string | null;
    committee_id: string | number | null;
    committee_name: string | null;
    short_description: string | null;
    description_logged_in: string | null;
    publish_date: string | Date | null;
    custom_url: string | null;
    signup_count?: string | number;
}

const mapRowToActiviteitData = (item: any) => {
    const safeISO = (d: string | Date | null | undefined, includeTime = false) => {
        return toLocalISOString(d, includeTime);
    };

    return {
        ...item,
        id: Number(item.id),
        name: item.name ?? '',
        description: item.description ?? null,
        location: item.location ?? null,
        event_date: safeISO(item.event_date) || toLocalISOString(new Date()),
        event_date_end: safeISO(item.event_date_end),
        afbeelding_id: item.image ? { id: item.image, type: item.image_type ?? undefined } : null,
        status: item.status ?? undefined,
        price_members: item.price_members !== null ? String(item.price_members) : '0',
        price_non_members: item.price_non_members !== null ? String(item.price_non_members) : '0',
        max_sign_ups: item.max_sign_ups !== null ? Number(item.max_sign_ups) : null,
        only_members: item.only_members ?? false,
        registration_deadline: safeISO(item.registration_deadline),
        contact: item.contact ?? null,
        event_time: item.event_time ?? null,
        event_time_end: item.event_time_end ?? null,
        committee_id: item.committee_id ? Number(item.committee_id) : null,
        committee_name: item.committee_name || null,
        short_description: item.short_description ?? null,
        description_logged_in: item.description_logged_in || null,
        publish_date: safeISO(item.publish_date),
        custom_url: item.custom_url || null,
        one_sign_up_max: item.one_sign_up_max ?? false,
        created_at: safeISO(item.created_at) || null,
        updated_at: safeISO(item.updated_at) || null,
        image: item.image ?? null
    };
};

const mapRowToAdminActivityData = (rawItem: any) => {
    const item = rawItem as any;
    const safeISO = (d: string | Date | null | undefined, includeTime = false) => {
        return toLocalISOString(d, includeTime);
    };

    return {
        ...item,
        id: Number(item.id),
        name: item.name ?? '',
        event_date: safeISO(item.event_date) || toLocalISOString(new Date()),
        event_date_end: safeISO(item.event_date_end),
        description: item.description ?? null,
        location: item.location ?? null,
        price_members: item.price_members !== null ? String(item.price_members) : '0',
        price_non_members: item.price_non_members !== null ? String(item.price_non_members) : '0',
        max_sign_ups: item.max_sign_ups !== null ? Number(item.max_sign_ups) : null,
        only_members: item.only_members ?? false,
        registration_deadline: safeISO(item.registration_deadline),
        contact: item.contact ?? null,
        event_time: item.event_time ?? null,
        event_time_end: item.event_time_end ?? null,
        committee_id: item.committee_id ? Number(item.committee_id) : null,
        committee_name: item.committee_name || null,
        short_description: item.short_description ?? null,
        description_logged_in: item.description_logged_in || null,
        publish_date: safeISO(item.publish_date),
        custom_url: item.custom_url || null,
        status: item.status || 'draft',
        one_sign_up_max: item.one_sign_up_max ?? false,
        created_at: safeISO(item.created_at) || null,
        updated_at: safeISO(item.updated_at) || null,
        image: item.image ?? null
    };
};

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

    const mappedData = (rows as EventRow[]).map(mapRowToActiviteitData);

    const parsed = activitiesSchema.safeParse(mappedData);
    if (!parsed.success) {
        safeConsoleError('[admin-event.queries.ts][getActivitiesInternal] ', `Validation Error: ${parsed.error.message}`);
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

    const item = (rows as EventRow[])[0] as EventRow | undefined;
    if (!item) return null;

    const mapped = mapRowToActiviteitData(item);

    const parsed = activitiesSchema.element.safeParse(mapped);
    if (!parsed.success) {
        safeConsoleError('[admin-event.queries.ts][getActivityByIdInternal] ', `Validation Error: ${parsed.error.message}`);
        return mapped as Activiteit;
    }
    return parsed.data;
}

export async function getActivityBySlugInternal(slug: string): Promise<Activiteit | null> {
    const { slugify } = await import('@/shared/lib/utils/slug');
    const activities = await getActivitiesInternal(false);

    return activities.find(a => {
        const genSlug = slugify(a.name);
        const dateStr = a.event_date.split('T')[0];
        const genSlugWithDate = `${genSlug}-${dateStr}`;

        return genSlug === slug || genSlugWithDate === slug || a.id.toString() === slug;
    }) || null;
}

export async function getActivitySignupsInternal(eventId: string): Promise<EventSignup[]> {
    const sql = `
        SELECT 
            es.*, 
            COALESCE(es.is_member, (u.id IS NOT NULL)) as calculated_is_member,
            u.id as user_id
        FROM event_signups es
        LEFT JOIN directus_users u ON es.participant_email = u.email
        WHERE es.event_id = $1 
        AND es.payment_status IN ('paid', 'open')
        ORDER BY calculated_is_member DESC, es.created_at DESC
    `;
    const { rows } = await query(sql, [eventId]);

    return (rows as { [key: string]: unknown }[]).map((r) => ({
        ...r,
        id: r.id !== null && r.id !== undefined ? Number(r.id) : null,
        is_member: Boolean(r.calculated_is_member)
    } as EventSignup));
}

export async function getActivitiesWithSignupCountsInternal(search?: string, filter: 'all' | 'upcoming' | 'past' = 'all'): Promise<(Activiteit & { signup_count: number })[]> {
    let whereClause = "WHERE 1=1";
    const params: (string | number | boolean | null)[] = [];

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

    return (rows as EventRow[]).map((r: EventRow) => {
        const mappedData = mapRowToAdminActivityData(r);
        return {
            ...mappedData,
            signup_count: Number(r.signup_count || 0)
        };
    }) as unknown as (Activiteit & { signup_count: number })[];
}