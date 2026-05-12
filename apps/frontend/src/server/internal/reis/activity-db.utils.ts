'use server';

import 'server-only';
import { query } from '@/lib/database';
import { buildUpdateQuery } from '@/lib/database/query-builder';
import { DbTripActivitie as TripActivity } from '@salvemundi/validations/directus/schema';
import { RawTripActivityRow, QueryParam } from './types';

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
