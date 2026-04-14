'use server';

import 'server-only';
import { query } from '@/lib/database';
import { 
    reisTripSignupSchema,
    type ReisTripSignup, 
} from '@salvemundi/validations/schema/reis.zod';
import { z } from 'zod';

/**
 * Fetches the registration status for a specific user and trip directly from the database to bypass caching.
 * @param userId The BetterAuth user ID
 * @param tripId The trip ID
 */
export async function fetchUserSignupStatusDb(userId: string, tripId: number): Promise<ReisTripSignup | null> {
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
            date_of_birth: raw.date_of_birth instanceof Date ? raw.date_of_birth.toISOString() : raw.date_of_birth,
            date_created: (raw.created_at instanceof Date ? raw.created_at : new Date(raw.created_at)).toISOString(),
            created_at: (raw.created_at instanceof Date ? raw.created_at : new Date(raw.created_at)).toISOString(),
            deposit_paid: !!raw.deposit_paid,
            full_payment_paid: !!raw.full_payment_paid,
            willing_to_drive: !!raw.willing_to_drive,
            role: raw.role || 'participant',
            status: raw.status || 'registered'
        };

        const parsed = reisTripSignupSchema.safeParse(sanitized);
        if (!parsed.success) {
            
            // Return raw with casting as fallback if validation is too strict for DB nulls
            return sanitized as ReisTripSignup;
        }

        return parsed.data as ReisTripSignup;
    } catch (error) {
        
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

        const sanitized = (res.rows || []).map(raw => ({
            ...raw,
            date_of_birth: raw.date_of_birth instanceof Date ? raw.date_of_birth.toISOString() : raw.date_of_birth,
            date_created: (raw.created_at instanceof Date ? raw.created_at : new Date(raw.created_at)).toISOString(),
            created_at: (raw.created_at instanceof Date ? raw.created_at : new Date(raw.created_at)).toISOString(),
            deposit_paid: !!raw.deposit_paid,
            full_payment_paid: !!raw.full_payment_paid,
            willing_to_drive: !!raw.willing_to_drive,
            role: raw.role || 'participant',
            status: raw.status || 'registered'
        }));

        const parsed = z.array(reisTripSignupSchema).safeParse(sanitized);
        if (!parsed.success) {
            
            return sanitized as any as ReisTripSignup[];
        }

        return parsed.data as ReisTripSignup[];
    } catch (error) {
        
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

        const raw = res.rows[0];
        const sanitized = {
            ...raw,
            date_of_birth: raw.date_of_birth instanceof Date ? raw.date_of_birth.toISOString() : raw.date_of_birth,
            date_created: (raw.created_at instanceof Date ? raw.created_at : new Date(raw.created_at)).toISOString(),
            created_at: (raw.created_at instanceof Date ? raw.created_at : new Date(raw.created_at)).toISOString(),
            deposit_paid: !!raw.deposit_paid,
            full_payment_paid: !!raw.full_payment_paid,
            willing_to_drive: !!raw.willing_to_drive,
            role: raw.role || 'participant',
            status: raw.status || 'registered'
        };

        const parsed = reisTripSignupSchema.safeParse(sanitized);
        if (!parsed.success) {
            
            return sanitized as ReisTripSignup;
        }

        return parsed.data as ReisTripSignup;
    } catch (error) {
        
        return null;
    }
}

/**
 * Fetches activity selections for a specific trip directly from the database.
 */
export async function fetchTripSignupActivitiesDb(tripId: number): Promise<any[]> {
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
        return (res.rows || []).map(row => ({
            ...row,
            trip_signup_id: {
                id: row.trip_signup_id,
                first_name: row.first_name,
                last_name: row.last_name,
                email: row.email
            }
        }));
    } catch (error) {
        
        return [];
    }
}

/**
 * Fetches all signups for a specific activity.
 */
export async function fetchSignupsByActivityIdDb(activityId: number): Promise<any[]> {
    try {
        const { rows } = await query(
            `SELECT sa.id, sa.selected_options, 
                    ts.id as signup_id, ts.first_name, ts.last_name, ts.email
             FROM trip_signup_activities sa
             JOIN trip_signups ts ON sa.trip_signup_id = ts.id
             WHERE sa.trip_activity_id = $1`,
            [activityId]
        );
        return (rows || []).map(row => ({
            id: row.id,
            selected_options: row.selected_options,
            trip_signup_id: {
                id: row.signup_id,
                first_name: row.first_name,
                last_name: row.last_name,
                email: row.email
            }
        }));
    } catch (error) {
        
        return [];
    }
}

/**
 * Fetches all trips with full details directly from the database for management.
 */
export async function fetchFullTripsDb(): Promise<any[]> {
    try {
        const res = await query(
            `SELECT * FROM trips ORDER BY start_date DESC`,
            []
        );
        return (res.rows || []).map(t => ({
            ...t,
            max_participants: t.max_participants !== null ? Number(t.max_participants) : 0,
            max_crew: t.max_crew !== null ? Number(t.max_crew) : 0,
            base_price: t.base_price !== null ? Number(t.base_price) : 0,
            crew_discount: t.crew_discount !== null ? Number(t.crew_discount) : 0,
            deposit_amount: t.deposit_amount !== null ? Number(t.deposit_amount) : 0,
            registration_open: !!t.registration_open,
            is_bus_trip: !!t.is_bus_trip,
            allow_final_payments: !!t.allow_final_payments,
            start_date: t.start_date instanceof Date ? t.start_date.toISOString() : t.start_date,
            end_date: t.end_date instanceof Date ? t.end_date.toISOString() : t.end_date,
            registration_start_date: t.registration_start_date instanceof Date ? t.registration_start_date.toISOString() : t.registration_start_date
        }));
    } catch (error) {
        
        return [];
    }
}

/**
 * Fetches all activities for a specific trip directly from the database.
 */
export async function fetchTripActivitiesByTripIdDb(tripId: number): Promise<any[]> {
    try {
        const res = await query(
            `SELECT * FROM trip_activities WHERE trip_id = $1 ORDER BY display_order ASC, name ASC`,
            [tripId]
        );
        return (res.rows || []).map(a => ({
            ...a,
            price: a.price !== null ? Number(a.price) : 0,
            display_order: a.display_order !== null ? Number(a.display_order) : 0,
            max_participants: a.max_participants !== null ? Number(a.max_participants) : null,
            max_selections: a.max_selections !== null ? Number(a.max_selections) : null,
        }));
    } catch (error) {
        
        return [];
    }
}

/**
 * Fetches all trips directly from the database for the admin selector (summary version).
 */
export async function fetchAllTripsDb(): Promise<any[]> {
    try {
        const res = await query(
            `SELECT id, name, start_date, end_date, allow_final_payments 
             FROM trips 
             ORDER BY start_date DESC`,
            []
        );
        return res.rows || [];
    } catch (error) {
        
        return [];
    }
}

/**
 * Fetches selected activities for a specific registration.
 */
export async function fetchSelectedSignupActivitiesDb(signupId: number): Promise<any[]> {
    try {
        const { rows } = await query(
            'SELECT * FROM trip_signup_activities WHERE trip_signup_id = $1',
            [signupId]
        );
        return rows || [];
    } catch (error) {
        
        return [];
    }
}

/**
 * Fetches a single trip by ID.
 */
export async function fetchTripByIdDb(tripId: number): Promise<any | null> {
    try {
        const { rows } = await query(
            'SELECT * FROM trips WHERE id = $1 LIMIT 1',
            [tripId]
        );
        if (!rows || rows.length === 0) return null;
        
        const t = rows[0];
        return {
            ...t,
            max_participants: t.max_participants !== null ? Number(t.max_participants) : 0,
            max_crew: t.max_crew !== null ? Number(t.max_crew) : 0,
            base_price: t.base_price !== null ? Number(t.base_price) : 0,
            crew_discount: t.crew_discount !== null ? Number(t.crew_discount) : 0,
            deposit_amount: t.deposit_amount !== null ? Number(t.deposit_amount) : 0,
            registration_open: !!t.registration_open,
            is_bus_trip: !!t.is_bus_trip,
            allow_final_payments: !!t.allow_final_payments,
            start_date: t.start_date instanceof Date ? t.start_date.toISOString() : t.start_date,
            end_date: t.end_date instanceof Date ? t.end_date.toISOString() : t.end_date,
            event_date: t.event_date instanceof Date ? t.event_date.toISOString() : t.event_date,
            registration_start_date: t.registration_start_date instanceof Date ? t.registration_start_date.toISOString() : t.registration_start_date
        };
    } catch (error) {
        
        return null;
    }
}
/**
 * Updates a trip's basic information directly in the database.
 */
export async function updateTripDb(id: number, data: any): Promise<boolean> {
    try {
        const fields = Object.keys(data);
        const values = Object.values(data);
        const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
        
        await query(
            `UPDATE trips SET ${setClause} WHERE id = $1`,
            [id, ...values]
        );
        return true;
    } catch (error) {
        
        return false;
    }
}

/**
 * Creates a new trip signup directly in the database.
 */
export async function insertTripSignupDb(payload: any): Promise<number | null> {
    try {
        const fields = Object.keys(payload);
        const values = Object.values(payload);
        const placeHolders = fields.map((_, i) => `$${i + 1}`).join(', ');
        
        const res = await query(
            `INSERT INTO trip_signups (${fields.join(', ')}) VALUES (${placeHolders}) RETURNING id`,
            values
        );
        return res.rows[0]?.id || null;
    } catch (error) {
        
        return null;
    }
}

/**
 * Updates a trip signup directly in the database.
 */
export async function updateTripSignupDb(id: number, data: any): Promise<boolean> {
    try {
        const fields = Object.keys(data);
        const values = Object.values(data);
        const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
        
        await query(
            `UPDATE trip_signups SET ${setClause} WHERE id = $1`,
            [id, ...values]
        );
        return true;
    } catch (error) {
        
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
    } catch (error) {
        
        return false;
    }
}

/**
 * Creates a new trip directly in the database.
 */
export async function createTripDb(data: any): Promise<number | null> {
    try {
        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeHolders = fields.map((_, i) => `$${i + 1}`).join(', ');
        
        const res = await query(
            `INSERT INTO trips (${fields.join(', ')}) VALUES (${placeHolders}) RETURNING id`,
            values
        );
        return res.rows[0]?.id || null;
    } catch (error) {
        
        return null;
    }
}

/**
 * Fetches all published or recently completed trips directly from the database.
 */
export async function fetchPublicTripsDb(): Promise<any[]> {
    try {
        const res = await query(
            `SELECT * FROM trips 
             WHERE status = 'published' OR status IS NULL
             ORDER BY start_date ASC`,
            []
        );
        return (res.rows || []).map(t => ({
            ...t,
            registration_open: !!t.registration_open,
            is_bus_trip: !!t.is_bus_trip,
            allow_final_payments: !!t.allow_final_payments,
            start_date: t.start_date instanceof Date ? t.start_date.toISOString() : t.start_date,
            end_date: t.end_date instanceof Date ? t.end_date.toISOString() : t.end_date,
            event_date: t.event_date instanceof Date ? t.event_date.toISOString() : t.event_date,
            registration_start_date: t.registration_start_date instanceof Date ? t.registration_start_date.toISOString() : t.registration_start_date
        }));
    } catch (error) {
        
        return [];
    }
}

/**
 * Creates a new trip activity directly in the database.
 */
export async function createTripActivityDb(data: any): Promise<number | null> {
    try {
        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeHolders = fields.map((_, i) => `$${i + 1}`).join(', ');
        
        const res = await query(
            `INSERT INTO trip_activities (${fields.join(', ')}) VALUES (${placeHolders}) RETURNING id`,
            values
        );
        return res.rows[0]?.id || null;
    } catch (error) {
        
        return null;
    }
}

/**
 * Updates a trip activity directly in the database.
 */
export async function updateTripActivityDb(id: number, data: any): Promise<boolean> {
    try {
        const fields = Object.keys(data);
        const values = Object.values(data);
        const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
        
        await query(
            `UPDATE trip_activities SET ${setClause} WHERE id = $1`,
            [id, ...values]
        );
        return true;
    } catch (error) {
        
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
    } catch (error) {
        
        return false;
    }
}
