import 'server-only';
import { db, schema } from '@salvemundi/db';
import { eq, or, and, isNull, gte, desc, asc, sql } from 'drizzle-orm';
import { toLocalISOString } from '@/lib/utils/date-utils';
import { tripSchema, type Trip } from '@salvemundi/validations/schema/beheer-trip.zod';

function mapTripRow(t: typeof schema.trips.$inferSelect, image_type?: string | null): Trip {
    return tripSchema.parse({
        ...t,
        id: Number(t.id),
        max_participants: t.max_participants !== null ? Number(t.max_participants) : 0,
        max_crew: t.max_crew !== null ? Number(t.max_crew) : 0,
        base_price: t.base_price !== null ? String(t.base_price) : "50",
        crew_discount: t.crew_discount !== null ? String(t.crew_discount) : "20",
        deposit_amount: t.deposit_amount !== null ? Number(t.deposit_amount) : 0,
        registration_open: !!t.registration_open,
        is_bus_trip: !!t.is_bus_trip,
        allow_final_payments: !!t.allow_final_payments,
        allow_deposit_payments: !!t.allow_deposit_payments,
        start_date: toLocalISOString(t.start_date),
        end_date: toLocalISOString(t.end_date),
        registration_start_date: toLocalISOString(t.registration_start_date, true),
        image: t.image ? (image_type ? { id: t.image, type: image_type } : t.image) : null,
    });
}

export async function fetchFullTripsDb(): Promise<Trip[]> {
    const rows = await db
        .select({ trip: schema.trips, image_type: schema.directus_files.type })
        .from(schema.trips)
        .leftJoin(schema.directus_files, eq(schema.trips.image, schema.directus_files.id))
        .orderBy(desc(schema.trips.start_date));

    return rows.map(({ trip: t, image_type }) => mapTripRow(t, image_type));
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
        id: Number(t.id),
        name: t.name || '',
        start_date: toLocalISOString(t.start_date) || '',
        end_date: toLocalISOString(t.end_date) || '',
        is_bus_trip: !!t.is_bus_trip,
        allow_final_payments: !!t.allow_final_payments
    }));
}

export async function fetchTripByIdDb(tripId: number): Promise<Trip | null> {
    const rows = await db
        .select({ trip: schema.trips, image_type: schema.directus_files.type })
        .from(schema.trips)
        .leftJoin(schema.directus_files, eq(schema.trips.image, schema.directus_files.id))
        .where(eq(schema.trips.id, tripId))
        .limit(1);
    if (rows.length === 0) return null;

    const { trip: t, image_type } = rows[0];
    return mapTripRow(t, image_type);
}

export async function createTripDb(data: Partial<typeof schema.trips.$inferInsert>): Promise<number | null> {
    const result = await db.insert(schema.trips).values(data as typeof schema.trips.$inferInsert).returning({ id: schema.trips.id });
    if (result.length === 0) return null;
    return result[0].id;
}

export async function updateTripDb(id: number, data: Partial<typeof schema.trips.$inferInsert>): Promise<boolean> {
    if (Object.keys(data).length === 0) return true;
    const result = await db.update(schema.trips).set(data).where(eq(schema.trips.id, id));
    return result.count > 0;
}

export async function deleteTripDb(id: number): Promise<boolean> {
    const result = await db.delete(schema.trips).where(eq(schema.trips.id, id));
    return result.count > 0;
}

export async function fetchPublicTripsDb(): Promise<Trip[]> {
    const rows = await db
        .select({ trip: schema.trips, image_type: schema.directus_files.type })
        .from(schema.trips)
        .leftJoin(schema.directus_files, eq(schema.trips.image, schema.directus_files.id))
        .where(
            and(
                or(eq(schema.trips.status, 'published'), isNull(schema.trips.status)),
                or(gte(schema.trips.end_date, sql`CURRENT_DATE`), isNull(schema.trips.end_date))
            )
        )
        .orderBy(asc(schema.trips.start_date));

    return rows.map(({ trip: t, image_type }) => mapTripRow(t, image_type));
}