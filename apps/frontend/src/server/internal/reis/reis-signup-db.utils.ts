import 'server-only';
import { db, schema } from '@salvemundi/db';
import { eq, and, desc, ne } from 'drizzle-orm';
import type { TripSignup, TripSignupActivity } from '@salvemundi/validations/schema/trip.zod';
import { toLocalISOString } from '@/lib/utils/date-utils';

export type TripSignupActivityRow = typeof schema.trip_signup_activities.$inferSelect;

export type EnrichedTripSignupActivity = TripSignupActivityRow & {
    activity_name: string;
    activity_price: number;
    activity_options: unknown;
    first_name: string;
    last_name: string;
    email: string;
};

function sanitizeSignupRow(raw: typeof schema.trip_signups.$inferSelect): TripSignup {
    return {
        ...raw,
        first_name: raw.first_name || '',
        last_name: raw.last_name || '',
        email: raw.email || '',
        date_of_birth: raw.date_of_birth ? toLocalISOString(raw.date_of_birth) : null,
        document_expiry_date: raw.document_expiry_date ? toLocalISOString(raw.document_expiry_date) : null,
        created_at: raw.created_at ? new Date(raw.created_at).toISOString() : new Date().toISOString(),
        deposit_paid: !!raw.deposit_paid,
        full_payment_paid: !!raw.full_payment_paid,
        willing_to_drive: !!raw.willing_to_drive,
        role: raw.role,
        status: raw.status
    };
}

export async function fetchUserSignupStatusDb(userIdOrEmail: string, tripId: number): Promise<TripSignup | null> {
    if (!userIdOrEmail || userIdOrEmail === '') return null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdOrEmail);

    const condition = isUuid ? eq(schema.trip_signups.directus_relations, userIdOrEmail) : eq(schema.trip_signups.email, userIdOrEmail);
    const rows = await db.select().from(schema.trip_signups)
        .where(
            and(
                condition,
                eq(schema.trip_signups.trip_id, tripId),
                ne(schema.trip_signups.status, 'cancelled')
            )
        )
        .limit(1);

    if (rows.length === 0) return null;
    return sanitizeSignupRow(rows[0]);
}

export async function fetchAllTripSignupsDb(tripId: number): Promise<TripSignup[]> {
    const rows = await db.select().from(schema.trip_signups).where(eq(schema.trip_signups.trip_id, tripId)).orderBy(desc(schema.trip_signups.id));
    return rows.map(sanitizeSignupRow);
}

export async function fetchTripSignupByIdDb(signupId: number): Promise<TripSignup | null> {
    const rows = await db.select().from(schema.trip_signups).where(eq(schema.trip_signups.id, signupId)).limit(1);
    if (rows.length === 0) return null;
    return sanitizeSignupRow(rows[0]);
}

export async function fetchTripSignupActivitiesDb(tripId: number): Promise<TripSignupActivity[]> {
    const rows = await db.select({
        sa: schema.trip_signup_activities,
    })
    .from(schema.trip_signup_activities)
    .innerJoin(schema.trip_activities, eq(schema.trip_signup_activities.trip_activity_id, schema.trip_activities.id))
    .where(eq(schema.trip_activities.trip_id, tripId));

    return rows.map((row) => row.sa as TripSignupActivity);
}

export async function fetchSelectedSignupActivitiesDb(signupId: number): Promise<TripSignupActivityRow[]> {
    const rows = await db.select().from(schema.trip_signup_activities).where(eq(schema.trip_signup_activities.trip_signup_id, signupId));
    return rows;
}

export async function insertTripSignupDb(payload: Partial<TripSignup>): Promise<number | null> {
    const result = await db.insert(schema.trip_signups).values(payload as Partial<typeof schema.trip_signups.$inferInsert>).returning({ id: schema.trip_signups.id });
    return result[0]?.id ?? null;
}

export async function updateTripSignupDb(id: number, data: Partial<TripSignup>): Promise<boolean> {
    if (Object.keys(data).length === 0) return true;
    const result = await db.update(schema.trip_signups).set(data as Partial<typeof schema.trip_signups.$inferInsert>).where(eq(schema.trip_signups.id, id));
    return result.count > 0;
}

export async function deleteTripSignupDb(id: number): Promise<boolean> {
    const result = await db.delete(schema.trip_signups).where(eq(schema.trip_signups.id, id));
    return result.count > 0;
}