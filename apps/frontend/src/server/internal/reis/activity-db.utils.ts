import 'server-only';
import { query } from '@/lib/database';
import { buildUpdateQuery } from '@/lib/database/query-builder';
import { DbTripActivitie as TripActivity } from '@salvemundi/validations/directus/schema';
import { RawTripActivityRow, QueryParam } from './types';

export async function fetchTripActivitiesByTripIdDb(tripId: number): Promise<TripActivity[]> {
    const res = await query(
        `SELECT * FROM trip_activities WHERE trip_id = $1 ORDER BY display_order ASC, name ASC`,
        [tripId]
    );
    return (res.rows as RawTripActivityRow[]).map(a => ({
        ...a,
        price: a.price !== null && a.price !== undefined ? Number(a.price) : 0,
        display_order: a.display_order !== null && a.display_order !== undefined ? Number(a.display_order) : 0,
        max_participants: a.max_participants !== null && a.max_participants !== undefined ? Number(a.max_participants) : null,
        max_selections: a.max_selections !== null && a.max_selections !== undefined ? Number(a.max_selections) : null
    } as unknown as TripActivity));
}

export async function createTripActivityDb(data: Partial<TripActivity>): Promise<number | null> {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeHolders = fields.map((_, i) => `$${i + 1}`).join(', ');

    const res = await query<{ id: number }>(
        `INSERT INTO trip_activities (${fields.join(', ')}) VALUES (${placeHolders}) RETURNING id`,
        values as QueryParam[]
    );
    return res.rows[0]?.id ?? null;
}

export async function updateTripActivityDb(id: number, data: Partial<TripActivity>): Promise<boolean> {
    const builder = buildUpdateQuery('trip_activities', id, data);
    if (!builder) return true;

    await query(builder.sql, builder.params as QueryParam[]);
    return true;
}

export async function deleteTripActivityDb(id: number): Promise<boolean> {
    await query(`DELETE FROM trip_activities WHERE id = $1`, [id]);
    return true;
}