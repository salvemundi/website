'use server';

import { verifyUserPermissions } from './secure-check';
import { serverDirectusFetch } from '@/shared/lib/server-directus';
import { revalidatePath } from 'next/cache';

// --- Types ---

export interface Trip {
    id: number;
    name: string;
    description?: string | null;
    image?: string | null;
    event_date: string;
    start_date?: string;
    end_date?: string;
    registration_start_date?: string | null;
    registration_open: boolean;
    max_participants: number;
    max_crew?: number;
    base_price: number;
    crew_discount: number;
    deposit_amount: number;
    is_bus_trip: boolean;
    allow_final_payments?: boolean;
}

export interface TripSignup {
    id: number;
    trip_id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    email: string;
    phone_number: string;
    date_of_birth: string | null;
    id_document_type: string | null;
    document_number: string | null;
    allergies: string | null;
    alergies: string | null; // Compatibility with typo in schema
    special_notes: string | null;
    willing_to_drive: boolean | null;
    role: string;
    status: string;
    deposit_paid: boolean;
    deposit_paid_at: string | null;
    full_payment_paid: boolean;
    full_payment_paid_at: string | null;
    deposit_email_sent?: boolean;
    final_email_sent?: boolean;
    created_at: string;
}

export interface TripSignupActivity {
    id: number;
    name: string;
    price: number;
}

export interface TripActivity {
    id: number;
    name: string;
    price: number;
    description?: string;
    trip_id?: number;
    options?: any;
    image?: string;
    max_participants?: number;
    is_active?: boolean;
    display_order?: number;
    max_selections?: number;
}

// Permissions for Reis Admin
const REIS_PERMISSIONS = {
    commissie_tokens: ['reiscommissie', 'reis', 'ictcommissie', 'ict', 'bestuur', 'kandi', 'kandidaat'],
    roles: ['Administrator']
};

/**
 * Create a new trip
 */
export async function createTripAction(data: Partial<Trip>): Promise<{ success: boolean; id: number }> {
    await verifyUserPermissions(REIS_PERMISSIONS);

    try {
        const res = await serverDirectusFetch<any>(`/items/trips`, {
            method: 'POST',
            body: JSON.stringify(data)
        });

        revalidatePath('/admin/reis');
        revalidatePath('/admin/reis/instellingen');
        return { success: true, id: res.id };
    } catch (error) {
        console.error('createTripAction failed:', error);
        throw new Error('Failed to create trip');
    }
}

/**
 * Update a trip
 */
export async function updateTripAction(id: number, data: Partial<Trip>): Promise<{ success: boolean }> {
    await verifyUserPermissions(REIS_PERMISSIONS);

    try {
        await serverDirectusFetch(`/items/trips/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });

        revalidatePath('/admin/reis');
        revalidatePath('/admin/reis/instellingen');
        return { success: true };
    } catch (error) {
        console.error('updateTripAction failed:', error);
        throw new Error('Failed to update trip');
    }
}

/**
 * Delete a trip
 */
export async function deleteTripAction(id: number): Promise<{ success: boolean }> {
    await verifyUserPermissions(REIS_PERMISSIONS);

    try {
        await serverDirectusFetch(`/items/trips/${id}`, {
            method: 'DELETE'
        });

        revalidatePath('/admin/reis');
        revalidatePath('/admin/reis/instellingen');
        return { success: true };
    } catch (error) {
        console.error('deleteTripAction failed:', error);
        throw new Error('Failed to delete trip');
    }
}

/**
 * Fetch all trips (More fields for settings)
 */
export async function getTripsFullAction(): Promise<any[]> {
    await verifyUserPermissions(REIS_PERMISSIONS);

    try {
        return await serverDirectusFetch<any[]>(
            '/items/trips?fields=*&sort=-event_date'
        );
    } catch (error) {
        console.error('getTripsFullAction failed:', error);
        return [];
    }
}
export async function getTripsAction(): Promise<Trip[]> {
    // Basic auth check
    await verifyUserPermissions({});

    try {
        return await serverDirectusFetch<Trip[]>(
            '/items/trips?fields=id,name,event_date,start_date,end_date,registration_open,max_participants,base_price,crew_discount,deposit_amount,is_bus_trip,allow_final_payments&sort=-event_date'
        );
    } catch (error) {
        console.error('getTripsAction failed:', error);
        return [];
    }
}

/**
 * Fetch a specific trip signup by ID
 */
export async function getTripSignupByIdAction(id: number): Promise<TripSignup | null> {
    await verifyUserPermissions(REIS_PERMISSIONS);

    try {
        return await serverDirectusFetch<TripSignup>(`/items/trip_signups/${id}?fields=*`);
    } catch (error) {
        console.error('getTripSignupByIdAction failed:', error);
        return null;
    }
}

/**
 * CRUD for trip activities
 */
export async function createTripActivityAction(data: Partial<TripActivity>): Promise<{ success: boolean; id: number }> {
    await verifyUserPermissions(REIS_PERMISSIONS);

    try {
        const res = await serverDirectusFetch<any>(`/items/trip_activities`, {
            method: 'POST',
            body: JSON.stringify(data)
        });

        revalidatePath('/admin/reis/activiteiten');
        return { success: true, id: res.id };
    } catch (error) {
        console.error('createTripActivityAction failed:', error);
        throw new Error('Failed to create activity');
    }
}

export async function updateTripActivityAction(id: number, data: Partial<TripActivity>): Promise<{ success: boolean }> {
    await verifyUserPermissions(REIS_PERMISSIONS);

    try {
        await serverDirectusFetch(`/items/trip_activities/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });

        revalidatePath('/admin/reis/activiteiten');
        return { success: true };
    } catch (error) {
        console.error('updateTripActivityAction failed:', error);
        throw new Error('Failed to update activity');
    }
}

export async function deleteTripActivityAction(id: number): Promise<{ success: boolean }> {
    await verifyUserPermissions(REIS_PERMISSIONS);

    try {
        await serverDirectusFetch(`/items/trip_activities/${id}`, {
            method: 'DELETE'
        });

        revalidatePath('/admin/reis/activiteiten');
        return { success: true };
    } catch (error) {
        console.error('deleteTripActivityAction failed:', error);
        throw new Error('Failed to delete activity');
    }
}

/**
 * Fetch signups for a specific activity
 */
export async function getTripActivitySignupsAction(activityId: number): Promise<any[]> {
    await verifyUserPermissions(REIS_PERMISSIONS);

    try {
        return await serverDirectusFetch<any[]>(
            `/items/trip_signup_activities?filter[trip_activity_id][_eq]=${activityId}&fields=id,selected_options,trip_signup_id.*`
        );
    } catch (error) {
        console.error('getTripActivitySignupsAction failed:', error);
        return [];
    }
}

/**
 * Fetch all available activities for a specific trip with more details
 */
export async function getTripActivitiesFullByTripIdAction(tripId: number): Promise<any[]> {
    await verifyUserPermissions(REIS_PERMISSIONS);

    try {
        return await serverDirectusFetch<any[]>(
            `/items/trip_activities?filter[trip_id][_eq]=${tripId}&fields=*&sort=name`
        );
    } catch (error) {
        console.error('getTripActivitiesFullByTripIdAction failed:', error);
        return [];
    }
}
export async function getTripActivitiesByTripIdAction(tripId: number): Promise<TripActivity[]> {
    await verifyUserPermissions(REIS_PERMISSIONS);

    try {
        return await serverDirectusFetch<TripActivity[]>(
            `/items/trip_activities?filter[trip_id][_eq]=${tripId}&fields=id,name,price&sort=name`
        );
    } catch (error) {
        console.error('getTripActivitiesByTripIdAction failed:', error);
        return [];
    }
}
export async function getTripSignupsAction(tripId: number): Promise<TripSignup[]> {
    await verifyUserPermissions(REIS_PERMISSIONS);

    try {
        return await serverDirectusFetch<TripSignup[]>(
            `/items/trip_signups?filter[trip_id][_eq]=${tripId}&fields=*&sort=-created_at`
        );
    } catch (error) {
        console.error('getTripSignupsAction failed:', error);
        return [];
    }
}

/**
 * Fetch activities for a specific signup
 */
export async function getTripSignupActivitiesAction(signupId: number): Promise<TripSignupActivity[]> {
    await verifyUserPermissions(REIS_PERMISSIONS);

    try {
        const items = await serverDirectusFetch<any[]>(
            `/items/trip_signup_activities?filter[trip_signup_id][_eq]=${signupId}&fields=id,trip_activity_id.*,selected_options`
        );

        return items.map(it => {
            const a = it.trip_activity_id;
            if (!a) return null;

            let activityName = a.name || '';
            let activityPrice = Number(a.price) || 0;

            const selectedOptions = it.selected_options;
            if (selectedOptions && Array.isArray(selectedOptions) && a.options) {
                const addedOptions: string[] = [];
                selectedOptions.forEach((optName: string) => {
                    const optDef = a.options.find((o: any) => o.name === optName);
                    if (optDef) {
                        activityPrice += Number(optDef.price) || 0;
                        addedOptions.push(optName);
                    }
                });
                if (addedOptions.length > 0) {
                    activityName += ` (+ ${addedOptions.join(', ')})`;
                }
            }

            return { id: a.id, name: activityName, price: activityPrice };
        }).filter(Boolean) as TripSignupActivity[];
    } catch (error) {
        console.error('getTripSignupActivitiesAction failed:', error);
        return [];
    }
}

/**
 * Update trip signup status
 */
export async function updateTripSignupStatusAction(id: number, newStatus: string): Promise<{ success: boolean }> {
    await verifyUserPermissions(REIS_PERMISSIONS);

    try {
        await serverDirectusFetch(`/items/trip_signups/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus })
        });

        revalidatePath('/admin/reis');
        return { success: true };
    } catch (error) {
        console.error('updateTripSignupStatusAction failed:', error);
        throw new Error('Failed to update status');
    }
}

/**
 * Full update of trip signup
 */
export async function updateTripSignupAction(id: number, data: Partial<TripSignup>): Promise<{ success: boolean }> {
    await verifyUserPermissions(REIS_PERMISSIONS);

    try {
        await serverDirectusFetch(`/items/trip_signups/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });

        revalidatePath('/admin/reis');
        revalidatePath(`/admin/reis/deelnemer/${id}`);
        return { success: true };
    } catch (error) {
        console.error('updateTripSignupAction failed:', error);
        throw new Error('Failed to update signup');
    }
}

/**
 * Create a link between signup and activity
 */
export async function createTripSignupActivityAction(data: { trip_signup_id: number; trip_activity_id: number }): Promise<{ success: boolean; id: number }> {
    await verifyUserPermissions(REIS_PERMISSIONS);

    try {
        const res = await serverDirectusFetch<any>(`/items/trip_signup_activities`, {
            method: 'POST',
            body: JSON.stringify(data)
        });

        return { success: true, id: res.id };
    } catch (error) {
        console.error('createTripSignupActivityAction failed:', error);
        throw new Error('Failed to link activity');
    }
}

/**
 * Delete a link between signup and activity
 */
export async function deleteTripSignupActivityAction(id: number): Promise<{ success: boolean }> {
    await verifyUserPermissions(REIS_PERMISSIONS);

    try {
        await serverDirectusFetch(`/items/trip_signup_activities/${id}`, {
            method: 'DELETE'
        });

        return { success: true };
    } catch (error) {
        console.error('deleteTripSignupActivityAction failed:', error);
        throw new Error('Failed to unlink activity');
    }
}

/**
 * Fetch all signup-activity links for a signup
 */
export async function getTripSignupActivitiesRawAction(signupId: number): Promise<any[]> {
    await verifyUserPermissions(REIS_PERMISSIONS);

    try {
        return await serverDirectusFetch<any[]>(
            `/items/trip_signup_activities?filter[trip_signup_id][_eq]=${signupId}&fields=id,trip_signup_id,trip_activity_id.id,trip_activity_id.name`
        );
    } catch (error) {
        console.error('getTripSignupActivitiesRawAction failed:', error);
        return [];
    }
}
export async function deleteTripSignupAction(id: number): Promise<{ success: boolean }> {
    await verifyUserPermissions(REIS_PERMISSIONS);

    try {
        await serverDirectusFetch(`/items/trip_signups/${id}`, {
            method: 'DELETE'
        });

        revalidatePath('/admin/reis');
        return { success: true };
    } catch (error) {
        console.error('deleteTripSignupAction failed:', error);
        throw new Error('Failed to delete signup');
    }
}

/**
 * Trigger bulk email for a trip
 */
export async function sendTripBulkEmailAction(data: {
    tripId: number;
    tripName: string;
    recipients: { email: string; name: string }[];
    subject: string;
    message: string;
}): Promise<{ success: boolean; count?: number }> {
    await verifyUserPermissions(REIS_PERMISSIONS);

    const serviceSecret = process.env.SERVICE_SECRET || '';
    const financeApiUrl = process.env.INTERNAL_FINANCE_URL || 'http://localhost:3001';

    try {
        const response = await fetch(`${financeApiUrl}/trip-email/send-bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-internal-api-secret': serviceSecret
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to send bulk email');
        }

        return await response.json();
    } catch (error: any) {
        console.error('sendTripBulkEmailAction failed:', error);
        throw new Error(error.message || 'Failed to trigger bulk email');
    }
}
/**
 * Trigger payment email via Finance service
 */
export async function sendTripPaymentEmailAction(signupId: number, tripId: number, paymentType: 'deposit' | 'final'): Promise<{ success: boolean; message?: string }> {
    await verifyUserPermissions(REIS_PERMISSIONS);

    const financeApiUrl = process.env.INTERNAL_FINANCE_URL || 'http://finance:3002';
    const serviceSecret = process.env.SERVICE_SECRET;

    if (!serviceSecret) {
        throw new Error('Internal Error: Service Secret not configured');
    }

    try {
        const response = await fetch(`${financeApiUrl}/trip-email/payment-request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-internal-api-secret': serviceSecret
            },
            body: JSON.stringify({
                signupId,
                tripId,
                paymentType
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || 'Finance service failed to send email');
        }

        return { success: true };
    } catch (error: any) {
        console.error('sendTripPaymentEmailAction failed:', error);
        throw new Error(error.message || 'Failed to trigger email');
    }
}

/**
 * Trigger status update email via Finance service
 */
export async function sendTripStatusUpdateEmailAction(signupId: number, tripId: number, newStatus: string, oldStatus: string): Promise<{ success: boolean }> {
    await verifyUserPermissions(REIS_PERMISSIONS);

    const financeApiUrl = process.env.INTERNAL_FINANCE_URL || 'http://finance:3002';
    const serviceSecret = process.env.SERVICE_SECRET;

    if (!serviceSecret) {
        throw new Error('Internal Error: Service Secret not configured');
    }

    try {
        await fetch(`${financeApiUrl}/trip-email/status-update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-internal-api-secret': serviceSecret
            },
            body: JSON.stringify({
                signupId,
                tripId,
                newStatus,
                oldStatus
            })
        });

        return { success: true };
    } catch (error) {
        console.error('sendTripStatusUpdateEmailAction failed:', error);
        return { success: false };
    }
}
