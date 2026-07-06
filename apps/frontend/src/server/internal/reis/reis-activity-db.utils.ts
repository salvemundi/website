import 'server-only';
import { db, schema } from '@salvemundi/db';
import { eq, asc } from 'drizzle-orm';
import { TripActivity } from '@salvemundi/validations/schema/admin-trip.zod';

export async function fetchTripActivitiesByTripIdDb(tripId: number): Promise<TripActivity[]> {
    const rows = await db.select().from(schema.trip_activities).where(eq(schema.trip_activities.trip_id, tripId)).orderBy(asc(schema.trip_activities.display_order), asc(schema.trip_activities.name));
    return rows.map(a => ({
        ...a,
        price: a.price ? Number(a.price) : 0,
        display_order: a.display_order ? Number(a.display_order) : 0,
        max_participants: a.max_participants ? Number(a.max_participants) : null,
        max_selections: a.max_selections ? Number(a.max_selections) : null
    } as unknown as TripActivity));
}

export async function createTripActivityDb(data: Partial<TripActivity>): Promise<number | null> {
    const result = await db.insert(schema.trip_activities).values(data as NonNullable<unknown>).returning({ id: schema.trip_activities.id });
    return result[0]?.id ?? null;
}

export async function updateTripActivityDb(id: number, data: Partial<TripActivity>): Promise<boolean> {
    if (Object.keys(data).length === 0) return true;
    const result = await db.update(schema.trip_activities).set(data as NonNullable<unknown>).where(eq(schema.trip_activities.id, id));
    return result.count > 0;
}

export async function deleteTripActivityDb(id: number): Promise<boolean> {
    const result = await db.delete(schema.trip_activities).where(eq(schema.trip_activities.id, id));
    return result.count > 0;
}