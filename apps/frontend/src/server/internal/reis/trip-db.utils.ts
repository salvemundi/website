import 'server-only';
import { query } from '@/lib/database';
import { toLocalISOString } from '@/lib/utils/date-utils';
import { DbTrip as Trip } from '@salvemundi/validations/directus/schema';
import { RawTripRow } from './types';

export async function fetchFullTripsDb(): Promise<Trip[]> {
    const res = await query<RawTripRow>(
        `SELECT * FROM trips ORDER BY start_date DESC`,
        []
    );
    return res.rows.map(t => ({
        ...t,
        max_participants: t.max_participants !== null ? Number(t.max_participants) : 0,
        max_crew: t.max_crew !== null ? Number(t.max_crew) : 0,
        base_price: t.base_price !== null ? Number(t.base_price) : 0,
        crew_discount: t.crew_discount !== null ? Number(t.crew_discount) : 0,
        deposit_amount: t.deposit_amount !== null ? Number(t.deposit_amount) : 0,
        registration_open: !!t.registration_open,
        is_bus_trip: !!t.is_bus_trip,
        allow_final_payments: !!t.allow_final_payments,
        start_date: toLocalISOString(t.start_date),
        end_date: toLocalISOString(t.end_date),
        registration_start_date: toLocalISOString(t.registration_start_date, true)
    } as unknown as Trip));
}

export async function fetchAllTripsDb(): Promise<Pick<Trip, 'id' | 'name' | 'start_date' | 'end_date' | 'allow_final_payments' | 'is_bus_trip'>[]> {
    const res = await query<Pick<RawTripRow, 'id' | 'name' | 'start_date' | 'end_date' | 'allow_final_payments' | 'is_bus_trip'>>(
        `SELECT id, name, start_date, end_date, allow_final_payments, is_bus_trip 
         FROM trips 
         ORDER BY start_date DESC`,
        []
    );
    return res.rows.map(t => ({
        id: t.id,
        name: t.name,
        start_date: toLocalISOString(t.start_date),
        end_date: toLocalISOString(t.end_date),
        is_bus_trip: !!t.is_bus_trip,
        allow_final_payments: !!t.allow_final_payments
    }));
}

export async function fetchTripByIdDb(tripId: number): Promise<Trip | null> {
    const { rows } = await query<RawTripRow>(
        'SELECT * FROM trips WHERE id = $1 LIMIT 1',
        [tripId]
    );
    if (rows.length === 0) return null;

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
        start_date: toLocalISOString(t.start_date),
        end_date: toLocalISOString(t.end_date),
        registration_start_date: toLocalISOString(t.registration_start_date, true)
    } as unknown as Trip;
}

export async function createTripDb(data: Partial<Trip>): Promise<number | null> {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeHolders = fields.map((_, i) => `$${i + 1}`).join(', ');

    const res = await query<{ id: number }>(
        `INSERT INTO trips (${fields.join(', ')}) VALUES (${placeHolders}) RETURNING id`,
        values
    );
    if (res.rows.length === 0) return null;
    return res.rows[0].id;
}

export async function updateTripDb(id: number, data: Partial<Trip>): Promise<boolean> {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');

    await query<never>(
        `UPDATE trips SET ${setClause} WHERE id = $1`,
        [id, ...values]
    );
    return true;
}

export async function deleteTripDb(id: number): Promise<boolean> {
    await query<never>(`DELETE FROM trips WHERE id = $1`, [id]);
    return true;
}

export async function fetchPublicTripsDb(): Promise<Trip[]> {
    const res = await query<RawTripRow>(
        `SELECT * FROM trips 
         WHERE (status = 'published' OR status IS NULL)
         AND (end_date >= CURRENT_DATE OR end_date IS NULL)
         ORDER BY start_date ASC`,
        []
    );
    return res.rows.map(t => ({
        ...t,
        max_participants: t.max_participants !== null ? Number(t.max_participants) : 0,
        max_crew: t.max_crew !== null ? Number(t.max_crew) : 0,
        base_price: t.base_price !== null ? Number(t.base_price) : 0,
        crew_discount: t.crew_discount !== null ? Number(t.crew_discount) : 0,
        deposit_amount: t.deposit_amount !== null ? Number(t.deposit_amount) : 0,
        registration_open: !!t.registration_open,
        is_bus_trip: !!t.is_bus_trip,
        allow_final_payments: !!t.allow_final_payments,
        start_date: toLocalISOString(t.start_date),
        end_date: toLocalISOString(t.end_date),
        registration_start_date: toLocalISOString(t.registration_start_date, true)
    } as unknown as Trip));
}