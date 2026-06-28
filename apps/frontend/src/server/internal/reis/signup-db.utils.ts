import 'server-only';
import { query } from '@/lib/database';
import { buildUpdateQuery } from '@/lib/database/query-builder';
import {
    reisTripSignupSchema,
    type ReisTripSignup
} from '@salvemundi/validations/schema/trip.zod';
import { z } from 'zod';
import { TripSignup as TripSignup, TripSignupActivity as TripSignupActivity } from '@salvemundi/validations/directus/schema';
import { RawTripSignupRow, RawTripSignupActivityRow, QueryParam } from './types';
import { toLocalISOString } from '@/lib/utils/date-utils';

export async function fetchUserSignupStatusDb(userIdOrEmail: string, tripId: number): Promise<ReisTripSignup | null> {
    if (!userIdOrEmail || userIdOrEmail === '') return null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdOrEmail);
    const res = await query(
        `SELECT * FROM trip_signups 
         WHERE (${isUuid ? 'directus_relations' : 'email'} = $1) 
         AND trip_id = $2 AND status != 'cancelled' 
         LIMIT 1`,
        [userIdOrEmail, tripId]
    );

    if (res.rowCount === 0) return null;

    const raw = res.rows[0] as RawTripSignupRow;
    const sanitized = {
        ...raw,
        date_of_birth: toLocalISOString(raw.date_of_birth),
        document_expiry_date: toLocalISOString(raw.document_expiry_date),
        date_created: raw.created_at instanceof Date ? raw.created_at.toISOString() : (raw.created_at ? new Date(raw.created_at).toISOString() : new Date().toISOString()),
        created_at: raw.created_at instanceof Date ? raw.created_at.toISOString() : (raw.created_at ? new Date(raw.created_at).toISOString() : new Date().toISOString()),
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
    const res = await query(
        `SELECT * FROM trip_signups 
         WHERE trip_id = $1 
         ORDER BY id DESC`,
        [tripId]
    );

    const sanitized = (res.rows as RawTripSignupRow[]).map((raw) => ({
        ...raw,
        date_of_birth: toLocalISOString(raw.date_of_birth),
        document_expiry_date: toLocalISOString(raw.document_expiry_date),
        date_created: raw.created_at instanceof Date ? raw.created_at.toISOString() : (raw.created_at ? new Date(raw.created_at).toISOString() : new Date().toISOString()),
        created_at: raw.created_at instanceof Date ? raw.created_at.toISOString() : (raw.created_at ? new Date(raw.created_at).toISOString() : new Date().toISOString()),
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
    const res = await query(
        `SELECT * FROM trip_signups WHERE id = $1 LIMIT 1`,
        [signupId]
    );

    if (res.rowCount === 0) return null;

    const raw = res.rows[0] as RawTripSignupRow;
    const sanitized = {
        ...raw,
        date_of_birth: toLocalISOString(raw.date_of_birth),
        document_expiry_date: toLocalISOString(raw.document_expiry_date),
        date_created: raw.created_at instanceof Date ? raw.created_at.toISOString() : (raw.created_at ? new Date(raw.created_at).toISOString() : new Date().toISOString()),
        created_at: raw.created_at instanceof Date ? raw.created_at.toISOString() : (raw.created_at ? new Date(raw.created_at).toISOString() : new Date().toISOString()),
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
    const res = await query(
        `SELECT sa.*, a.name as activity_name, a.price as activity_price, a.options as activity_options,
                ts.first_name, ts.last_name, ts.email
         FROM trip_signup_activities sa
         JOIN trip_activities a ON sa.trip_activity_id = a.id
         JOIN trip_signups ts ON sa.trip_signup_id = ts.id
         WHERE a.trip_id = $1`,
        [tripId]
    );
    return (res.rows as RawTripSignupActivityRow[]).map((row) => ({
        ...row,
        trip_signup_id: {
            id: row.trip_signup_id,
            first_name: row.first_name ?? '',
            last_name: row.last_name ?? '',
            email: row.email ?? ''
        }
    } as unknown as TripSignupActivity & { activity_name: string; activity_price: number; activity_options: unknown; first_name: string; last_name: string; email: string }));
}

export async function fetchSelectedSignupActivitiesDb(signupId: number): Promise<TripSignupActivity[]> {
    const { rows } = await query<TripSignupActivity>(
        'SELECT * FROM trip_signup_activities WHERE trip_signup_id = $1',
        [signupId]
    );
    return rows;
}

export async function insertTripSignupDb(payload: Partial<TripSignup>): Promise<number | null> {
    const fields = Object.keys(payload);
    const values = Object.values(payload);
    const placeHolders = fields.map((_, i) => `$${i + 1}`).join(', ');

    const res = await query<{ id: number }>(
        `INSERT INTO trip_signups (${fields.join(', ')}) VALUES (${placeHolders}) RETURNING id`,
        values as QueryParam[]
    );
    return res.rows[0]?.id ?? null;
}

export async function updateTripSignupDb(id: number, data: Partial<TripSignup>): Promise<boolean> {
    const builder = buildUpdateQuery('trip_signups', id, data);
    if (!builder) return true;

    await query(builder.sql, builder.params as QueryParam[]);
    return true;
}

export async function deleteTripSignupDb(id: number): Promise<boolean> {
    await query(`DELETE FROM trip_signups WHERE id = $1`, [id]);
    return true;
}