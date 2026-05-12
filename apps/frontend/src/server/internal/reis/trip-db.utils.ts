'use server';

import 'server-only';
import { query } from '@/lib/database';
import { buildUpdateQuery } from '@/lib/database/query-builder';
import { toLocalISOString } from '@/lib/utils/date-utils';
import { DbTrip as Trip } from '@salvemundi/validations/directus/schema';
import { RawTripRow, QueryParam } from './types';

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
