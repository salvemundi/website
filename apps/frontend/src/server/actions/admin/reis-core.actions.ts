'use server';

import { requireAdminResource } from '@/server/auth/auth-utils';
import { AdminResource } from '@/shared/lib/permissions-config';
import { query } from '@/lib/database';
import { fetchAllTripsDb } from '@/server/internal/reis-db.utils';
import { safeConsoleError } from '@/server/utils/logger';

export async function getAdminTrips() {
    await requireAdminResource(AdminResource.Reis);
    try {
        return await fetchAllTripsDb();
    } catch (error) {
        safeConsoleError(`[ReisCore][getAdminTrips] Failed to fetch admin trips:`, error);
        throw new Error('Er is een fout opgetreden bij het ophalen van de reizen');
    }
}

export async function getAdminTripById(id: number) {
    await requireAdminResource(AdminResource.Reis);
    try {
        const { rows } = await query('SELECT id, name, is_bus_trip FROM trips WHERE id = $1 LIMIT 1', [id]);
        if (!rows?.[0]) throw new Error('De reis is niet gevonden');
        return {
            ...rows[0],
            is_bus_trip: !!rows[0].is_bus_trip
        };
    } catch (error) {
        safeConsoleError(`[ReisCore][getAdminTripById] Failed to fetch admin trip by ID ${id}:`, error);
        throw new Error('Er is een fout opgetreden bij het ophalen van de reis');
    }
}