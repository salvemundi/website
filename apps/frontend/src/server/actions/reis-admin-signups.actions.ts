'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
    tripSignupSchema,
    tripSignupActivitySchema,
    type TripSignup,
    TRIP_SIGNUP_FIELDS,
    type DbTripSignup,
    type TripSignupActivity
} from '@salvemundi/validations';
import { getSystemDirectus } from '@/lib/directus';
import { 
    readItems, 
    readItem,
    updateItem, 
    deleteItem, 
    createItem
} from '@directus/sdk';
import { requireReisAdmin } from './reis-admin-utils';

export async function getTripSignups(tripId: number) {
    await requireReisAdmin();

    try {
        const signups = await getSystemDirectus().request(readItems('trip_signups', {
            filter: { trip_id: { _eq: tripId } },
            fields: TRIP_SIGNUP_FIELDS as any,
            sort: ['-created_at'] as any,
            limit: -1
        })) as unknown as DbTripSignup[];

        const sanitized = (signups ?? []).map(s => ({
            ...s,
            date_created: s.created_at,
            deposit_paid: !!s.deposit_paid,
            full_payment_paid: !!s.full_payment_paid,
            willing_to_drive: !!s.willing_to_drive,
        }));

        const parsed = z.array(tripSignupSchema).safeParse(sanitized);

        if (!parsed.success) {
            console.error('[AdminReisActions#getTripSignups] Zod validation failed:', parsed.error.flatten().fieldErrors);
            return [];
        }

        return parsed.data;
    } catch (error) {
        console.error('[AdminReisActions#getTripSignups] Error:', error);
        return [];
    }
}

export async function getTripSignup(id: number): Promise<TripSignup | null> {
    await requireReisAdmin();

    try {
        const signup = await getSystemDirectus().request(readItem('trip_signups', id, {
            fields: TRIP_SIGNUP_FIELDS as any
        })) as unknown as DbTripSignup;

        if (!signup) return null;
        const sanitized = { ...signup, date_created: signup.created_at };
        return tripSignupSchema.parse(sanitized);
    } catch (error) {
        console.error('[AdminReisActions#getTripSignup] Error:', error);
        return null;
    }
}

export async function updateSignupStatus(signupId: number, status: string) {
    await requireReisAdmin();

    try {
        await getSystemDirectus().request(updateItem('trip_signups', signupId, { status }));
        revalidatePath('/beheer/reis');
        return { success: true };
    } catch (error) {
        console.error('[AdminReisActions#updateSignupStatus] Error:', error);
        return { success: false, error: 'Update mislukt' };
    }
}

export async function deleteTripSignup(signupId: number) {
    await requireReisAdmin();

    try {
        await getSystemDirectus().request(deleteItem('trip_signups', signupId));
        revalidatePath('/beheer/reis');
        return { success: true };
    } catch (error) {
        console.error('[AdminReisActions#deleteTripSignup] Error:', error);
        return { success: false, error: 'Verwijderen mislukt' };
    }
}

export async function updateTripSignup(id: number, prevState: unknown, formData: FormData) {
    await requireReisAdmin();

    const rawData = Object.fromEntries(formData.entries());
    
    const data = {
        ...rawData,
        willing_to_drive: rawData.willing_to_drive === 'on' || rawData.willing_to_drive === 'true',
        deposit_paid: rawData.deposit_paid === 'on' || rawData.deposit_paid === 'true',
        full_payment_paid: rawData.full_payment_paid === 'on' || rawData.full_payment_paid === 'true',
        date_of_birth: rawData.date_of_birth || null,
    };

    try {
        await getSystemDirectus().request(updateItem('trip_signups', id, data as any));

        revalidatePath('/beheer/reis');
        revalidatePath(`/beheer/reis/deelnemer/${id}`);
        return { success: true };
    } catch (error) {
        console.error('[AdminReisActions#updateTripSignup] Error:', error);
        return { success: false, error: 'Update mislukt' };
    }
}

export async function getSignupActivities(signupId: number) {
    await requireReisAdmin();

    try {
        const activities = await getSystemDirectus().request(readItems('trip_signup_activities', {
            filter: { trip_signup_id: { _eq: signupId } },
            fields: [
                'id',
                'trip_signup_id', 
                { trip_activity_id: ['id', 'name', 'price', 'options'] }, 
                'selected_options'
            ] as any
        })) as unknown as TripSignupActivity[];

        const parsed = z.array(tripSignupActivitySchema).safeParse(activities);

        if (!parsed.success) {
            console.error('[AdminReisActions#getSignupActivities] Zod validation failed:', parsed.error.flatten().fieldErrors);
            return [];
        }

        return parsed.data;
    } catch (error) {
        console.error('[AdminReisActions#getSignupActivities] Error:', error);
        return [];
    }
}

export async function getActivitySignups(activityId: number) {
    await requireReisAdmin();

    try {
        const signups = await getSystemDirectus().request(readItems('trip_signup_activities', {
            filter: { trip_activity_id: { _eq: activityId } },
            fields: ['id', 'selected_options', { trip_signup_id: ['id', 'first_name', 'last_name', 'email'] }] as any
        })) as unknown as (TripSignupActivity & { trip_signup_id: { id: string, first_name: string, last_name: string, email: string } })[];

        return signups ?? [];
    } catch (error) {
        console.error('[AdminReisActions#getActivitySignups] Error:', error);
        return [];
    }
}

export async function updateSignupActivities(signupId: number, activityIds: number[]) {
    await requireReisAdmin();

    try {
        const client = getSystemDirectus();
        
        const current = await getSignupActivities(signupId);
        const currentIds = current.map(a => typeof a.trip_activity_id === 'object' ? Number(a.trip_activity_id.id) : Number(a.trip_activity_id));
        
        const toDelete = current.filter(a => {
            const activityId = typeof a.trip_activity_id === 'object' ? a.trip_activity_id.id : a.trip_activity_id;
            return !activityIds.includes(Number(activityId));
        });
        
        for (const item of toDelete) {
            if (item.id) {
                await client.request(deleteItem('trip_signup_activities', item.id));
            }
        }
        
        const toAdd = activityIds.filter(id => !currentIds.includes(id));
        for (const activityId of toAdd) {
            await client.request(createItem('trip_signup_activities', {
                trip_signup_id: signupId,
                trip_activity_id: activityId,
            }));
        }

        revalidatePath('/beheer/reis');
        revalidatePath(`/beheer/reis/deelnemer/${signupId}`);
        return { success: true };
    } catch (error) {
        console.error('[AdminReisActions#updateSignupActivities] Error:', error);
        return { success: false, error: 'Internal server error' };
    }
}
