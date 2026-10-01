import 'server-only';
import { db, schema } from '@salvemundi/db';
import { eq, asc } from 'drizzle-orm';
import { tripActivitySchema, type TripActivity } from '@salvemundi/validations/schema/beheer-trip.zod';

export async function fetchTripActivitiesByTripIdDb(tripId: number): Promise<TripActivity[]> {
    const rows = await db.select().from(schema.trip_activities).where(eq(schema.trip_activities.trip_id, tripId)).orderBy(asc(schema.trip_activities.display_order), asc(schema.trip_activities.name));
    return rows.map(a => tripActivitySchema.parse({
        ...a,
        id: Number(a.id),
        trip_id: Number(a.trip_id),
        price: a.price ? Number(a.price) : 0,
        display_order: a.display_order ? Number(a.display_order) : 0,
        max_participants: a.max_participants ? Number(a.max_participants) : null,
        max_selections: a.max_selections ? Number(a.max_selections) : null
    }));
}

export type TripActivityInsertInput = Partial<Omit<typeof schema.trip_activities.$inferInsert, 'price'>> & {
    price?: number | string | null;
};

export async function createTripActivityDb(data: TripActivityInsertInput): Promise<number | null> {
    const insertData: typeof schema.trip_activities.$inferInsert = {
        ...data,
        price: data.price !== undefined && data.price !== null ? String(data.price) : undefined
    };
    const result = await db.insert(schema.trip_activities).values(insertData).returning({ id: schema.trip_activities.id });
    return result[0]?.id ?? null;
}

export async function updateTripActivityDb(id: number, data: TripActivityInsertInput): Promise<boolean> {
    if (Object.keys(data).length === 0) return true;
    const updateData: Partial<typeof schema.trip_activities.$inferInsert> = {
        ...data,
        price: data.price !== undefined ? (data.price !== null ? String(data.price) : null) : undefined
    };
    const result = await db.update(schema.trip_activities).set(updateData).where(eq(schema.trip_activities.id, id));
    return result.count > 0;
}

export async function deleteTripActivityDb(id: number): Promise<boolean> {
    const result = await db.delete(schema.trip_activities).where(eq(schema.trip_activities.id, id));
    return result.count > 0;
}