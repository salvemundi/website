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
import { requireReisAdmin } from './reis-admin-utils';
import { 
    fetchAllTripSignupsDb, 
    fetchTripSignupByIdDb, 
    fetchTripSignupActivitiesDb 
} from './reis-db.utils';
import { getSystemDirectus } from '@/lib/directus';
import { 
    readItems, 
    readItem,
    updateItem, 
    deleteItem, 
    createItem
} from '@directus/sdk';

export async function getTripSignups(tripId: number) {
    await requireReisAdmin();

    try {
        // 1. Direct DB fetch for absolute consistency in the list
        const dbSignups = await fetchAllTripSignupsDb(tripId);
        if (dbSignups.length > 0) {
            return dbSignups as TripSignup[];
        }

        // 2. Fallback to Directus if DB query returns nothing or is empty
        const signups = await getSystemDirectus().request(readItems('trip_signups', {
            filter: { trip_id: { _eq: tripId } },
            fields: TRIP_SIGNUP_FIELDS as any,
            sort: ['-created_at'] as any,
            limit: -1
        })) as unknown as DbTripSignup[];

        const sanitized = (signups ?? []).map(s => ({
            ...s,
            created_at: s.created_at,
            deposit_paid: !!s.deposit_paid,
            full_payment_paid: !!s.full_payment_paid,
            willing_to_drive: !!s.willing_to_drive,
        }));

        const parsed = z.array(tripSignupSchema).safeParse(sanitized);

        if (!parsed.success) {
            console.error('[AdminReisActions#getTripSignups] Zod validation failed on Directus fallback:', parsed.error.flatten().fieldErrors);
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
        // 1. Direct DB fetch for absolute consistency
        const dbSignup = await fetchTripSignupByIdDb(id);
        if (dbSignup) {
            return dbSignup as TripSignup;
        }

        // 2. Fallback to Directus
        const signup = await getSystemDirectus().request(readItem('trip_signups', id, {
            fields: TRIP_SIGNUP_FIELDS as any
        })) as unknown as DbTripSignup;

        if (!signup) return null;
        const sanitized = { ...signup, created_at: signup.created_at };
        return tripSignupSchema.parse(sanitized);
    } catch (error) {
        console.error('[AdminReisActions#getTripSignup] Error:', error);
        return null;
    }
}

export async function updateSignupStatus(signupId: number, status: string) {
    await requireReisAdmin();

    try {
        const client = getSystemDirectus();
        
        // 1. Fetch current data to know if we need to send a mail
        const signup = await client.request(readItem('trip_signups', signupId, {
            fields: ['id', 'email', 'first_name', 'status', { trip_id: ['name'] }]
        })) as any;

        const oldStatus = signup?.status;
        
        // 2. Perform the update
        await client.request(updateItem('trip_signups', signupId, { status }));
        
        // 3. Trigger Email if status changed TO confirmed
        if (status === 'confirmed' && oldStatus !== 'confirmed' && signup?.email) {
            const mailUrl = process.env.MAIL_SERVICE_URL;
            const token = process.env.INTERNAL_SERVICE_TOKEN;

            if (mailUrl && token) {
                fetch(`${mailUrl}/api/mail/send`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        to: signup.email,
                        templateId: 'trip_status_update',
                        data: {
                            firstName: signup.first_name,
                            tripName: signup.trip_id?.name || 'de reis'
                        }
                    })
                }).catch(e => console.error('[AdminReisActions] Failed to trigger status update mail:', e));
            }
        }

        const { revalidatePath, ...cacheFunctions } = await import('next/cache');
        const cache = cacheFunctions as any;
        if (cache.updateTag) cache.updateTag('reis-status');
        else if (cache.revalidateTag) cache.revalidateTag('reis-status', 'max');

        revalidatePath('/beheer/reis');
        revalidatePath('/reis');

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
        
        const { revalidatePath, ...cacheFunctions } = await import('next/cache');
        const cache = cacheFunctions as any;
        if (cache.updateTag) cache.updateTag('reis-status');
        else if (cache.revalidateTag) cache.revalidateTag('reis-status', 'max');

        revalidatePath('/beheer/reis');
        revalidatePath('/reis');

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

    const validated = tripSignupSchema.partial().safeParse(data);
    if (!validated.success) {
        return { success: false, error: 'Validatie mislukt', fieldErrors: validated.error.flatten().fieldErrors };
    }

    try {
        await getSystemDirectus().request(updateItem('trip_signups', id, validated.data as any));

        const { revalidatePath, ...cacheFunctions } = await import('next/cache');
        const cache = cacheFunctions as any;
        if (cache.updateTag) cache.updateTag('reis-status');
        else if (cache.revalidateTag) cache.revalidateTag('reis-status', 'max');

        revalidatePath('/beheer/reis');
        revalidatePath(`/beheer/reis/deelnemer/${id}`);
        revalidatePath('/reis');

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

export async function sendPaymentEmail(signupId: number, tripId: number, paymentType: 'deposit' | 'final') {
    await requireReisAdmin();

    const FINANCE_URL = process.env.FINANCE_SERVICE_URL;
    const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

    if (!INTERNAL_SERVICE_TOKEN) {
        console.error('[AdminReisActions#sendPaymentEmail] INTERNAL_SERVICE_TOKEN is missing');
        throw new Error('Missing service token');
    }

    try {
        const url = new URL(`${FINANCE_URL}/api/finance/trip-payment-request`);

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${INTERNAL_SERVICE_TOKEN}`
            },
            body: JSON.stringify({
                signupId,
                tripId,
                paymentType
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[AdminReisActions#sendPaymentEmail] Finance service error:', errorData);
            throw new Error('De betaalservice gaf een fout terug.');
        }

        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Onbekende fout';
        console.error('[AdminReisActions#sendPaymentEmail] Error:', error);
        return { success: false, error: message };
    }
}

export async function sendBulkTripEmail(data: {
    tripId: number;
    recipients: { email: string; name: string }[];
    subject: string;
    message: string;
}) {
    await requireReisAdmin();

    const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;
    const mailUrl = process.env.MAIL_SERVICE_URL;

    if (!INTERNAL_SERVICE_TOKEN) {
        throw new Error('Missing service token');
    }
    
    try {
        const response = await fetch(`${mailUrl}/api/mail/send-bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${INTERNAL_SERVICE_TOKEN}`,
            },
            body: JSON.stringify({
                to: data.recipients,
                subject: data.subject,
                template: 'trip-announcement',
                data: {
                    message: data.message,
                    tripId: data.tripId
                }
            }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            console.error('[AdminReisActions#sendBulkTripEmail] Mail service error:', err);
            throw new Error('De e-mailservice gaf een fout terug.');
        }

        return { success: true };
    } catch (error) {
        console.error('[AdminReisActions#sendBulkTripEmail] Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Verzenden mislukt' };
    }
}

export async function sendBulkPaymentEmails(tripId: number, signupIds: number[], paymentType: 'deposit' | 'final') {
    await requireReisAdmin();

    const results = {
        successCount: 0,
        failCount: 0,
    };

    for (const signupId of signupIds) {
        try {
            const res = await sendPaymentEmail(signupId, tripId, paymentType);
            if (res.success) {
                results.successCount++;
            } else {
                results.failCount++;
            }
        } catch (error) {
            results.failCount++;
        }
    }

    return { 
        success: results.failCount === 0, 
        ...results 
    };
}

/**
 * Fetches all activity selections for a specific trip directly from the database.
 */
export async function getTripSignupActivitiesAction(tripId: number) {
    await requireReisAdmin();
    try {
        return await fetchTripSignupActivitiesDb(tripId);
    } catch (error) {
        console.error('[AdminReisActions#getTripSignupActivitiesAction] Error:', error);
        return [];
    }
}
