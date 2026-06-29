/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return */
import 'server-only';
import { toLocalISOString } from '@/lib/utils/date-utils';
import { activitiesSchema, type Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { type EventSignup } from '@salvemundi/validations/directus/schema';
import { safeConsoleError } from '@/server/utils/logger';

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
        image: item.image ? (item.image_type ? { id: item.image, type: item.image_type } : item.image) : null,
        image_type: item.image_type ?? null
    };
};

export async function getActivitiesInternal(onlyPublished = true): Promise<Activiteit[]> {
    const { db, schema } = await import('@/lib/database/db');
    const { eq, desc } = await import('drizzle-orm');

    let query = db.select({
        events: schema.events,
        committee_name: schema.committees.name,
        image_type: schema.directus_files.type
    })
    .from(schema.events)
    .leftJoin(schema.committees, eq(schema.events.committee_id, schema.committees.id))
    .leftJoin(schema.directus_files, eq(schema.events.image, schema.directus_files.id));

    if (onlyPublished) {
        query = query.where(eq(schema.events.status, 'published')) as any;
    }

    const rows = await query.orderBy(desc(schema.events.event_date));

    const flatRows = rows.map(r => ({
        ...r.events,
        committee_name: r.committee_name,
        image_type: r.image_type
    }));

    const mappedData = flatRows.map(mapRowToActiviteitData);

    const parsed = activitiesSchema.safeParse(mappedData);
    if (!parsed.success) {
        safeConsoleError('[admin-event.queries.ts][getActivitiesInternal] ', `Validation Error: ${parsed.error.message}`);
        return mappedData as Activiteit[];
    }

    return parsed.data;
}

export async function getActivityByIdInternal(id: string): Promise<Activiteit | null> {
    const { db, schema } = await import('@/lib/database/db');
    const { eq } = await import('drizzle-orm');

    const rows = await db.select({
        events: schema.events,
        committee_name: schema.committees.name,
        image_type: schema.directus_files.type
    })
    .from(schema.events)
    .leftJoin(schema.committees, eq(schema.events.committee_id, schema.committees.id))
    .leftJoin(schema.directus_files, eq(schema.events.image, schema.directus_files.id))
    .where(eq(schema.events.id, Number(id)))
    .limit(1);

    if (rows.length === 0) return null;
    const item = rows[0];
    const flatRow = {
        ...item.events,
        committee_name: item.committee_name,
        image_type: item.image_type
    };

    const mapped = mapRowToActiviteitData(flatRow);

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
    const { db, schema } = await import('@/lib/database/db');
    const { eq, inArray, desc, sql, and } = await import('drizzle-orm');

    const rows = await db.select({
        signup: schema.event_signups,
        calculated_is_member: sql<boolean>`COALESCE(${schema.event_signups.is_member}, (${schema.directus_users.id} IS NOT NULL))`,
        user_id: schema.directus_users.id
    })
    .from(schema.event_signups)
    .leftJoin(schema.directus_users, eq(schema.event_signups.participant_email, schema.directus_users.email))
    .where(
        and(
            eq(schema.event_signups.event_id, Number(eventId)),
            inArray(schema.event_signups.payment_status, ['paid', 'open'])
        )
    )
    .orderBy(desc(sql`COALESCE(${schema.event_signups.is_member}, (${schema.directus_users.id} IS NOT NULL))`), desc(schema.event_signups.created_at));

    return rows.map((r) => ({
        ...r.signup,
        id: Number(r.signup.id),
        is_member: Boolean(r.calculated_is_member)
    } as unknown as EventSignup));
}

export async function getActivitiesWithSignupCountsInternal(search?: string, filter: 'all' | 'upcoming' | 'past' = 'all'): Promise<(Activiteit & { signup_count: number })[]> {
    const { db, schema } = await import('@/lib/database/db');
    const { eq, and, or, ilike, desc, sql } = await import('drizzle-orm');

    let baseFilter: any = undefined;
    if (filter === 'upcoming') {
        baseFilter = sql`${schema.events.event_date} >= NOW()`;
    } else if (filter === 'past') {
        baseFilter = sql`${schema.events.event_date} < NOW()`;
    }

    let searchFilter: any = undefined;
    if (search) {
        const searchPattern = `%${search}%`;
        searchFilter = or(
            ilike(schema.events.name, searchPattern),
            ilike(schema.events.description, searchPattern),
            ilike(schema.events.location, searchPattern)
        );
    }

    const finalFilter = baseFilter && searchFilter ? and(baseFilter, searchFilter) : (baseFilter || searchFilter);

    let query = db.select({
        events: schema.events,
        committee_name: schema.committees.name,
        signup_count: sql<number>`(SELECT COUNT(*) FROM ${schema.event_signups} es WHERE es.event_id = ${schema.events.id} AND es.payment_status = 'paid')`.mapWith(Number),
        image_type: schema.directus_files.type
    })
    .from(schema.events)
    .leftJoin(schema.committees, eq(schema.events.committee_id, schema.committees.id))
    .leftJoin(schema.directus_files, eq(schema.events.image, schema.directus_files.id));

    if (finalFilter) {
        query = query.where(finalFilter) as any;
    }

    const rows = await query.orderBy(desc(schema.events.event_date));

    return rows.map((r) => {
        const flatRow = {
            ...r.events,
            committee_name: r.committee_name,
            image_type: r.image_type
        };
        const mappedData = mapRowToActiviteitData(flatRow);
        return {
            ...mappedData,
            signup_count: Number(r.signup_count || 0)
        };
    }) as unknown as (Activiteit & { signup_count: number })[];
}