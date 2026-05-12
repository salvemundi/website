'use server';

import { requireAdminResource } from '@/server/auth/auth-utils';
import { AdminResource } from '@/shared/lib/permissions-config';
import { query } from '@/lib/database';
import { fetchAllTripsDb } from '@/server/internal/reis-db.utils';

export async function getAdminTrips() {
    await requireAdminResource(AdminResource.Reis);
    try {
        return await fetchAllTripsDb();
    } catch (_error) {

        return [];
    }
}

export async function getAdminTripById(id: number) {
    await requireAdminResource(AdminResource.Reis);
    try {
        const { rows } = await query('SELECT id, name, is_bus_trip FROM trips WHERE id = $1 LIMIT 1', [id]);
        if (!rows?.[0]) return null;
        return {
            ...rows[0],
            is_bus_trip: !!rows[0].is_bus_trip
        };
    } catch (error) {
        console.error(error);
        return null;
    }
}