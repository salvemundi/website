import 'server-only';
import { requireAdminResource } from '@/server/auth/auth-utils';
import { AdminResource } from '@/shared/lib/permissions-config';
import { fetchFullTripsDb } from '@/server/internal/reis/reis-trip-db.utils';
import { fetchTripActivitiesByTripIdDb } from '@/server/internal/reis/reis-activity-db.utils';;
import {
    tripSchema,
    type Trip,
    type TripActivity } from '@salvemundi/validations/schema/admin-trip.zod';
import { z } from 'zod';
import { safeConsoleError } from '@/server/utils/logger';
import { db, schema } from '@salvemundi/db';
import { eq, desc } from 'drizzle-orm';

export async function getTrips(): Promise<Trip[]> {
    await requireAdminResource(AdminResource.Reis);
    const sanitized = await fetchFullTripsDb();
    const parsed = z.array(tripSchema).safeParse(sanitized);
    if (!parsed.success) {
        safeConsoleError('[admin-trip.queries.ts][getTrips] ', `Validation failed for trips: ${parsed.error.message}`);
        return sanitized as Trip[];
    }
    return parsed.data;
}

export async function getTripActivities(tripId: number): Promise<TripActivity[]> {
    await requireAdminResource(AdminResource.Reis);
    return await fetchTripActivitiesByTripIdDb(tripId) as TripActivity[];
}

export async function getTripsForMail() {
    await requireAdminResource(AdminResource.Reis);
    return db.select({
        id: schema.trips.id,
        name: schema.trips.name,
        start_date: schema.trips.start_date
    })
    .from(schema.trips)
    .orderBy(desc(schema.trips.start_date));
}

export async function getTripSignupsForMail(tripId: number) {
    await requireAdminResource(AdminResource.Reis);
    return db.select({
        id: schema.trip_signups.id,
        first_name: schema.trip_signups.first_name,
        last_name: schema.trip_signups.last_name,
        email: schema.trip_signups.email,
        status: schema.trip_signups.status,
        role: schema.trip_signups.role,
        deposit_paid: schema.trip_signups.deposit_paid,
        full_payment_paid: schema.trip_signups.full_payment_paid
    })
    .from(schema.trip_signups)
    .where(eq(schema.trip_signups.trip_id, tripId));
}