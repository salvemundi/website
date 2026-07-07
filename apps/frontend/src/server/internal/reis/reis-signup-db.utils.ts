import 'server-only';
import { db, schema } from '@salvemundi/db';
import { eq, and, desc, ne } from 'drizzle-orm';
import {
    reisTripSignupSchema,
    type ReisTripSignup
} from '@salvemundi/validations/schema/trip.zod';
import { z } from 'zod';
import { TripSignup as TripSignup, TripSignupActivity as TripSignupActivity } from '@salvemundi/validations/directus/schema';
import { toLocalISOString } from '@/lib/utils/date-utils';

export async function fetchUserSignupStatusDb(userIdOrEmail: string, tripId: number): Promise<ReisTripSignup | null> {
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

    const raw = rows[0];
    const sanitized = {
        ...raw,
        date_of_birth: raw.date_of_birth ? toLocalISOString(raw.date_of_birth) : null,
        document_expiry_date: raw.document_expiry_date ? toLocalISOString(raw.document_expiry_date) : null,
        date_created: raw.created_at ? new Date(raw.created_at).toISOString() : new Date().toISOString(),
        created_at: raw.created_at ? new Date(raw.created_at).toISOString() : new Date().toISOString(),
        deposit_paid: !!raw.deposit_paid,
        full_payment_paid: !!raw.full_payment_paid,
        willing_to_drive: !!raw.willing_to_drive,
        role: raw.role || 'participant',
        status: raw.status || 'registered'
    };

    const parsed = reisTripSignupSchema.safeParse(sanitized);
    if (!parsed.success) {
        return sanitized as unknown as ReisTripSignup;
    }

    return parsed.data as ReisTripSignup;
}

export async function fetchAllTripSignupsDb(tripId: number): Promise<ReisTripSignup[]> {
    const rows = await db.select().from(schema.trip_signups).where(eq(schema.trip_signups.trip_id, tripId)).orderBy(desc(schema.trip_signups.id));

    const sanitized = rows.map((raw) => ({
        ...raw,
        date_of_birth: raw.date_of_birth ? toLocalISOString(raw.date_of_birth) : null,
        document_expiry_date: raw.document_expiry_date ? toLocalISOString(raw.document_expiry_date) : null,
        date_created: raw.created_at ? new Date(raw.created_at).toISOString() : new Date().toISOString(),
        created_at: raw.created_at ? new Date(raw.created_at).toISOString() : new Date().toISOString(),
        deposit_paid: !!raw.deposit_paid,
        full_payment_paid: !!raw.full_payment_paid,
        willing_to_drive: !!raw.willing_to_drive,
        role: raw.role || 'participant',
        status: raw.status || 'registered'
    }));

    const parsed = z.array(reisTripSignupSchema).safeParse(sanitized);
    if (!parsed.success) {
        return sanitized as unknown as ReisTripSignup[];
    }

    return parsed.data as ReisTripSignup[];
}

export async function fetchTripSignupByIdDb(signupId: number): Promise<ReisTripSignup | null> {
    const rows = await db.select().from(schema.trip_signups).where(eq(schema.trip_signups.id, signupId)).limit(1);

    if (rows.length === 0) return null;

    const raw = rows[0];
    const sanitized = {
        ...raw,
        date_of_birth: raw.date_of_birth ? toLocalISOString(raw.date_of_birth) : null,
        document_expiry_date: raw.document_expiry_date ? toLocalISOString(raw.document_expiry_date) : null,
        date_created: raw.created_at ? new Date(raw.created_at).toISOString() : new Date().toISOString(),
        created_at: raw.created_at ? new Date(raw.created_at).toISOString() : new Date().toISOString(),
        deposit_paid: !!raw.deposit_paid,
        full_payment_paid: !!raw.full_payment_paid,
        willing_to_drive: !!raw.willing_to_drive,
        role: raw.role || 'participant',
        status: raw.status || 'registered'
    };

    const parsed = reisTripSignupSchema.safeParse(sanitized);
    if (!parsed.success) {
        return sanitized as unknown as ReisTripSignup;
    }

    return parsed.data as ReisTripSignup;
}

export async function fetchTripSignupActivitiesDb(tripId: number): Promise<(TripSignupActivity & { activity_name: string; activity_price: number; activity_options: unknown; first_name: string; last_name: string; email: string })[]> {
    const rows = await db.select({
        sa: schema.trip_signup_activities,
        a: schema.trip_activities,
        ts: schema.trip_signups
    })
    .from(schema.trip_signup_activities)
    .innerJoin(schema.trip_activities, eq(schema.trip_signup_activities.trip_activity_id, schema.trip_activities.id))
    .innerJoin(schema.trip_signups, eq(schema.trip_signup_activities.trip_signup_id, schema.trip_signups.id))
    .where(eq(schema.trip_activities.trip_id, tripId));

    return rows.map((row) => ({
        ...row.sa,
        activity_name: row.a.name,
        activity_price: row.a.price ? Number(row.a.price) : 0,
        activity_options: row.a.options,
        first_name: row.ts.first_name,
        last_name: row.ts.last_name,
        email: row.ts.email,
        trip_signup_id: {
            id: row.ts.id,
            first_name: row.ts.first_name ?? '',
            last_name: row.ts.last_name ?? '',
            email: row.ts.email ?? ''
        }
    } as unknown as TripSignupActivity & { activity_name: string; activity_price: number; activity_options: unknown; first_name: string; last_name: string; email: string }));
}

export async function fetchSelectedSignupActivitiesDb(signupId: number): Promise<TripSignupActivity[]> {
    const rows = await db.select().from(schema.trip_signup_activities).where(eq(schema.trip_signup_activities.trip_signup_id, signupId));
    return rows as unknown as TripSignupActivity[];
}

export async function insertTripSignupDb(payload: Partial<TripSignup>): Promise<number | null> {
    const result = await db.insert(schema.trip_signups).values(payload as NonNullable<unknown>).returning({ id: schema.trip_signups.id });
    return result[0]?.id ?? null;
}

export async function updateTripSignupDb(id: number, data: Partial<TripSignup>): Promise<boolean> {
    if (Object.keys(data).length === 0) return true;
    const result = await db.update(schema.trip_signups).set(data as NonNullable<unknown>).where(eq(schema.trip_signups.id, id));
    return result.count > 0;
}

export async function deleteTripSignupDb(id: number): Promise<boolean> {
    const result = await db.delete(schema.trip_signups).where(eq(schema.trip_signups.id, id));
    return result.count > 0;
}