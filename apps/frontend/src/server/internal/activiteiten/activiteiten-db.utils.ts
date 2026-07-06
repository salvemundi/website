import 'server-only';
import { db, schema } from '@salvemundi/db';
import { eq, sql, desc } from 'drizzle-orm';
import { type EventSignup } from '@salvemundi/validations/directus/schema';

export type EnrichedEvent = {
    id: number;
    name: string;
    event_date?: string;
    description?: string;
    image?: string;
    contact?: string;
    location?: string;
};

export type EnrichedEventSignup = EventSignup & {
    event_id: EnrichedEvent;
};

export async function deleteEventDb(id: number): Promise<boolean> {
    const result = await db.delete(schema.events).where(eq(schema.events.id, id));
    return result.count > 0;
}

export async function createEventSignupDb(data: Partial<EventSignup>): Promise<number | null> {
    const eventIdNum = typeof data.event_id === 'object' && 'id' in data.event_id ? (data.event_id as { id: number }).id : (data.event_id as number);
    const result = await db.insert(schema.event_signups).values({
        event_id: eventIdNum as number,
        participant_name: data.participant_name || null,
        participant_email: data.participant_email || null,
        participant_phone: data.participant_phone || null,
        payment_status: data.payment_status || 'open',
        qr_token: data.qr_token || null,
        directus_relations: typeof data.directus_relations === 'object' && data.directus_relations !== null && 'id' in data.directus_relations ? String((data.directus_relations as { id: unknown }).id) : (data.directus_relations as string | undefined) || null,
        checked_in: !!data.checked_in,
        checked_in_at: data.checked_in_at || null,
        is_member: !!data.is_member
    }).returning({ id: schema.event_signups.id });

    return result[0]?.id ?? null;
}

export async function updateEventSignupDb(id: number, data: Partial<EventSignup>): Promise<boolean> {
    const updateData: Partial<EventSignup> = {};
    if (data.payment_status !== undefined) updateData.payment_status = data.payment_status;
    if (data.checked_in !== undefined) updateData.checked_in = data.checked_in;
    if (data.checked_in_at !== undefined) updateData.checked_in_at = data.checked_in_at;
    if (data.participant_name !== undefined) updateData.participant_name = data.participant_name;
    if (data.participant_email !== undefined) updateData.participant_email = data.participant_email;
    if (data.participant_phone !== undefined) updateData.participant_phone = data.participant_phone;
    if (data.is_member !== undefined) updateData.is_member = data.is_member;

    if (Object.keys(updateData).length === 0) return true;

    const result = await db.update(schema.event_signups)
        .set(updateData as NonNullable<unknown>)
        .where(eq(schema.event_signups.id, id));
        
    return result.count > 0;
}

export async function deleteEventSignupDb(id: number): Promise<boolean> {
    const result = await db.delete(schema.event_signups).where(eq(schema.event_signups.id, id));
    return result.count > 0;
}

export async function fetchUserEventSignupsDb(email: string): Promise<EnrichedEventSignup[]> {
    const rows = await db.select({
        signup: schema.event_signups,
        event: schema.events
    })
    .from(schema.event_signups)
    .innerJoin(schema.events, eq(schema.event_signups.event_id, schema.events.id))
    .where(sql`LOWER(${schema.event_signups.participant_email}) = LOWER(${email})`)
    .orderBy(desc(schema.events.event_date));

    const { toLocalISOString } = await import('@/lib/utils/date-utils');

    return rows.map((row) => ({
        ...row.signup,
        created_at: toLocalISOString(row.signup.created_at),
        checked_in_at: toLocalISOString(row.signup.checked_in_at),
        event_id: {
            id: row.event.id,
            name: row.event.name,
            event_date: toLocalISOString(row.event.event_date) ?? undefined,
            description: row.event.description ?? undefined,
            image: row.event.image ?? undefined,
            contact: row.event.contact ?? undefined
        }
    })) as unknown as EnrichedEventSignup[];
}

export async function fetchEventSignupByIdDb(id: number): Promise<EnrichedEventSignup | null> {
    const rows = await db.select({
        signup: schema.event_signups,
        event: schema.events
    })
    .from(schema.event_signups)
    .innerJoin(schema.events, eq(schema.event_signups.event_id, schema.events.id))
    .where(eq(schema.event_signups.id, id))
    .limit(1);

    if (rows.length === 0) return null;

    const row = rows[0];
    const { toLocalISOString } = await import('@/lib/utils/date-utils');
    return {
        ...row.signup,
        created_at: toLocalISOString(row.signup.created_at),
        checked_in_at: toLocalISOString(row.signup.checked_in_at),
        event_id: {
            id: row.event.id,
            name: row.event.name,
            event_date: toLocalISOString(row.event.event_date) ?? undefined,
            description: row.event.description ?? undefined,
            image: row.event.image ?? undefined,
            contact: row.event.contact ?? undefined
        }
    } as unknown as EnrichedEventSignup;
}

export async function fetchEventSignupByTokenDb(token: string): Promise<EnrichedEventSignup | null> {
    const rows = await db.select({
        signup: schema.event_signups,
        event: schema.events
    })
    .from(schema.event_signups)
    .innerJoin(schema.events, eq(schema.event_signups.event_id, schema.events.id))
    .where(eq(schema.event_signups.qr_token, token))
    .limit(1);

    if (rows.length === 0) return null;

    const row = rows[0];
    const { toLocalISOString } = await import('@/lib/utils/date-utils');
    return {
        ...row.signup,
        created_at: toLocalISOString(row.signup.created_at),
        checked_in_at: toLocalISOString(row.signup.checked_in_at),
        event_id: {
            id: row.event.id,
            name: row.event.name,
            event_date: toLocalISOString(row.event.event_date) ?? undefined,
            description: row.event.description ?? undefined,
            image: row.event.image ?? undefined,
            contact: row.event.contact ?? undefined
        }
    } as unknown as EnrichedEventSignup;
}