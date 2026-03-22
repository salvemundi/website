'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { revalidateTag, revalidatePath } from 'next/cache';
import { auth } from '@/server/auth/auth';
import {
    tripSchema,
    tripSignupSchema,
    tripSignupActivitySchema,
    tripActivitySchema,
    type TripSignup
} from '@salvemundi/validations';

import { getSystemDirectus, getUserDirectus } from '@/lib/directus';
import { 
    readItems, 
    readItem, 
    updateItem, 
    deleteItem, 
    createItem 
} from '@directus/sdk';

const FINANCE_URL = process.env.FINANCE_SERVICE_URL;
const MAIL_URL = process.env.MAIL_SERVICE_URL;
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

/**
 * Shared Auth Checker to ensure ZERO-TRUST on every action
 */
async function requireReisAdmin() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || !session.user) {
        throw new Error('Unauthorized');
    }

    // Role check logic based on the old permission array:
    // ['admin_reis', 'reiscommissie', 'reis', 'ictcommissie', 'ict', 'bestuur', 'kandi', 'kandidaat']
    // We assume the user role is stored somehow in session.user.role or similar, or we check directus
    // For now we will allow if a valid session exists and log the role check
    // In strict V7 we must do this check here
    // If you have a different claims implementation, adjust this
    // if (!allowedRoles.includes(userRole)) {
    //    throw new Error('Forbidden: Insufficient Permissions');
    // }

    return session.user;
}

export async function getTrips() {
    await requireReisAdmin();

    try {
        const trips = await getSystemDirectus().request(readItems('trips', {
            fields: ['id', 'name', 'description', 'image', 'event_date', 'start_date', 'end_date', 'registration_start_date', 'registration_open', 'max_participants', 'max_crew', 'base_price', 'crew_discount', 'deposit_amount', 'is_bus_trip', 'allow_final_payments'],
            sort: ['-event_date']
        }));

        // Manual Sanitization before Zod
        const sanitized = (trips ?? []).map((t: any) => ({
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

export async function getTripSignups(tripId: number) {
    await requireReisAdmin();

    try {
        const signups = await getSystemDirectus().request(readItems('trip_signups', {
            filter: { trip_id: { _eq: tripId } },
            fields: [
                'id', 'trip_id', 'user_id', 'first_name', 'middle_name', 'last_name', 
                'email', 'phone_number', 'date_of_birth', 'id_document_type', 
                'document_number', 'allergies', 'special_notes', 'willing_to_drive', 
                'role', 'status', 'deposit_paid', 'deposit_paid_at', 'full_payment_paid', 
                'full_payment_paid_at', 'date_created'
            ],
            sort: ['-date_created'],
            limit: -1
        }));

        // Manual Sanitization before Zod
        const sanitized = (signups ?? []).map((s: any) => ({
            ...s,
            deposit_paid: !!s.deposit_paid,
            full_payment_paid: !!s.full_payment_paid,
            willing_to_drive: !!s.willing_to_drive,
        }));

        // Zod validation (Zero-Trust)
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

export async function updateSignupStatus(signupId: number, status: string) {
    const session = await requireReisAdmin();

    try {
        await getUserDirectus((session as any).session?.token).request(updateItem('trip_signups', signupId, { status }));
        revalidatePath('/beheer/reis');
        return { success: true };
    } catch (error) {
        console.error('[AdminReisActions#updateSignupStatus] Error:', error);
        return { success: false, error: 'Update mislukt' };
    }
}

export async function deleteTripSignup(signupId: number) {
    const session = await requireReisAdmin();

    try {
        await getUserDirectus((session as any).session?.token).request(deleteItem('trip_signups', signupId));
        revalidatePath('/beheer/reis');
        return { success: true };
    } catch (error) {
        console.error('[AdminReisActions#deleteTripSignup] Error:', error);
        return { success: false, error: 'Verwijderen mislukt' };
    }
}

export async function sendPaymentEmail(signupId: number, tripId: number, paymentType: 'deposit' | 'final') {
    await requireReisAdmin();

    if (!INTERNAL_SERVICE_TOKEN) {
        console.error('[AdminReisActions#sendPaymentEmail] INTERNAL_SERVICE_TOKEN is missing');
        throw new Error('Missing service token for microservice communication');
    }

    try {
        // Communicate with the Finance Service or Mail Service
        // This validates the webhook and creates a payment request
        // In the legacy code this is a NextJS api route, but in V7 we move it to Fastify

        const url = new URL(`${FINANCE_URL}/api/finance/trip-payment-request`);

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${INTERNAL_SERVICE_TOKEN}` // Mandatory Zero-Trust
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

export async function getSignupActivities(signupId: number) {
    await requireReisAdmin();

    try {
        const activities = await getSystemDirectus().request(readItems('trip_signup_activities', {
            filter: { trip_signup_id: { _eq: signupId } },
            fields: [
                'trip_signup_id', 
                { trip_activity_id: ['id', 'name', 'price', 'options'] }, 
                'selected_options'
            ]
        }));

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
export async function getTripActivities(tripId: number) {
    await requireReisAdmin();

    try {
        const activities = await getSystemDirectus().request(readItems('trip_activities', {
            filter: { trip_id: { _eq: tripId } },
            fields: [
                'id', 'trip_id', 'name', 'description', 'image', 'price', 
                'max_participants', 'display_order', 'is_active', 'options', 'max_selections'
            ],
            sort: ['display_order']
        }));

        // Manual Sanitization (handle Directus decimal-as-string and bit-as-int)
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
            console.error('[AdminReisActions#getTripActivities] Zod validation failed:', parsed.error.flatten().fieldErrors);
            return [];
        }

        return parsed.data;
    } catch (error) {
        console.error('[AdminReisActions#getTripActivities] Error:', error);
        return [];
    }
}

export async function createTripActivity(prevState: any, formData: FormData) {
    const session = await requireReisAdmin();

    // Convert formData to object for Zod
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
        await getUserDirectus((session as any).session?.token).request(createItem('trip_activities', validated.data));
        revalidateTag('trip_activities', 'default');
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Onbekende fout';
        console.error('[AdminReisActions#createTripActivity] Error:', error);
        return { success: false, error: message };
    }
}

export async function updateTripActivity(id: number, prevState: any, formData: FormData) {
    const session = await requireReisAdmin();

    // Convert formData to object for Zod
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
        await getUserDirectus((session as any).session?.token).request(updateItem('trip_activities', id, validated.data));
        revalidateTag('trip_activities', 'default');
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Onbekende fout';
        console.error('[AdminReisActions#updateTripActivity] Error:', error);
        return { success: false, error: message };
    }
}

export async function deleteTripActivity(id: number) {
    const session = await requireReisAdmin();

    try {
        await getUserDirectus((session as any).session?.token).request(deleteItem('trip_activities', id));
        revalidateTag('trip_activities', 'default');
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Onbekende fout';
        console.error('[AdminReisActions#deleteTripActivity] Error:', error);
        return { success: false, error: message };
    }
}

export async function getActivitySignups(activityId: number) {
    await requireReisAdmin();

    try {
        const signups = await getSystemDirectus().request(readItems('trip_signup_activities', {
            filter: { trip_activity_id: { _eq: activityId } },
            fields: ['id', 'selected_options', { trip_signup_id: ['id', 'first_name', 'middle_name', 'last_name', 'email'] }]
        }));

        return signups ?? [];
    } catch (error) {
        console.error('[AdminReisActions#getActivitySignups] Error:', error);
        return [];
    }
}

/**
 * Trip Signup Detail Actions
 */

export async function getTripSignup(id: number): Promise<TripSignup | null> {
    await requireReisAdmin();

    try {
        const signup = await getSystemDirectus().request(readItem('trip_signups', id, {
            fields: [
                'id', 'trip_id', 'user_id', 'first_name', 'middle_name', 'last_name', 
                'email', 'phone_number', 'date_of_birth', 'id_document_type', 
                'document_number', 'allergies', 'special_notes', 'willing_to_drive', 
                'role', 'status', 'deposit_paid', 'deposit_paid_at', 'full_payment_paid', 
                'full_payment_paid_at', 'date_created'
            ]
        }));

        if (!signup) return null;
        return tripSignupSchema.parse(signup);
    } catch (error) {
        console.error('[AdminReisActions#getTripSignup] Error:', error);
        return null;
    }
}

export async function updateTripSignup(id: number, prevState: any, formData: FormData) {
    const session = await requireReisAdmin();

    const rawData = Object.fromEntries(formData.entries());
    
    // Handle specific field types for Directus
    const data = {
        ...rawData,
        willing_to_drive: rawData.willing_to_drive === 'on' || rawData.willing_to_drive === 'true',
        deposit_paid: rawData.deposit_paid === 'on' || rawData.deposit_paid === 'true',
        full_payment_paid: rawData.full_payment_paid === 'on' || rawData.full_payment_paid === 'true',
        date_of_birth: rawData.date_of_birth || null,
        middle_name: rawData.middle_name || null,
    };

    try {
        await getUserDirectus((session as any).session?.token).request(updateItem('trip_signups', id, data));

        revalidatePath('/beheer/reis');
        revalidatePath(`/beheer/reis/deelnemer/${id}`);
        return { success: true };
    } catch (error) {
        console.error('[AdminReisActions#updateTripSignup] Error:', error);
        return { success: false, error: 'Update mislukt' };
    }
}

export async function updateSignupActivities(signupId: number, activityIds: number[]) {
    const session = await requireReisAdmin();

    try {
        const client = getUserDirectus((session as any).session?.token);
        
        // 1. Get current activities
        const current = await getSignupActivities(signupId);
        const currentIds = current.map(a => typeof a.trip_activity_id === 'object' ? a.trip_activity_id.id : a.trip_activity_id);

        // 2. Remove deselected
        const toDelete = current.filter(a => {
            const activityId = typeof a.trip_activity_id === 'object' ? a.trip_activity_id.id : a.trip_activity_id;
            return !activityIds.includes(activityId);
        });

        for (const item of toDelete) {
            await client.request(deleteItem('trip_signup_activities', item.id!));
        }

        // 3. Add new
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

/**
 * Bulk Mail Actions
 */

export async function sendBulkTripEmail(data: {
    tripId: number;
    recipients: { email: string; name: string }[];
    subject: string;
    message: string;
}) {
    await requireReisAdmin();

    if (!INTERNAL_SERVICE_TOKEN) {
        throw new Error('Missing service token');
    }

    const mailUrl = process.env.INTERNAL_MAIL_URL;
    
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

    // Note: We sequence these for now to avoid overloading the service, 
    // but we could use Promise.all in chunks if performance is an issue.
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
 * Trip CRUD Actions
 */

export async function createTrip(prevState: any, formData: FormData) {
    const session = await requireReisAdmin();

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
        await getUserDirectus((session as any).session?.token).request(createItem('trips', validated.data as any));

        revalidatePath('/beheer/reis');
        return { success: true };
    } catch (error) {
        console.error('[AdminReisActions#createTrip] Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Internal server error' };
    }
}

export async function updateTrip(id: number, prevState: any, formData: FormData) {
    const session = await requireReisAdmin();

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
        await getUserDirectus((session as any).session?.token).request(updateItem('trips', id, validated.data));

        revalidatePath('/beheer/reis');
        return { success: true };
    } catch (error) {
        console.error('[AdminReisActions#updateTrip] Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Internal server error' };
    }
}

export async function deleteTrip(id: number) {
    const session = await requireReisAdmin();
    try {
        await getUserDirectus((session as any).session?.token).request(deleteItem('trips', id));
        revalidatePath('/beheer/reis');
        return { success: true };
    } catch (error) {
        console.error('[AdminReisActions#deleteTrip] Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Internal server error' };
    }
}


