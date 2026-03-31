import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { 
    tripSchema, 
    TRIP_FIELDS, 
    TRIP_ACTIVITY_FIELDS,
    type Trip,
    type TripActivity
} from '@salvemundi/validations';
import { requireReisAdmin } from '@/server/actions/reis-admin-utils';
import { z } from 'zod';

/**
 * Shared query logic for trips in the admin panel.
 * Separated from Server Actions to avoid AggregateError issues when called during render.
 */
export async function getTrips(): Promise<Trip[]> {
    await requireReisAdmin();

    try {
        const trips = await getSystemDirectus().request(readItems('trips', {
            fields: TRIP_FIELDS as any,
            sort: ['-event_date'] as any
        }));

        const sanitized = (trips ?? []).map(t => ({
            ...t,
            max_participants: t.max_participants !== null ? Number(t.max_participants) : 0,
            max_crew: t.max_crew !== null ? Number(t.max_crew) : 0,
            base_price: t.base_price !== null ? Number(t.base_price) : 0,
            crew_discount: t.crew_discount !== null ? Number(t.crew_discount) : 0,
            deposit_amount: t.deposit_amount !== null ? Number(t.deposit_amount) : 0,
            event_date: t.event_date === null ? null : t.event_date,
            start_date: t.start_date === null ? null : t.start_date,
            end_date: t.end_date === null ? null : t.end_date,
            registration_start_date: t.registration_start_date === null ? null : t.registration_start_date,
        }));

        const parsed = z.array(tripSchema).safeParse(sanitized);

        if (!parsed.success) {
            console.error('[AdminReisQueries#getTrips] Zod validation failed:', parsed.error.format());
            return sanitized as any; // Fallback to sanitized raw if validation fails slightly
        }

        return parsed.data;
    } catch (error) {
        console.error('[AdminReisQueries#getTrips] Error:', error);
        return [];
    }
}

export async function getTripActivities(tripId: number): Promise<TripActivity[]> {
    await requireReisAdmin();

    try {
        const activities = await getSystemDirectus().request(readItems('trip_activities', {
            filter: { trip_id: { _eq: tripId } },
            fields: TRIP_ACTIVITY_FIELDS as any,
            sort: ['display_order', 'name'] as any
        }));

        return (activities ?? []).map((a: any) => ({
            ...a,
            price: a.price !== null ? Number(a.price) : 0,
            display_order: a.display_order !== null ? Number(a.display_order) : 0,
            max_participants: a.max_participants !== null ? Number(a.max_participants) : null,
            max_selections: a.max_selections !== null ? Number(a.max_selections) : null,
        }));
    } catch (error) {
        console.error('[AdminReisQueries#getTripActivities] Error:', error);
        return [];
    }
}
