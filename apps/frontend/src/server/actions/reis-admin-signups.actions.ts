'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
    tripSignupSchema,
    tripSignupActivitySchema,
    type TripSignup,
    type TripSignupActivity
} from '@salvemundi/validations/schema/admin-reis.zod';
import { TRIP_SIGNUP_FIELDS } from '@salvemundi/validations/directus/fields';
import { requireReisAdmin } from './reis-admin-utils';
import { 
    fetchAllTripSignupsDb, 
    fetchTripSignupByIdDb, 
    fetchTripSignupActivitiesDb,
    updateTripSignupDb,
    deleteTripSignupDb,
    fetchSignupsByActivityIdDb,
    fetchSelectedSignupActivitiesDb
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
        return await fetchAllTripSignupsDb(tripId);
    } catch (error) {
        
        return [];
    }
}

export async function getTripSignup(id: number): Promise<TripSignup | null> {
    await requireReisAdmin();

    try {
        return await fetchTripSignupByIdDb(id);
    } catch (error) {
        
        return null;
    }
}

export async function updateSignupStatus(signupId: number, status: string) {
    await requireReisAdmin();

    try {
        const signup = await fetchTripSignupByIdDb(signupId);
        if (!signup) throw new Error('Aanmelding niet gevonden');

        const oldStatus = signup.status;
        
        const success = await updateTripSignupDb(signupId, { status });
        if (!success) throw new Error('Database update mislukt');

        // Shadow Write (Directus)
        getSystemDirectus().request(updateItem('trip_signups', signupId, { status })).catch(err => {
            
        });
        
        // 4. Trigger Email if status changed TO confirmed
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
                            tripName: 'de reis' // Flat result from DB doesn't have trip name, simplified for now
                        }
                    })
                }).catch(() => {}); }
        }

        const { revalidatePath, revalidateTag } = await import('next/cache');
        revalidateTag('reis-status', 'max');

        revalidatePath('/beheer/reis');
        revalidatePath('/reis');

        return { success: true };
    } catch (error) {
        
        return { success: false, error: 'Update mislukt' };
    }
}

export async function deleteTripSignup(signupId: number) {
    await requireReisAdmin();

    try {
        const success = await deleteTripSignupDb(signupId);
        if (!success) throw new Error('Database delete mislukt');

        getSystemDirectus().request(deleteItem('trip_signups', signupId)).catch(err => {
            
        });
        
        const { revalidatePath, revalidateTag } = await import('next/cache');
        revalidateTag('reis-status', 'max');

        revalidatePath('/beheer/reis');
        revalidatePath('/reis');

        return { success: true };
    } catch (error) {
        
        return { success: false, error: 'Verwijderen mislukt' };
    }
}

export async function updateTripSignup(prevState: any, formData: FormData) {
    await requireReisAdmin();

    const id = parseInt(formData.get('id') as string);
    if (!id) throw new Error('Geen ID gevonden voor update');

    const rawData = Object.fromEntries(formData.entries());
    
    const data = {
        first_name: rawData.first_name as string,
        last_name: rawData.last_name as string,
        email: rawData.email as string,
        phone_number: rawData.phone_number as string,
        willing_to_drive: rawData.willing_to_drive === 'on' || rawData.willing_to_drive === 'true',
        deposit_paid: rawData.deposit_paid === 'on' || rawData.deposit_paid === 'true',
        full_payment_paid: rawData.full_payment_paid === 'on' || rawData.full_payment_paid === 'true',
        date_of_birth: rawData.date_of_birth || null,
        status: rawData.status as string,
        role: rawData.role as string,
        allergies: rawData.allergies as string,
        special_notes: rawData.special_notes as string,
    };

    const validated = tripSignupSchema.partial().safeParse(data);
    if (!validated.success) {
        return { success: false, error: 'Validatie mislukt', fieldErrors: validated.error.flatten().fieldErrors };
    }

    try {
        const success = await updateTripSignupDb(id, validated.data);
        if (!success) throw new Error('Database update mislukt');

        getSystemDirectus().request(updateItem('trip_signups', id, validated.data)).catch(err => {
            
        });

        const { revalidatePath, revalidateTag } = await import('next/cache');
        revalidateTag('reis-status', 'max');

        revalidatePath('/beheer/reis');
        revalidatePath(`/beheer/reis/deelnemer/${id}`);
        revalidatePath('/reis');

        return { success: true };
    } catch (error) {
        
        return { success: false, error: 'Update mislukt' };
    }
}

export async function getSignupActivities(signupId: number) {
    await requireReisAdmin();

    try {
        const activities = await fetchSelectedSignupActivitiesDb(signupId);
        const parsed = z.array(tripSignupActivitySchema).safeParse(activities);

        if (!parsed.success) {
            
            return [];
        }

        return parsed.data;
    } catch (error) {
        
        return [];
    }
}

export async function getActivitySignups(activityId: number) {
    await requireReisAdmin();
    try {
        return await fetchSignupsByActivityIdDb(activityId);
    } catch (error) {
        
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
        
        return { success: false, error: 'Internal server error' };
    }
}

export async function sendPaymentEmail(signupId: number, tripId: number, paymentType: 'deposit' | 'final') {
    await requireReisAdmin();

    const FINANCE_URL = process.env.FINANCE_SERVICE_URL;
    const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

    if (!INTERNAL_SERVICE_TOKEN) {
        
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
            
            throw new Error('De betaalservice gaf een fout terug.');
        }

        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Onbekende fout';
        
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
            
            throw new Error('De e-mailservice gaf een fout terug.');
        }

        return { success: true };
    } catch (error) {
        
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
        
        return [];
    }
}
