'use server';

import 'server-only';
import { query } from '@/lib/database';
import { buildUpdateQuery } from '@/lib/database/query-builder';
import {
    reisTripSignupSchema,
    type ReisTripSignup
} from '@salvemundi/validations/schema/reis.zod';
import { z } from 'zod';
import { toLocalISOString } from '@/lib/utils/date-utils';
import { DbTripSignup as TripSignup, DbTrip as Trip, DbTripActivitie as TripActivity, DbTripSignupActivitie as TripSignupActivity } from '@salvemundi/validations/directus/schema';

type QueryParam = string | number | boolean | object | null | undefined;

type DbRow = Record<string, unknown>;

interface RawTripSignupRow extends DbRow {
    id: number;
    trip_id: number;
    email: string;
    date_of_birth?: string | Date | null;
    document_expiry_date?: string | Date | null;
    created_at?: string | Date;
    deposit_paid?: boolean | null;
    full_payment_paid?: boolean | null;
    willing_to_drive?: boolean | null;
    role?: string | null;
    status?: string | null;
}

interface RawTripActivityRow extends DbRow {
    id: number;
    trip_id: number;
    name: string;
    price?: string | number | null;
    display_order?: string | number | null;
    max_participants?: string | number | null;
    max_selections?: string | number | null;
}

interface RawTripRow extends DbRow {
    id: number;
    name: string;
    max_participants?: string | number | null;
    max_crew?: string | number | null;
    base_price?: string | number | null;
    crew_discount?: string | number | null;
    deposit_amount?: string | number | null;
    registration_open?: boolean | null;
    is_bus_trip?: boolean | null;
    allow_final_payments?: boolean | null;
    start_date?: string | Date | null;
    end_date?: string | Date | null;
    registration_start_date?: string | Date | null;
}

interface RawTripSignupActivityRow extends DbRow {
    id: number;
    trip_signup_id: number;
    trip_activity_id: number;
    selected_options?: unknown;
    activity_name?: string;
    activity_price?: string | number | null;
    activity_options?: unknown;
    first_name?: string;
    last_name?: string;
    email?: string;
    signup_id?: number;
}

/**
 * Fetches the registration status for a specific user and trip directly from the database to bypass caching.
 * @param userIdOrEmail The BetterAuth user ID or Email
 * @param tripId The trip ID
 */
export async function fetchUserSignupStatusDb(userIdOrEmail: string, tripId: number): Promise<ReisTripSignup | null> {
    if (!userIdOrEmail || userIdOrEmail === '') return null;
    try {
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
        // Ensure all required fields for ReisTripSignup are present and correctly typed
        const sanitized = {
            ...raw,
            date_of_birth: raw.date_of_birth instanceof Date ? raw.date_of_birth.toISOString() : String(raw.date_of_birth),
            document_expiry_date: raw.document_expiry_date instanceof Date ? raw.document_expiry_date.toISOString() : String(raw.document_expiry_date),
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
    } catch (_error) {
        return null;
    }
}

/**
 * Fetches all signups for a specific trip directly from the database for the admin dashboard.
 * @param tripId The trip ID
 */
export async function fetchAllTripSignupsDb(tripId: number): Promise<ReisTripSignup[]> {
    try {
        const res = await query(
            `SELECT * FROM trip_signups 
             WHERE trip_id = $1 
             ORDER BY id DESC`,
            [tripId]
        );

        const sanitized = (res.rows as RawTripSignupRow[]).map((raw) => ({
            ...raw,
            date_of_birth: raw.date_of_birth instanceof Date ? raw.date_of_birth.toISOString() : String(raw.date_of_birth),
            document_expiry_date: raw.document_expiry_date instanceof Date ? raw.document_expiry_date.toISOString() : String(raw.document_expiry_date),
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
    } catch (_error) {
        return [];
    }
}

/**
 * Fetches a single signup by ID directly from the database.
 */
export async function fetchTripSignupByIdDb(signupId: number): Promise<ReisTripSignup | null> {
    try {
        const res = await query(
            `SELECT * FROM trip_signups WHERE id = $1 LIMIT 1`,
            [signupId]
        );

        if (res.rowCount === 0) return null;

        const raw = res.rows[0] as RawTripSignupRow;
        const sanitized = {
            ...raw,
            date_of_birth: raw.date_of_birth instanceof Date ? raw.date_of_birth.toISOString() : String(raw.date_of_birth),
            document_expiry_date: raw.document_expiry_date instanceof Date ? raw.document_expiry_date.toISOString() : String(raw.document_expiry_date),
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
    } catch (_error) {
        return null;
    }
}

/**
 * Fetches activity selections for a specific trip directly from the database.
 */
export async function fetchTripSignupActivitiesDb(tripId: number): Promise<(TripSignupActivity & { activity_name: string; activity_price: number; activity_options: unknown; first_name: string; last_name: string; email: string })[]> {
    try {
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
    } catch (_error) {
        return [];
    }
}

/**
 * Fetches all signups for a specific activity.
 */
export async function fetchSignupsByActivityIdDb(activityId: number): Promise<{ id: number; selected_options: unknown; trip_signup_id: { id: number; first_name: string; last_name: string; email: string } }[]> {
    try {
        const { rows } = await query(
            `SELECT sa.id, sa.selected_options, 
                    ts.id as signup_id, ts.first_name, ts.last_name, ts.email
             FROM trip_signup_activities sa
             JOIN trip_signups ts ON sa.trip_signup_id = ts.id
             WHERE sa.trip_activity_id = $1`,
            [activityId]
        );
        return (rows as RawTripSignupActivityRow[]).map(row => ({
            id: row.id,
            selected_options: row.selected_options,
            trip_signup_id: {
                id: row.signup_id ?? 0,
                first_name: row.first_name ?? '',
                last_name: row.last_name ?? '',
                email: row.email ?? ''
            }
        }));
    } catch (_error) {
        return [];
    }
}

/**
 * Fetches all trips with full details directly from the database for management.
 */
export async function fetchFullTripsDb(): Promise<Trip[]> {
    try {
        const res = await query(
            `SELECT * FROM trips ORDER BY start_date DESC`,
            []
        );
        return (res.rows as RawTripRow[]).map(t => ({
            ...t,
            max_participants: t.max_participants != null ? Number(t.max_participants) : 0,
            max_crew: t.max_crew != null ? Number(t.max_crew) : 0,
            base_price: t.base_price != null ? Number(t.base_price) : 0,
            crew_discount: t.crew_discount != null ? Number(t.crew_discount) : 0,
            deposit_amount: t.deposit_amount != null ? Number(t.deposit_amount) : 0,
            registration_open: !!t.registration_open,
            is_bus_trip: !!t.is_bus_trip,
            allow_final_payments: !!t.allow_final_payments,
            start_date: toLocalISOString(t.start_date),
            end_date: toLocalISOString(t.end_date),
            registration_start_date: toLocalISOString(t.registration_start_date, true)
        } as unknown as Trip));
    } catch (_error) {
        return [];
    }
}

/**
 * Fetches all activities for a specific trip directly from the database.
 */
export async function fetchTripActivitiesByTripIdDb(tripId: number): Promise<TripActivity[]> {
    try {
        const res = await query(
            `SELECT * FROM trip_activities WHERE trip_id = $1 ORDER BY display_order ASC, name ASC`,
            [tripId]
        );
        return (res.rows as RawTripActivityRow[]).map(a => ({
            ...a,
            price: a.price != null ? Number(a.price) : 0,
            display_order: a.display_order != null ? Number(a.display_order) : 0,
            max_participants: a.max_participants != null ? Number(a.max_participants) : null,
            max_selections: a.max_selections != null ? Number(a.max_selections) : null
        } as unknown as TripActivity));
    } catch (_error) {
        return [];
    }
}

/**
 * Fetches all trips directly from the database for the admin selector (summary version).
 */
export async function fetchAllTripsDb(): Promise<Pick<Trip, 'id' | 'name' | 'start_date' | 'end_date' | 'allow_final_payments' | 'is_bus_trip'>[]> {
    try {
        const res = await query(
            `SELECT id, name, start_date, end_date, allow_final_payments, is_bus_trip 
             FROM trips 
             ORDER BY start_date DESC`,
            []
        );
        return (res.rows as RawTripRow[]).map(t => ({
            id: t.id,
            name: t.name,
            start_date: toLocalISOString(t.start_date),
            end_date: toLocalISOString(t.end_date),
            is_bus_trip: !!t.is_bus_trip,
            allow_final_payments: !!t.allow_final_payments
        } as Pick<Trip, 'id' | 'name' | 'start_date' | 'end_date' | 'allow_final_payments' | 'is_bus_trip'>));
    } catch (_error) {
        return [];
    }
}

/**
 * Fetches selected activities for a specific registration.
 */
export async function fetchSelectedSignupActivitiesDb(signupId: number): Promise<TripSignupActivity[]> {
    try {
        const { rows } = await query(
            'SELECT * FROM trip_signup_activities WHERE trip_signup_id = $1',
            [signupId]
        );
        return (rows as unknown as TripSignupActivity[]) || [];
    } catch (_error) {
        return [];
    }
}

/**
 * Fetches a single trip by ID.
 */
export async function fetchTripByIdDb(tripId: number): Promise<Trip | null> {
    try {
        const { rows } = await query(
            'SELECT * FROM trips WHERE id = $1 LIMIT 1',
            [tripId]
        );
        if (!rows || rows.length === 0) return null;

        const t = rows[0] as RawTripRow;
        return {
            ...t,
            max_participants: t.max_participants != null ? Number(t.max_participants) : 0,
            max_crew: t.max_crew != null ? Number(t.max_crew) : 0,
            base_price: t.base_price != null ? Number(t.base_price) : 0,
            crew_discount: t.crew_discount != null ? Number(t.crew_discount) : 0,
            deposit_amount: t.deposit_amount != null ? Number(t.deposit_amount) : 0,
            registration_open: !!t.registration_open,
            is_bus_trip: !!t.is_bus_trip,
            allow_final_payments: !!t.allow_final_payments,
            start_date: toLocalISOString(t.start_date),
            end_date: toLocalISOString(t.end_date),
            registration_start_date: toLocalISOString(t.registration_start_date, true)
        } as unknown as Trip;
    } catch (_error) {
        return null;
    }
}

/**
 * Updates a trip's basic information directly in the database.
 */
export async function updateTripDb(id: number, data: Partial<Trip>): Promise<boolean> {
    try {
        const builder = buildUpdateQuery('trips', id, data);
        if (!builder) return true;

        await query(builder.sql, builder.params as QueryParam[]);
        return true;
    } catch (_error) {
        return false;
    }
}

/**
 * Creates a new trip signup directly in the database.
 */
export async function insertTripSignupDb(payload: Partial<TripSignup>): Promise<number | null> {
    try {
        const fields = Object.keys(payload);
        const values = Object.values(payload);
        const placeHolders = fields.map((_, i) => `$${i + 1}`).join(', ');

        const res = await query(
            `INSERT INTO trip_signups (${fields.join(', ')}) VALUES (${placeHolders}) RETURNING id`,
            values as QueryParam[]
        );
        return res.rows[0]?.id || null;
    } catch (_error) {
        return null;
    }
}

/**
 * Updates a trip signup directly in the database.
 */
export async function updateTripSignupDb(id: number, data: Partial<TripSignup>): Promise<boolean> {
    try {
        const builder = buildUpdateQuery('trip_signups', id, data);
        if (!builder) return true;

        await query(builder.sql, builder.params as QueryParam[]);
        return true;
    } catch (_error) {
        return false;
    }
}

/**
 * Deletes a trip signup directly from the database.
 */
export async function deleteTripSignupDb(id: number): Promise<boolean> {
    try {
        await query(`DELETE FROM trip_signups WHERE id = $1`, [id]);
        return true;
    } catch (_error) {
        return false;
    }
}

/**
 * Creates a new trip directly in the database.
 */
export async function createTripDb(data: Partial<Trip>): Promise<number | null> {
    try {
        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeHolders = fields.map((_, i) => `$${i + 1}`).join(', ');

        const res = await query(
            `INSERT INTO trips (${fields.join(', ')}) VALUES (${placeHolders}) RETURNING id`,
            values as QueryParam[]
        );
        return res.rows[0]?.id || null;
    } catch (_error) {
        return null;
    }
}

/**
 * Fetches all published or recently completed trips directly from the database.
 */
export async function fetchPublicTripsDb(): Promise<Trip[]> {
    try {
        const res = await query(
            `SELECT * FROM trips 
             WHERE (status = 'published' OR status IS NULL)
             AND (end_date >= CURRENT_DATE OR end_date IS NULL)
             ORDER BY start_date ASC`,
            []
        );
        return (res.rows as RawTripRow[]).map(t => ({
            ...t,
            max_participants: t.max_participants != null ? Number(t.max_participants) : 0,
            max_crew: t.max_crew != null ? Number(t.max_crew) : 0,
            base_price: t.base_price != null ? Number(t.base_price) : 0,
            crew_discount: t.crew_discount != null ? Number(t.crew_discount) : 0,
            deposit_amount: t.deposit_amount != null ? Number(t.deposit_amount) : 0,
            registration_open: !!t.registration_open,
            is_bus_trip: !!t.is_bus_trip,
            allow_final_payments: !!t.allow_final_payments,
            start_date: toLocalISOString(t.start_date),
            end_date: toLocalISOString(t.end_date),
            registration_start_date: toLocalISOString(t.registration_start_date, true)
        } as unknown as Trip));
    } catch (_error) {
        return [];
    }
}

/**
 * Creates a new trip activity directly in the database.
 */
export async function createTripActivityDb(data: Partial<TripActivity>): Promise<number | null> {
    try {
        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeHolders = fields.map((_, i) => `$${i + 1}`).join(', ');

        const res = await query(
            `INSERT INTO trip_activities (${fields.join(', ')}) VALUES (${placeHolders}) RETURNING id`,
            values as QueryParam[]
        );
        return res.rows[0]?.id || null;
    } catch (_error) {
        return null;
    }
}

/**
 * Updates a trip activity directly in the database.
 */
export async function updateTripActivityDb(id: number, data: Partial<TripActivity>): Promise<boolean> {
    try {
        const builder = buildUpdateQuery('trip_activities', id, data);
        if (!builder) return true;

        await query(builder.sql, builder.params as QueryParam[]);
        return true;
    } catch (_error) {
        return false;
    }
}

/**
 * Deletes a trip activity directly from the database.
 */
export async function deleteTripActivityDb(id: number): Promise<boolean> {
    try {
        await query(`DELETE FROM trip_activities WHERE id = $1`, [id]);
        return true;
    } catch (_error) {
        return false;
    }
}