'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
    tripSchema,
    TRIP_FIELDS,
    type DbTrip
} from '@salvemundi/validations';
import { getSystemDirectus } from '@/lib/directus';
import { 
    readItems, 
    updateItem, 
    deleteItem, 
    createItem
} from '@directus/sdk';
import { requireReisAdmin } from './reis-admin-utils';

export async function getTrips() {
    await requireReisAdmin();

    try {
        const trips = await getSystemDirectus().request(readItems('trips', {
            fields: TRIP_FIELDS as unknown /* TODO: REVIEW-ANY */,
            sort: ['-event_date'] as unknown /* TODO: REVIEW-ANY */
        })) as unknown as DbTrip[];

        const sanitized = (trips ?? []).map(t => ({
            ...t,
            max_participants: t.max_participants !== null ? Number(t.max_participants) : t.max_participants,
            max_crew: t.max_crew !== null ? Number(t.max_crew) : t.max_crew,
            base_price: t.base_price !== null ? Number(t.base_price) : t.base_price,
            crew_discount: t.crew_discount !== null ? Number(t.crew_discount) : t.crew_discount,
            deposit_amount: t.deposit_amount !== null ? Number(t.deposit_amount) : t.deposit_amount,
            event_date: t.event_date === null ? null : t.event_date,
            start_date: t.start_date === null ? null : t.start_date,
            end_date: t.end_date === null ? null : t.end_date,
            registration_start_date: t.registration_start_date === null ? null : t.registration_start_date,
        }));

        const parsed = z.array(tripSchema).safeParse(sanitized);

        if (!parsed.success) {
            console.error('[AdminReisActions#getTrips] Zod validation failed:', parsed.error.format());
            return [];
        }

        return parsed.data;
    } catch (error) {
        console.error('[AdminReisActions#getTrips] Error:', error);
        return [];
    }
}

export async function createTrip(prevState: unknown, formData: FormData) {
    await requireReisAdmin();

    const rawData = Object.fromEntries(formData.entries());
    const data = {
        ...rawData,
        registration_open: rawData.registration_open === 'on' || rawData.registration_open === 'true',
        is_bus_trip: rawData.is_bus_trip === 'on' || rawData.is_bus_trip === 'true',
        allow_final_payments: rawData.allow_final_payments === 'on' || rawData.allow_final_payments === 'true',
        max_participants: parseInt(rawData.max_participants as string) || 0,
        max_crew: parseInt(rawData.max_crew as string) || 0,
        base_price: parseFloat(rawData.base_price as string) || 0,
        crew_discount: parseFloat(rawData.crew_discount as string) || 0,
        deposit_amount: parseFloat(rawData.deposit_amount as string) || 0,
        registration_start_date: rawData.registration_start_date || null,
        description: rawData.description || null,
        image: rawData.image || null,
        event_date: rawData.start_date || null,
    };

    const validated = tripSchema.omit({ id: true }).safeParse(data);
    if (!validated.success) {
        return { success: false, error: 'Validatie mislukt', fieldErrors: validated.error.flatten().fieldErrors };
    }

    try {
        await getSystemDirectus().request(createItem('trips', validated.data as Record<string, unknown> /* TODO: REVIEW-ANY */));

        revalidatePath('/beheer/reis');
        return { success: true };
    } catch (error) {
        console.error('[AdminReisActions#createTrip] Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Internal server error' };
    }
}

export async function updateTrip(id: number, prevState: unknown, formData: FormData) {
    await requireReisAdmin();

    const rawData = Object.fromEntries(formData.entries());
    const data = {
        ...rawData,
        registration_open: rawData.registration_open === 'on' || rawData.registration_open === 'true',
        is_bus_trip: rawData.is_bus_trip === 'on' || rawData.is_bus_trip === 'true',
        allow_final_payments: rawData.allow_final_payments === 'on' || rawData.allow_final_payments === 'true',
        max_participants: parseInt(rawData.max_participants as string) || 0,
        max_crew: parseInt(rawData.max_crew as string) || 0,
        base_price: parseFloat(rawData.base_price as string) || 0,
        crew_discount: parseFloat(rawData.crew_discount as string) || 0,
        deposit_amount: parseFloat(rawData.deposit_amount as string) || 0,
        registration_start_date: rawData.registration_start_date || null,
        description: rawData.description || null,
        image: rawData.image || null,
        event_date: rawData.start_date || null,
    };

    const validated = tripSchema.omit({ id: true }).partial().safeParse(data);
    if (!validated.success) {
        return { success: false, error: 'Validatie mislukt', fieldErrors: validated.error.flatten().fieldErrors };
    }

    try {
        await getSystemDirectus().request(updateItem('trips', id, validated.data as Record<string, unknown> /* TODO: REVIEW-ANY */));

        revalidatePath('/beheer/reis');
        return { success: true };
    } catch (error) {
        console.error('[AdminReisActions#updateTrip] Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Internal server error' };
    }
}

export async function deleteTrip(id: number) {
    await requireReisAdmin();
    try {
        await getSystemDirectus().request(deleteItem('trips', id));
        revalidatePath('/beheer/reis');
        return { success: true };
    } catch (error) {
        console.error('[AdminReisActions#deleteTrip] Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Internal server error' };
    }
}
