import 'server-only';
import { db, schema } from '@salvemundi/db';
import { eq, or, and, isNull, gte, desc, asc, sql } from 'drizzle-orm';
import { toLocalISOString } from '@/lib/utils/date-utils';
import { Trip as Trip } from '@salvemundi/validations/directus/schema';

export async function fetchFullTripsDb(): Promise<Trip[]> {
    const rows = await db.select().from(schema.trips).orderBy(desc(schema.trips.start_date));
    return rows.map(t => ({
        ...t,
        max_participants: t.max_participants !== null ? Number(t.max_participants) : 0,
        max_crew: t.max_crew !== null ? Number(t.max_crew) : 0,
        base_price: t.base_price !== null ? String(t.base_price) : "0",
        crew_discount: t.crew_discount !== null ? String(t.crew_discount) : "0",
        deposit_amount: t.deposit_amount !== null ? String(t.deposit_amount) : "0",
        registration_open: !!t.registration_open,
        is_bus_trip: !!t.is_bus_trip,
        allow_final_payments: !!t.allow_final_payments,
        start_date: toLocalISOString(t.start_date),
        end_date: toLocalISOString(t.end_date),
        registration_start_date: toLocalISOString(t.registration_start_date, true)
    } as unknown as Trip));
}

export async function fetchAllTripsDb(): Promise<Pick<Trip, 'id' | 'name' | 'start_date' | 'end_date' | 'allow_final_payments' | 'is_bus_trip'>[]> {
    const rows = await db.select({
        id: schema.trips.id,
        name: schema.trips.name,
        start_date: schema.trips.start_date,
        end_date: schema.trips.end_date,
        allow_final_payments: schema.trips.allow_final_payments,
        is_bus_trip: schema.trips.is_bus_trip
    })
    .from(schema.trips)
    .orderBy(desc(schema.trips.start_date));

    return rows.map(t => ({
        id: t.id,
        name: t.name || '',
        start_date: toLocalISOString(t.start_date) || '',
        end_date: toLocalISOString(t.end_date) || '',
        is_bus_trip: !!t.is_bus_trip,
        allow_final_payments: !!t.allow_final_payments
    }));
}

export async function fetchTripByIdDb(tripId: number): Promise<Trip | null> {
    const rows = await db.select().from(schema.trips).where(eq(schema.trips.id, tripId)).limit(1);
    if (rows.length === 0) return null;

    const t = rows[0];
    return {
        ...t,
        max_participants: t.max_participants !== null ? Number(t.max_participants) : 0,
        max_crew: t.max_crew !== null ? Number(t.max_crew) : 0,
        base_price: t.base_price !== null ? String(t.base_price) : "0",
        crew_discount: t.crew_discount !== null ? String(t.crew_discount) : "0",
        deposit_amount: t.deposit_amount !== null ? String(t.deposit_amount) : "0",
        registration_open: !!t.registration_open,
        is_bus_trip: !!t.is_bus_trip,
        allow_final_payments: !!t.allow_final_payments,
        start_date: toLocalISOString(t.start_date),
        end_date: toLocalISOString(t.end_date),
        registration_start_date: toLocalISOString(t.registration_start_date, true)
    } as unknown as Trip;
}

export async function createTripDb(data: Partial<Trip>): Promise<number | null> {
    const result = await db.insert(schema.trips).values(data as NonNullable<unknown>).returning({ id: schema.trips.id });
    if (result.length === 0) return null;
    return result[0].id;
}

export async function updateTripDb(id: number, data: Partial<Trip>): Promise<boolean> {
    if (Object.keys(data).length === 0) return true;
    const result = await db.update(schema.trips).set(data as NonNullable<unknown>).where(eq(schema.trips.id, id));
    return result.count > 0;
}

export async function deleteTripDb(id: number): Promise<boolean> {
    const result = await db.delete(schema.trips).where(eq(schema.trips.id, id));
    return result.count > 0;
}

export async function fetchPublicTripsDb(): Promise<Trip[]> {
    const rows = await db.select()
        .from(schema.trips)
        .where(
            and(
                or(eq(schema.trips.status, 'published'), isNull(schema.trips.status)),
                or(gte(schema.trips.end_date, sql`CURRENT_DATE`), isNull(schema.trips.end_date))
            )
        )
        .orderBy(asc(schema.trips.start_date));

    return rows.map(t => ({
        ...t,
        max_participants: t.max_participants !== null ? Number(t.max_participants) : 0,
        max_crew: t.max_crew !== null ? Number(t.max_crew) : 0,
        base_price: t.base_price !== null ? String(t.base_price) : "0",
        crew_discount: t.crew_discount !== null ? String(t.crew_discount) : "0",
        deposit_amount: t.deposit_amount !== null ? String(t.deposit_amount) : "0",
        registration_open: !!t.registration_open,
        is_bus_trip: !!t.is_bus_trip,
        allow_final_payments: !!t.allow_final_payments,
        start_date: toLocalISOString(t.start_date),
        end_date: toLocalISOString(t.end_date),
        registration_start_date: toLocalISOString(t.registration_start_date, true)
    } as unknown as Trip));
}