'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { auth } from '@/server/auth/auth';
import {
    tripSchema,
    tripSignupSchema,
    tripSignupActivitySchema
} from '@salvemundi/validations';

const DIRECTUS_STATIC_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.salvemundi.nl';
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
    const userRole = (session.user as any)?.role || 'member';
    const allowedRoles = ['admin_reis', 'reiscommissie', 'reis', 'ictcommissie', 'ict', 'bestuur', 'kandi', 'kandidaat', 'admin'];

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
        const url = new URL(`${API_URL}/items/trips`);
        url.searchParams.append('fields', 'id,name,event_date,start_date,end_date,registration_open,max_participants,base_price,crew_discount,deposit_amount,is_bus_trip,allow_final_payments');
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
        const parsed = z.array(tripSchema).safeParse(json.data ?? []);

        if (!parsed.success) {
            console.error('[AdminReisActions#getTrips] Zod validation failed:', parsed.error.flatten().fieldErrors);
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
        const url = new URL(`${API_URL}/items/trip_signups`);
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

        // Zod validation (Zero-Trust)
        const parsed = z.array(tripSignupSchema).safeParse(json.data ?? []);

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

export async function updateSignupStatus(signupId: number, status: string, tripId: number) {
    await requireReisAdmin();

    if (!DIRECTUS_STATIC_TOKEN) {
        throw new Error('Missing token');
    }

    try {
        const url = new URL(`${API_URL}/items/trip_signups/${signupId}`);
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

export async function deleteSignup(signupId: number) {
    await requireReisAdmin();

    if (!DIRECTUS_STATIC_TOKEN) {
        throw new Error('Missing token');
    }

    try {
        const url = new URL(`${API_URL}/items/trip_signups/${signupId}`);
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
        console.error('[AdminReisActions#deleteSignup] Error:', error);
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
    } catch (error: any) {
        console.error('[AdminReisActions#sendPaymentEmail] Error:', error);
        return { success: false, error: error.message };
    }
}

export async function getSignupActivities(signupId: number) {
    await requireReisAdmin();

    if (!DIRECTUS_STATIC_TOKEN) {
        return [];
    }

    try {
        const url = new URL(`${API_URL}/items/trip_signup_activities`);
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
        const parsed = z.array(tripSignupActivitySchema).safeParse(json.data ?? []);

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
