import 'server-only';
import { db, schema } from '@salvemundi/db';
import { eq, and, or, count, sql, desc } from 'drizzle-orm';
import { type EventSignup } from '@salvemundi/validations/schema/activity.zod';

export async function countActiveEventSignupsDb(
    eventId: number,
    pendingWindowMinutes: number = 15
): Promise<number> {
    const result = await db.select({ value: count() })
        .from(schema.event_signups)
        .where(
            and(
                eq(schema.event_signups.event_id, eventId),
                or(
                    eq(schema.event_signups.payment_status, 'paid'),
                    and(
                        eq(schema.event_signups.payment_status, 'open'),
                        sql`${schema.event_signups.created_at} >= NOW() - (${pendingWindowMinutes} || ' minutes')::interval`
                    )
                )
            )
        );

    return result[0]?.value ?? 0;
}

export type EventSignupDbRow = typeof schema.event_signups.$inferSelect;
export type EventDbRow = typeof schema.events.$inferSelect;

export type EventSignupWithEvent = EventSignupDbRow & {
    event: EventDbRow | null;
};

export async function deleteEventDb(id: number): Promise<boolean> {
    const result = await db.delete(schema.events).where(eq(schema.events.id, id));
    return result.count > 0;
}

export async function createEventSignupDb(data: Partial<EventSignup>): Promise<number | null> {
    const eventIdNum = Number(data.event_id);
    const result = await db.insert(schema.event_signups).values({
        event_id: eventIdNum,
        participant_name: data.participant_name || null,
        participant_email: data.participant_email || null,
        participant_phone: data.participant_phone || null,
        payment_status: data.payment_status || 'open',
        qr_token: data.qr_token || null,
        directus_relations: typeof data.directus_relations === 'string' ? data.directus_relations : null,
        checked_in: !!data.checked_in,
        checked_in_at: data.checked_in_at || null,
        is_member: !!data.is_member
    }).returning({ id: schema.event_signups.id });

    return result[0]?.id ?? null;
}

export async function updateEventSignupDb(id: number, data: Partial<EventSignup>): Promise<boolean> {
    const updateData: Partial<typeof schema.event_signups.$inferInsert> = {};
    if (data.payment_status !== undefined) updateData.payment_status = data.payment_status;
    if (data.checked_in !== undefined) updateData.checked_in = data.checked_in;
    if (data.checked_in_at !== undefined) updateData.checked_in_at = data.checked_in_at;
    if (data.participant_name !== undefined) updateData.participant_name = data.participant_name;
    if (data.participant_email !== undefined) updateData.participant_email = data.participant_email;
    if (data.participant_phone !== undefined) updateData.participant_phone = data.participant_phone;
    if (data.is_member !== undefined) updateData.is_member = data.is_member;

    if (Object.keys(updateData).length === 0) return true;

    const result = await db.update(schema.event_signups)
        .set(updateData)
        .where(eq(schema.event_signups.id, id));
        
    return result.count > 0;
}

export async function deleteEventSignupDb(id: number): Promise<boolean> {
    const result = await db.delete(schema.event_signups).where(eq(schema.event_signups.id, id));
    return result.count > 0;
}

export async function fetchUserEventSignupsDb(email: string): Promise<EventSignupWithEvent[]> {
    const rows = await db.select({
        signup: schema.event_signups,
        event: schema.events
    })
    .from(schema.event_signups)
    .innerJoin(schema.events, eq(schema.event_signups.event_id, schema.events.id))
    .where(sql`LOWER(${schema.event_signups.participant_email}) = LOWER(${email})`)
    .orderBy(desc(schema.events.event_date));

    return rows.map((row): EventSignupWithEvent => ({
        ...row.signup,
        event: row.event
    }));
}

export async function fetchEventSignupByIdDb(id: number): Promise<EventSignupWithEvent | null> {
    const rows = await db.select({
        signup: schema.event_signups,
        event: schema.events
    })
    .from(schema.event_signups)
    .innerJoin(schema.events, eq(schema.event_signups.event_id, schema.events.id))
    .where(eq(schema.event_signups.id, id))
    .limit(1);

    if (rows.length === 0) return null;

    return {
        ...rows[0].signup,
        event: rows[0].event
    };
}

export async function fetchEventSignupByTokenDb(token: string): Promise<EventSignupWithEvent | null> {
    const rows = await db.select({
        signup: schema.event_signups,
        event: schema.events
    })
    .from(schema.event_signups)
    .innerJoin(schema.events, eq(schema.event_signups.event_id, schema.events.id))
    .where(eq(schema.event_signups.qr_token, token))
    .limit(1);

    if (rows.length === 0) return null;

    return {
        ...rows[0].signup,
        event: rows[0].event
    };
}