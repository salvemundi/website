'use server';

import { z } from 'zod';
import { revalidateTag, revalidatePath } from 'next/cache';
import {
    tripActivitySchema,
    TRIP_ACTIVITY_FIELDS
} from '@salvemundi/validations';
import { getSystemDirectus } from '@/lib/directus';
import { 
    readItems, 
    updateItem, 
    deleteItem, 
    createItem
} from '@directus/sdk';
import { requireReisAdmin } from './reis-admin-utils';

// getTripActivities removed - Use getTripActivities from @/server/queries/admin-reis.queries instead to avoid redundancy.

export async function createTripActivity(prevState: any, formData: FormData) {
    await requireReisAdmin();

    const rawData: Record<string, any> = {};
    formData.forEach((value, key) => {
        if (key === 'options') {
            try { rawData[key] = JSON.parse(value as string); } catch { rawData[key] = []; }
        } else if (key === 'price' || key === 'display_order' || key === 'max_participants' || key === 'max_selections' || key === 'trip_id') {
            rawData[key] = value === '' ? null : (key === 'price' ? parseFloat(value as string) : parseInt(value as string));
        } else if (key === 'is_active') {
            rawData[key] = value === 'on' || value === 'true';
        } else {
            rawData[key] = value;
        }
    });

    const validated = tripActivitySchema.omit({ id: true }).safeParse(rawData);
    if (!validated.success) {
        return { 
            error: "Validatie mislukt", 
            fieldErrors: validated.error.flatten().fieldErrors,
            success: false 
        };
    }

    try {
        await getSystemDirectus().request(createItem('trip_activities', validated.data as any));
        revalidateTag('trip_activities', 'default');
        revalidatePath('/beheer/reis');
        revalidatePath('/beheer/reis/instellingen');
        revalidatePath('/beheer/reis/activiteiten');
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Onbekende fout';
        console.error('[AdminReisActivities#createTripActivity] Error:', error);
        return { success: false, error: message };
    }
}

export async function updateTripActivity(id: number, prevState: any, formData: FormData) {
    await requireReisAdmin();

    const rawData: Record<string, any> = {};
    formData.forEach((value, key) => {
        if (key === 'options') {
            try { rawData[key] = JSON.parse(value as string); } catch { rawData[key] = []; }
        } else if (key === 'price' || key === 'display_order' || key === 'max_participants' || key === 'max_selections' || key === 'trip_id') {
            rawData[key] = value === '' ? null : (key === 'price' ? parseFloat(value as string) : parseInt(value as string));
        } else if (key === 'is_active') {
            rawData[key] = value === 'on' || value === 'true';
        } else {
            rawData[key] = value;
        }
    });

    const validated = tripActivitySchema.omit({ id: true }).partial().safeParse(rawData);
    if (!validated.success) {
        return { 
            error: "Validatie mislukt", 
            fieldErrors: validated.error.flatten().fieldErrors,
            success: false 
        };
    }

    try {
        await getSystemDirectus().request(updateItem('trip_activities', id, validated.data as any));
        revalidateTag('trip_activities', 'default');
        revalidatePath('/beheer/reis');
        revalidatePath('/beheer/reis/instellingen');
        revalidatePath('/beheer/reis/activiteiten');
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Onbekende fout';
        console.error('[AdminReisActivities#updateTripActivity] Error:', error);
        return { success: false, error: message };
    }
}

export async function deleteTripActivity(id: number) {
    await requireReisAdmin();

    try {
        await getSystemDirectus().request(deleteItem('trip_activities', id));
        revalidateTag('trip_activities', 'default');
        revalidatePath('/beheer/reis');
        revalidatePath('/beheer/reis/instellingen');
        revalidatePath('/beheer/reis/activiteiten');
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Onbekende fout';
        console.error('[AdminReisActivities#deleteTripActivity] Error:', error);
        return { success: false, error: message };
    }
}

export async function getActivitySignups(activityId: number) {
    await requireReisAdmin();

    try {
        const signups = await getSystemDirectus().request(readItems('trip_signup_activities', {
            filter: { trip_activity_id: { _eq: activityId } },
            fields: ['id', 'selected_options', { trip_signup_id: ['id', 'first_name', 'last_name', 'email'] }] as any
        }));

        return signups ?? [];
    } catch (error) {
        console.error('[AdminReisActivities#getActivitySignups] Error:', error);
        return [];
    }
}
