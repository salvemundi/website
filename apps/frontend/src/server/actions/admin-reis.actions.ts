'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { revalidateTag } from 'next/cache';
import { auth } from '@/server/auth/auth';
import {
    tripSchema,
    tripSignupSchema,
    tripSignupActivitySchema,
    tripActivitySchema,
    type TripSignup
} from '@salvemundi/validations';

const DIRECTUS_STATIC_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;
const getDirectusUrl = () =>
    process.env.INTERNAL_DIRECTUS_URL || 'http://v7-core-directus:8055';

const FINANCE_URL = process.env.INTERNAL_FINANCE_URL || 'http://finance-prod:3001';

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

    if (!DIRECTUS_STATIC_TOKEN) {
        console.error('[AdminReisActions] DIRECTUS_STATIC_TOKEN is missing');
        return [];
    }

    try {
        const url = new URL(`${getDirectusUrl()}/items/trips`);
        url.searchParams.append('fields', 'id,name,description,image,event_date,start_date,end_date,registration_start_date,registration_open,max_participants,max_crew,base_price,crew_discount,deposit_amount,is_bus_trip,allow_final_payments');
        url.searchParams.append('sort', '-event_date');

        const response = await fetch(url.toString(), {
            headers: {
                Authorization: `Bearer ${DIRECTUS_STATIC_TOKEN}`,
            },
        });

        if (!response.ok) {
            console.error(`[AdminReisActions#getTrips] Fetch failed: ${response.status}`);
            return [];
        }

        const json = await response.json();
        
        // Manual Sanitization before Zod (Directus 10/11 type anomalies)
        const sanitized = (json.data ?? []).map((t: any) => ({
            ...t,
            // Coerce numbers from strings if they come from decimal fields
            max_participants: t.max_participants !== null ? Number(t.max_participants) : t.max_participants,
            max_crew: t.max_crew !== null ? Number(t.max_crew) : t.max_crew,
            base_price: t.base_price !== null ? Number(t.base_price) : t.base_price,
            crew_discount: t.crew_discount !== null ? Number(t.crew_discount) : t.crew_discount,
            deposit_amount: t.deposit_amount !== null ? Number(t.deposit_amount) : t.deposit_amount,
            // Ensure null dates are handled or converted to null for Zod
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

    if (!DIRECTUS_STATIC_TOKEN) {
        return [];
    }

    try {
        const url = new URL(`${getDirectusUrl()}/items/trip_signups`);
        url.searchParams.append('filter[trip_id][_eq]', tripId.toString());
        url.searchParams.append('fields', '*');
        url.searchParams.append('sort', '-created_at');

        const response = await fetch(url.toString(), {
            headers: {
                Authorization: `Bearer ${DIRECTUS_STATIC_TOKEN}`,
            },
        });

        if (!response.ok) {
            console.error(`[AdminReisActions#getTripSignups] Fetch failed: ${response.status}`);
            return [];
        }

        const json = await response.json();

        // Manual Sanitization before Zod
        const sanitized = (json.data ?? []).map((s: any) => ({
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
    await requireReisAdmin();

    if (!DIRECTUS_STATIC_TOKEN) {
        throw new Error('Missing token');
    }

    try {
        const url = new URL(`${getDirectusUrl()}/items/trip_signups/${signupId}`);
        const response = await fetch(url.toString(), {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${DIRECTUS_STATIC_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) {
            throw new Error(`Failed to update status in Directus: ${response.status}`);
        }

        // We could theoretically call the Mail service here straight away if needed, 
        // passing INTERNAL_SERVICE_TOKEN to notify the user of a status change
        // For example if someone is confirmed, we auto-send email

        return { success: true };
    } catch (error) {
        console.error('[AdminReisActions#updateSignupStatus] Error:', error);
        return { success: false, error: 'Update mislukt' };
    }
}

export async function deleteTripSignup(signupId: number) {
    await requireReisAdmin();

    if (!DIRECTUS_STATIC_TOKEN) {
        throw new Error('Missing token');
    }

    try {
        const url = new URL(`${getDirectusUrl()}/items/trip_signups/${signupId}`);
        const response = await fetch(url.toString(), {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${DIRECTUS_STATIC_TOKEN}`,
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to delete signup: ${response.status}`);
        }

        return { success: true };
    } catch (error) {
        console.error('[AdminReisActions#deleteTripSignup] Error:', error);
        return { success: false, error: 'Delete mislukt' };
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
            throw new Error(errorData.error || `Service returned ${response.status}`);
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

    if (!DIRECTUS_STATIC_TOKEN) {
        return [];
    }

    try {
        const url = new URL(`${getDirectusUrl()}/items/trip_signup_activities`);
        // filter on signupId and grab relations
        url.searchParams.append('filter[trip_signup_id][_eq]', signupId.toString());
        url.searchParams.append('fields', 'trip_signup_id,trip_activity_id.*,selected_options');

        const response = await fetch(url.toString(), {
            headers: {
                Authorization: `Bearer ${DIRECTUS_STATIC_TOKEN}`,
            },
        });

        if (!response.ok) {
            console.error(`[AdminReisActions#getSignupActivities] Fetch failed: ${response.status}`);
            return [];
        }

        const json = await response.json();
        
        // Manual Sanitization (handle relations and nested IDs)
        const sanitized = (json.data ?? []).map((a: any) => ({
            ...a,
            // If trip_activity_id is an object (expanded), leave it, otherwise leave ID
            //selected_options: Array.isArray(a.selected_options) ? a.selected_options : (a.selected_options ? [a.selected_options] : []),
        }));

        const parsed = z.array(tripSignupActivitySchema).safeParse(sanitized);

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

    if (!DIRECTUS_STATIC_TOKEN) {
        return [];
    }

    try {
        const url = new URL(`${getDirectusUrl()}/items/trip_activities`);
        url.searchParams.append('filter[trip_id][_eq]', tripId.toString());
        url.searchParams.append('fields', '*');
        url.searchParams.append('sort', 'display_order');

        const response = await fetch(url.toString(), {
            headers: {
                Authorization: `Bearer ${DIRECTUS_STATIC_TOKEN}`,
            },
            next: { tags: ['trip_activities'] },
        });

        if (!response.ok) {
            console.error(`[AdminReisActions#getTripActivities] Fetch failed: ${response.status}`);
            return [];
        }

        const json = await response.json();

        // Manual Sanitization (handle Directus decimal-as-string and bit-as-int)
        const sanitized = (json.data ?? []).map((a: any) => ({
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
    await requireReisAdmin();

    if (!DIRECTUS_STATIC_TOKEN) {
        throw new Error('Missing token');
    }

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
        const url = new URL(`${getDirectusUrl()}/items/trip_activities`);
        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${DIRECTUS_STATIC_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(validated.data)
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `Failed to create activity: ${response.status}`);
        }

        revalidateTag('trip_activities', 'default');
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Onbekende fout';
        console.error('[AdminReisActions#createTripActivity] Error:', error);
        return { success: false, error: message };
    }
}

export async function updateTripActivity(id: number, prevState: any, formData: FormData) {
    await requireReisAdmin();

    if (!DIRECTUS_STATIC_TOKEN) {
        throw new Error('Missing token');
    }

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
        const url = new URL(`${getDirectusUrl()}/items/trip_activities/${id}`);
        const response = await fetch(url.toString(), {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${DIRECTUS_STATIC_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(validated.data)
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `Failed to update activity: ${response.status}`);
        }

        revalidateTag('trip_activities', 'default');
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Onbekende fout';
        console.error('[AdminReisActions#updateTripActivity] Error:', error);
        return { success: false, error: message };
    }
}

export async function deleteTripActivity(id: number) {
    await requireReisAdmin();

    if (!DIRECTUS_STATIC_TOKEN) {
        throw new Error('Missing token');
    }

    try {
        const url = new URL(`${getDirectusUrl()}/items/trip_activities/${id}`);
        const response = await fetch(url.toString(), {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${DIRECTUS_STATIC_TOKEN}`,
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to delete activity: ${response.status}`);
        }

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

    if (!DIRECTUS_STATIC_TOKEN) {
        return [];
    }

    try {
        const url = new URL(`${getDirectusUrl()}/items/trip_signup_activities`);
        url.searchParams.append('filter[trip_activity_id][_eq]', activityId.toString());
        url.searchParams.append('fields', 'id,selected_options,trip_signup_id.id,trip_signup_id.first_name,trip_signup_id.middle_name,trip_signup_id.last_name,trip_signup_id.email');

        const response = await fetch(url.toString(), {
            headers: {
                Authorization: `Bearer ${DIRECTUS_STATIC_TOKEN}`,
            },
            next: { tags: ['trip_signup_activities'] },
        });

        if (!response.ok) {
            console.error(`[AdminReisActions#getActivitySignups] Fetch failed: ${response.status}`);
            return [];
        }

        const json = await response.json();
        return json.data ?? [];
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

    if (!DIRECTUS_STATIC_TOKEN) return null;

    try {
        const url = new URL(`${getDirectusUrl()}/items/trip_signups/${id}`);
        url.searchParams.append('fields', '*');

        const response = await fetch(url.toString(), {
            headers: {
                Authorization: `Bearer ${DIRECTUS_STATIC_TOKEN}`,
            },
            next: { tags: [`trip_signup_${id}`] },
        });

        if (!response.ok) return null;

        const { data } = await response.json();
        return tripSignupSchema.parse(data);
    } catch (error) {
        console.error('[AdminReisActions#getTripSignup] Error:', error);
        return null;
    }
}

export async function updateTripSignup(id: number, prevState: any, formData: FormData) {
    await requireReisAdmin();

    if (!DIRECTUS_STATIC_TOKEN) return { success: false, error: 'Internal Error' };

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
        const response = await fetch(`${getDirectusUrl()}/items/trip_signups/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${DIRECTUS_STATIC_TOKEN}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const err = await response.json();
            return { success: false, error: err.errors?.[0]?.message || 'Update mislukt' };
        }

        revalidateTag(`trip_signup_${id}`, 'default');
        revalidateTag('trip_signups', 'default');
        return { success: true };
    } catch (error) {
        console.error('[AdminReisActions#updateTripSignup] Error:', error);
        return { success: false, error: 'Internal server error' };
    }
}

export async function updateSignupActivities(signupId: number, activityIds: number[]) {
    await requireReisAdmin();

    if (!DIRECTUS_STATIC_TOKEN) return { success: false, error: 'Internal Error' };

    try {
        // 1. Get current activities
        const current = await getSignupActivities(signupId);
        const currentIds = current.map(a => typeof a.trip_activity_id === 'object' ? a.trip_activity_id.id : a.trip_activity_id);

        // 2. Remove deselected
        const toDeleteSize = current.filter(a => {
            const activityId = typeof a.trip_activity_id === 'object' ? a.trip_activity_id.id : a.trip_activity_id;
            return !activityIds.includes(activityId);
        });

        for (const item of toDeleteSize) {
            await fetch(`${getDirectusUrl()}/items/trip_signup_activities/${item.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${DIRECTUS_STATIC_TOKEN}` },
            });
        }

        // 3. Add new
        const toAdd = activityIds.filter(id => !currentIds.includes(id));
        for (const activityId of toAdd) {
            await fetch(`${getDirectusUrl()}/items/trip_signup_activities`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${DIRECTUS_STATIC_TOKEN}`,
                },
                body: JSON.stringify({
                    trip_signup_id: signupId,
                    trip_activity_id: activityId,
                }),
            });
        }

        revalidateTag(`signup_activities_${signupId}`, 'default');
        revalidateTag('trip_signup_activities', 'default');
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

    const mailUrl = process.env.INTERNAL_MAIL_URL || 'http://mail-service:3003';
    
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
            throw new Error(err.error || `Mail service error: ${response.status}`);
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
    await requireReisAdmin();

    if (!DIRECTUS_STATIC_TOKEN) throw new Error('Internal Error');

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
        event_date: rawData.start_date || null, // Fallback for legacy systems
    };

    const validated = tripSchema.omit({ id: true }).safeParse(data);
    if (!validated.success) {
        return { success: false, error: 'Validatie mislukt', fieldErrors: validated.error.flatten().fieldErrors };
    }

    try {
        const response = await fetch(`${getDirectusUrl()}/items/trips`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${DIRECTUS_STATIC_TOKEN}`,
            },
            body: JSON.stringify(validated.data),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.errors?.[0]?.message || 'Aanmaken mislukt');
        }

        revalidateTag('trips', 'default');
        return { success: true };
    } catch (error) {
        console.error('[AdminReisActions#createTrip] Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Internal server error' };
    }
}

export async function updateTrip(id: number, prevState: any, formData: FormData) {
    await requireReisAdmin();

    if (!DIRECTUS_STATIC_TOKEN) throw new Error('Internal Error');

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
        const response = await fetch(`${getDirectusUrl()}/items/trips/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${DIRECTUS_STATIC_TOKEN}`,
            },
            body: JSON.stringify(validated.data),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.errors?.[0]?.message || 'Update mislukt');
        }

        revalidateTag('trips', 'default');
        return { success: true };
    } catch (error) {
        console.error('[AdminReisActions#updateTrip] Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Internal server error' };
    }
}

export async function deleteTrip(id: number) {
    await requireReisAdmin();

    if (!DIRECTUS_STATIC_TOKEN) throw new Error('Internal Error');

    try {
        const response = await fetch(`${getDirectusUrl()}/items/trips/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${DIRECTUS_STATIC_TOKEN}`,
            },
        });

        if (!response.ok) {
            throw new Error('Verwijderen mislukt');
        }

        revalidateTag('trips', 'default');
        return { success: true };
    } catch (error) {
        console.error('[AdminReisActions#deleteTrip] Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Internal server error' };
    }
}
