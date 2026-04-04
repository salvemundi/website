'use server';

import 'server-only';
import { query } from '@/lib/db';
import { 
    reisTripSignupSchema,
    type ReisTripSignup, 
} from '@salvemundi/validations';
import { z } from 'zod';

/**
 * Fetches the registration status for a specific user and trip directly from the database to bypass caching.
 * @param userId The BetterAuth user ID
 * @param tripId The trip ID
 */
export async function fetchUserSignupStatusDb(userId: string, tripId: number): Promise<ReisTripSignup | null> {
    console.log(`[DB-DIRECT-FETCH] UserStatus userId: ${userId}, tripId: ${tripId}`);
    try {
        const res = await query(
            `SELECT * FROM trip_signups 
             WHERE directus_relations = $1 AND trip_id = $2 AND status != 'cancelled' 
             LIMIT 1`,
            [userId, tripId]
        );

        if (res.rowCount === 0) return null;

        const raw = res.rows[0];
        // Ensure all required fields for ReisTripSignup are present and correctly typed
        const sanitized = {
            ...raw,
            created_at: raw.created_at || new Date().toISOString(),
            deposit_paid: !!raw.deposit_paid,
            full_payment_paid: !!raw.full_payment_paid,
            willing_to_drive: !!raw.willing_to_drive,
            role: raw.role || 'participant',
            status: raw.status || 'registered'
        };

        const parsed = reisTripSignupSchema.safeParse(sanitized);
        if (!parsed.success) {
            console.error('[ReisDbUtils#fetchUserSignupStatusDb] Zod validation failed:', parsed.error.flatten().fieldErrors);
            // Return raw with casting as fallback if validation is too strict for DB nulls
            return sanitized as ReisTripSignup;
        }

        return parsed.data as ReisTripSignup;
    } catch (error) {
        console.error('[ReisDbUtils#fetchUserSignupStatusDb] Error:', error);
        return null;
    }
}

/**
 * Fetches all signups for a specific trip directly from the database for the admin dashboard.
 * @param tripId The trip ID
 */
export async function fetchAllTripSignupsDb(tripId: number): Promise<ReisTripSignup[]> {
    console.log(`[DB-DIRECT-FETCH] AllSignups tripId: ${tripId}`);
    try {
        const res = await query(
            `SELECT * FROM trip_signups 
             WHERE trip_id = $1 
             ORDER BY id DESC`,
            [tripId]
        );

        const sanitized = (res.rows || []).map(raw => ({
            ...raw,
            created_at: raw.created_at || new Date().toISOString(),
            deposit_paid: !!raw.deposit_paid,
            full_payment_paid: !!raw.full_payment_paid,
            willing_to_drive: !!raw.willing_to_drive,
            role: raw.role || 'participant',
            status: raw.status || 'registered'
        }));

        const parsed = z.array(reisTripSignupSchema).safeParse(sanitized);
        if (!parsed.success) {
            console.error('[ReisDbUtils#fetchAllTripSignupsDb] Zod validation failed:', parsed.error.flatten().fieldErrors);
            return sanitized as any as ReisTripSignup[];
        }

        return parsed.data as ReisTripSignup[];
    } catch (error) {
        console.error('[ReisDbUtils#fetchAllTripSignupsDb] Error:', error);
        return [];
    }
}

/**
 * Fetches a single signup by ID directly from the database.
 */
export async function fetchTripSignupByIdDb(signupId: number): Promise<ReisTripSignup | null> {
    console.log(`[DB-DIRECT-FETCH] TripSignupById id: ${signupId}`);
    try {
        const res = await query(
            `SELECT * FROM trip_signups WHERE id = $1 LIMIT 1`,
            [signupId]
        );

        if (res.rowCount === 0) return null;

        const raw = res.rows[0];
        const sanitized = {
            ...raw,
            created_at: raw.created_at || new Date().toISOString(),
            deposit_paid: !!raw.deposit_paid,
            full_payment_paid: !!raw.full_payment_paid,
            willing_to_drive: !!raw.willing_to_drive,
            role: raw.role || 'participant',
            status: raw.status || 'registered'
        };

        const parsed = reisTripSignupSchema.safeParse(sanitized);
        if (!parsed.success) {
            console.error('[ReisDbUtils#fetchTripSignupByIdDb] Zod validation failed:', parsed.error.flatten().fieldErrors);
            return sanitized as ReisTripSignup;
        }

        return parsed.data as ReisTripSignup;
    } catch (error) {
        console.error('[ReisDbUtils#fetchTripSignupByIdDb] Error:', error);
        return null;
    }
}

/**
 * Fetches activity selections for a specific trip directly from the database.
 */
export async function fetchTripSignupActivitiesDb(tripId: number): Promise<any[]> {
    console.log(`[DB-DIRECT-FETCH] SignupActivities tripId: ${tripId}`);
    try {
        const res = await query(
            `SELECT sa.*, a.name as activity_name, a.price as activity_price, a.options as activity_options 
             FROM trip_signup_activities sa
             JOIN trip_activities a ON sa.trip_activity_id = a.id
             WHERE a.trip_id = $1`,
            [tripId]
        );
        return res.rows || [];
    } catch (error) {
        console.error('[ReisDbUtils#fetchTripSignupActivitiesDb] Error:', error);
        return [];
    }
}

/**
 * Fetches all trips directly from the database for the admin selector.
 */
export async function fetchAllTripsDb(): Promise<any[]> {
    console.log(`[DB-DIRECT-FETCH] AllTrips`);
    try {
        const res = await query(
            `SELECT id, name, event_date, start_date, end_date, allow_final_payments 
             FROM trips 
             ORDER BY event_date DESC`,
            []
        );
        return res.rows || [];
    } catch (error) {
        console.error('[ReisDbUtils#fetchAllTripsDb] Error:', error);
        return [];
    }
}
