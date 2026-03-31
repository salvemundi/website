'use server';

import { z } from 'zod';
import { revalidateTag } from 'next/cache';
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

export async function getTripActivities(tripId: number) {
    await requireReisAdmin();

    try {
        const activities = await getSystemDirectus().request(readItems('trip_activities', {
            filter: { trip_id: { _eq: tripId } },
            fields: TRIP_ACTIVITY_FIELDS as any,
            sort: ['display_order'] as any
        }));

        const sanitized = (activities ?? []).map((a: any) => ({
            ...a,
            price: a.price !== null ? Number(a.price) : a.price,
            display_order: a.display_order !== null ? Number(a.display_order) : a.display_order,
            max_participants: a.max_participants !== null ? Number(a.max_participants) : a.max_participants,
            is_active: !!a.is_active,
            options: Array.isArray(a.options) ? a.options.map((o: any) => ({
                ...o,
                price: o.price !== null ? Number(o.price) : o.price
            })) : a.options
        }));

        const parsed = z.array(tripActivitySchema).safeParse(sanitized);

        if (!parsed.success) {
            console.error('[AdminReisActivities#getTripActivities] Zod validation failed:', parsed.error.flatten().fieldErrors);
            return [];
        }

        return parsed.data;
    } catch (error) {
        console.error('[AdminReisActivities#getTripActivities] Error:', error);
        return [];
    }
}

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
