import 'server-only';
import { db, schema } from '@salvemundi/db';
import { eq, desc, sql, and, or, ilike, type SQL } from 'drizzle-orm';
import { toLocalISOString } from '@/lib/utils/date-utils';
import { activitiesSchema, type Activiteit, type EventSignup } from '@salvemundi/validations/schema/activity.zod';
import { safeConsoleError } from '@/server/utils/logger';

export type EventDbRow = typeof schema.events.$inferSelect;

export type EventQueryResultRow = {
    events: EventDbRow;
    committee_name: string | null;
    signup_count: number;
    image_type: string | null;
};

function formatEventRow(r: EventQueryResultRow) {
    const item = r.events;
    const safeISO = (d: string | Date | null | undefined, includeTime = false) => toLocalISOString(d, includeTime);

    return {
        ...item,
        id: Number(item.id),
        name: item.name,
        description: item.description,
        location: item.location,
        event_date: safeISO(item.event_date) || toLocalISOString(new Date()) || new Date().toISOString(),
        event_date_end: safeISO(item.event_date_end),
        afbeelding_id: item.image ? { id: item.image, type: r.image_type ?? undefined } : null,
        status: item.status ?? null,
        price_members: item.price_members,
        price_non_members: item.price_non_members,
        max_sign_ups: item.max_sign_ups !== null ? Number(item.max_sign_ups) : null,
        signup_count: r.signup_count,
        only_members: item.only_members,
        registration_deadline: safeISO(item.registration_deadline, true),
        contact: item.contact,
        event_time: item.event_time,
        event_time_end: item.event_time_end,
        committee_id: item.committee_id !== null ? Number(item.committee_id) : null,
        committee_name: r.committee_name,
        short_description: item.short_description,
        description_logged_in: item.description_logged_in,
        publish_date: safeISO(item.publish_date, true),
        custom_url: item.custom_url,
        one_sign_up_max: item.one_sign_up_max,
        created_at: safeISO(item.created_at) || toLocalISOString(new Date()) || new Date().toISOString(),
        updated_at: safeISO(item.updated_at) || toLocalISOString(new Date()) || new Date().toISOString(),
        image: item.image ? (r.image_type ? { id: item.image, type: r.image_type } : item.image) : null,
        image_type: r.image_type
    };
}

export async function getActivitiesInternal(onlyPublished = true): Promise<Activiteit[]> {
    const whereClause = onlyPublished ? eq(schema.events.status, 'published') : undefined;

    const rows = await db.select({
        events: schema.events,
        committee_name: schema.committees.name,
        signup_count: sql<number>`(SELECT COUNT(*) FROM ${schema.event_signups} es WHERE es.event_id = ${schema.events.id} AND (es.payment_status = 'paid' OR (es.payment_status = 'open' AND es.created_at >= NOW() - INTERVAL '15 minutes')))`.mapWith(Number),
        image_type: schema.directus_files.type
    })
    .from(schema.events)
    .leftJoin(schema.committees, eq(schema.events.committee_id, schema.committees.id))
    .leftJoin(schema.directus_files, eq(schema.events.image, schema.directus_files.id))
    .where(whereClause)
    .orderBy(desc(schema.events.event_date));

    const mappedData = rows.map(formatEventRow);

    const parsed = activitiesSchema.safeParse(mappedData);
    if (!parsed.success) {
        safeConsoleError('[admin-event.queries.ts][getActivitiesInternal] ', `Validation Error: ${parsed.error.message}`);
        return mappedData as Activiteit[];
    }

    return parsed.data;
}

export async function getActivityByIdInternal(id: string): Promise<Activiteit | null> {
    const rows = await db.select({
        events: schema.events,
        committee_name: schema.committees.name,
        signup_count: sql<number>`(SELECT COUNT(*) FROM ${schema.event_signups} es WHERE es.event_id = ${schema.events.id} AND (es.payment_status = 'paid' OR (es.payment_status = 'open' AND es.created_at >= NOW() - INTERVAL '15 minutes')))`.mapWith(Number),
        image_type: schema.directus_files.type
    })
    .from(schema.events)
    .leftJoin(schema.committees, eq(schema.events.committee_id, schema.committees.id))
    .leftJoin(schema.directus_files, eq(schema.events.image, schema.directus_files.id))
    .where(eq(schema.events.id, Number(id)))
    .limit(1);

    if (rows.length === 0) return null;
    const mapped = formatEventRow(rows[0]);

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

export type EventSignupWithAmount = EventSignup & { amount_paid: number | null };

export async function getActivitySignupsInternal(eventId: string): Promise<EventSignupWithAmount[]> {
    const rows = await db.select({
        signup: schema.event_signups,
        calculated_is_member: sql<boolean>`COALESCE(${schema.event_signups.is_member}, (${schema.directus_users.id} IS NOT NULL))`,
        user_id: schema.directus_users.id,
        user_first_name: schema.directus_users.first_name,
        user_last_name: schema.directus_users.last_name,
        amount_paid: sql<number | null>`(
            SELECT t.amount FROM ${schema.transactions} t
            WHERE t.registration = ${schema.event_signups.id}
            ORDER BY (t.payment_status = 'paid') DESC, t.created_at DESC
            LIMIT 1
        )`
    })
    .from(schema.event_signups)
    .leftJoin(
        schema.directus_users,
        or(
            eq(schema.event_signups.directus_relations, schema.directus_users.id),
            eq(schema.event_signups.participant_email, schema.directus_users.email)
        )
    )
    .where(
        and(
            eq(schema.event_signups.event_id, Number(eventId)),
            eq(schema.event_signups.payment_status, 'paid')
        )
    )
    .orderBy(desc(sql`COALESCE(${schema.event_signups.is_member}, (${schema.directus_users.id} IS NOT NULL))`), desc(schema.event_signups.created_at));

    return rows.map((r) => {
        let name = r.signup.participant_name;
        if (r.user_first_name) {
            name = `${r.user_first_name} ${r.user_last_name || ''}`.trim();
        }
        return {
            ...r.signup,
            id: Number(r.signup.id),
            participant_name: name || r.signup.participant_name || 'Onbekend',
            is_member: Boolean(r.calculated_is_member),
            amount_paid: r.amount_paid !== null ? Number(r.amount_paid) : null
        };
    });
}

export async function getActivitiesWithSignupCountsInternal(search?: string, filter: 'all' | 'upcoming' | 'past' = 'all'): Promise<(Activiteit & { signup_count: number })[]> {
    let baseFilter: SQL<unknown> | undefined = undefined;
    if (filter === 'upcoming') {
        baseFilter = sql`${schema.events.event_date} >= NOW()`;
    } else if (filter === 'past') {
        baseFilter = sql`${schema.events.event_date} < NOW()`;
    }

    let searchFilter: SQL<unknown> | undefined = undefined;
    if (search) {
        const searchPattern = `%${search}%`;
        searchFilter = or(
            ilike(schema.events.name, searchPattern),
            ilike(schema.events.description, searchPattern),
            ilike(schema.events.location, searchPattern)
        );
    }

    const finalFilter = baseFilter && searchFilter ? and(baseFilter, searchFilter) : (baseFilter || searchFilter);

    const rows = await db.select({
        events: schema.events,
        committee_name: schema.committees.name,
        signup_count: sql<number>`(SELECT COUNT(*) FROM ${schema.event_signups} es WHERE es.event_id = ${schema.events.id} AND es.payment_status = 'paid')`.mapWith(Number),
        image_type: schema.directus_files.type
    })
    .from(schema.events)
    .leftJoin(schema.committees, eq(schema.events.committee_id, schema.committees.id))
    .leftJoin(schema.directus_files, eq(schema.events.image, schema.directus_files.id))
    .where(finalFilter)
    .orderBy(desc(schema.events.event_date));

    return rows.map((r) => {
        const mappedData = formatEventRow(r);
        return {
            ...mappedData,
            signup_count: Number(r.signup_count || 0)
        };
    });
}