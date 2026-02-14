'use server';

import { verifyUserPermissions } from './secure-check';
import { serverDirectusFetch, COLLECTION_TAGS } from '@/shared/lib/server-directus';
import { revalidatePath, revalidateTag } from 'next/cache';
import { sendActivityCancellationEmail } from '@/shared/lib/services/email-service';

const ADMIN_TOKENS = ['ict', 'bestuur', 'kandi'];

interface Committee {
    id: number;
    name: string;
}

export interface Event {
    id: number;
    name: string;
    event_date: string;
    event_date_end?: string;
    event_time?: string;
    event_time_end?: string;
    description: string;
    description_logged_in?: string;
    location?: string;
    max_sign_ups?: number;
    contact?: string;
    price_members?: number;
    price_non_members?: number;
    inschrijf_deadline?: string;
    signup_count?: number;
    image?: any;
    status?: 'published' | 'draft' | 'archived';
    publish_date?: string;
    committee_id?: number | any;
    only_members?: boolean;
}

export interface Signup {
    id: number;
    participant_name?: string;
    participant_email?: string;
    participant_phone?: string;
    payment_status: string;
    created_at: string;
    directus_relations?: {
        id: string;
        first_name?: string;
        last_name?: string;
        email?: string;
        phone_number?: string;
    };
}

/**
 * Checks if user has permission to manage a specific event
 * Users must be in Board/ICT/Kandi OR the committee that owns the activity.
 */
async function verifyEventManagementPermission(eventId: number | null) {
    const context = await verifyUserPermissions({}); // Auth check only

    const userRole = context.role;
    const userTokens = context.committees.map(c => c.token);

    // Admin/Board/ICT/Kandi always has access
    if (userRole === 'Administrator' || userTokens.some(t => ADMIN_TOKENS.includes(t))) {
        return context;
    }

    // For specific event, check ownership
    if (eventId) {
        const event = await serverDirectusFetch<any>(`/items/events/${eventId}?fields=committee_id.commissie_token`);
        const eventCommitteeToken = event.committee_id?.commissie_token;

        if (eventCommitteeToken && userTokens.includes(eventCommitteeToken.toLowerCase())) {
            return context;
        }
    }

    throw new Error('Access Denied: Insufficient permissions to manage this activity');
}

/**
 * Fetch all events for admin dashboard
 */
export async function getEventsAction(): Promise<Event[]> {
    await verifyUserPermissions({}); // Basic auth check

    try {
        const events = await serverDirectusFetch<Event[]>(
            '/items/events?fields=id,name,event_date,event_date_end,description,location,max_sign_ups,price_members,price_non_members,inschrijf_deadline,contact,image.id,committee_id,status,publish_date&sort=-event_date&limit=-1',
            { revalidate: 0 }
        );

        // Fetch signup counts in parallel
        const eventsWithCounts = await Promise.all(
            events.map(async (event) => {
                try {
                    const signups = await serverDirectusFetch<any[]>(
                        `/items/event_signups?aggregate[count]=*&filter[event_id][_eq]=${event.id}`,
                        { revalidate: 0 }
                    );
                    return {
                        ...event,
                        signup_count: (signups as any)?.[0]?.count || 0
                    };
                } catch (error) {
                    return { ...event, signup_count: 0 };
                }
            })
        );

        return eventsWithCounts;
    } catch (error) {
        console.error('getEventsAction failed:', error);
        throw new Error('Failed to fetch events');
    }
}

/**
 * Fetch a single event by ID
 */
export async function getEventByIdAction(eventId: number): Promise<Event> {
    // Basic auth check
    await verifyUserPermissions({});

    try {
        return await serverDirectusFetch<Event>(`/items/events/${eventId}?fields=*,committee_id.name,committee_id.commissie_email,committee_id.id`);
    } catch (error) {
        console.error('getEventByIdAction failed:', error);
        throw new Error('Failed to fetch event');
    }
}

/**
 * Create a new event
 */
export async function createEventAction(data: Partial<Event>): Promise<{ success: boolean; id: number }> {
    // Only ICT/Board/Kandi or someone with committee access should create
    // Since creation requires a committee_id, we should verify the user is in that committee
    const context = await verifyUserPermissions({});
    const userTokens = context.committees.map(c => c.token);
    const isGlobalAdmin = context.role === 'Administrator' || userTokens.some(t => ADMIN_TOKENS.includes(t));

    if (!isGlobalAdmin && data.committee_id) {
        // Need to fetch committee token to verify
        const committee = await serverDirectusFetch<any>(`/items/committees/${data.committee_id}?fields=commissie_token`);
        if (!committee?.commissie_token || !userTokens.includes(committee.commissie_token.toLowerCase())) {
            throw new Error('Access Denied: You cannot create an event for this committee');
        }
    } else if (!isGlobalAdmin) {
        throw new Error('Access Denied: Global admins only or committee required');
    }

    try {
        const res = await serverDirectusFetch<any>('/items/events', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        revalidatePath('/admin/activiteiten');
        revalidateTag(COLLECTION_TAGS.EVENTS, { expire: 0 });
        return { success: true, id: res.id };
    } catch (error) {
        console.error('createEventAction failed:', error);
        throw new Error('Failed to create event');
    }
}

/**
 * Update an existing event
 */
export async function updateEventAction(id: number, data: Partial<Event>): Promise<{ success: boolean }> {
    await verifyEventManagementPermission(id);

    try {
        await serverDirectusFetch(`/items/events/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });

        revalidatePath('/admin/activiteiten');
        revalidatePath(`/admin/activiteiten/${id}`);
        revalidateTag(COLLECTION_TAGS.EVENTS, { expire: 0 });
        return { success: true };
    } catch (error) {
        console.error('updateEventAction failed:', error);
        throw new Error('Failed to update event');
    }
}

/**
 * Delete an event
 */
export async function deleteEventAction(id: number): Promise<{ success: boolean }> {
    await verifyEventManagementPermission(id);

    try {
        await serverDirectusFetch(`/items/events/${id}`, {
            method: 'DELETE'
        });

        revalidatePath('/admin/activiteiten');
        revalidateTag(COLLECTION_TAGS.EVENTS, { expire: 0 });
        return { success: true };
    } catch (error) {
        console.error('deleteEventAction failed:', error);
        throw new Error('Failed to delete event');
    }
}

/**
 * Fetch signups for an event
 */
export async function getEventSignupsAction(eventId: number): Promise<Signup[]> {
    await verifyEventManagementPermission(eventId);

    try {
        return await serverDirectusFetch<Signup[]>(
            `/items/event_signups?filter[event_id][_eq]=${eventId}&fields=id,participant_name,participant_email,participant_phone,payment_status,created_at,directus_relations.id,directus_relations.first_name,directus_relations.last_name,directus_relations.email,directus_relations.phone_number&sort=-created_at`,
            { revalidate: 0 }
        );
    } catch (error) {
        console.error('getEventSignupsAction failed:', error);
        throw new Error('Failed to fetch signups');
    }
}

/**
 * Delete a signup and optionally send a cancellation email
 */
export async function deleteEventSignupAction(
    signupId: number,
    eventId: number,
    options?: { sendEmail?: boolean }
): Promise<{ success: boolean }> {
    await verifyEventManagementPermission(eventId);

    try {
        if (options?.sendEmail) {
            // Fetch signup and event details for email
            const [signup, event] = await Promise.all([
                serverDirectusFetch<Signup>(`/items/event_signups/${signupId}?fields=participant_name,participant_email,directus_relations.first_name,directus_relations.last_name,directus_relations.email`),
                serverDirectusFetch<any>(`/items/events/${eventId}?fields=name,committee_id.name,committee_id.commissie_email`)
            ]);

            const email = signup.participant_email || signup.directus_relations?.email;
            const name = signup.participant_name ||
                (signup.directus_relations?.first_name
                    ? `${signup.directus_relations.first_name} ${signup.directus_relations.last_name || ''}`.trim()
                    : 'Deelnemer');

            if (email) {
                await sendActivityCancellationEmail({
                    recipientEmail: email,
                    recipientName: name,
                    eventName: event.name,
                    committeeName: event.committee_id?.name,
                    committeeEmail: event.committee_id?.commissie_email
                });
            }
        }

        await serverDirectusFetch(`/items/event_signups/${signupId}`, {
            method: 'DELETE'
        });

        revalidatePath(`/admin/activiteiten/${eventId}/aanmeldingen`);
        return { success: true };
    } catch (error) {
        console.error('deleteEventSignupAction failed:', error);
        throw new Error('Failed to delete signup');
    }
}

/**
 * Search for users (ICT/Board/Kandi only)
 */
export async function searchUsersAction(query: string): Promise<any[]> {
    await verifyUserPermissions({ commissie_tokens: ADMIN_TOKENS });

    try {
        // Search by first_name, last_name, or email
        return await serverDirectusFetch<any[]>(
            `/users?search=${encodeURIComponent(query)}&fields=id,first_name,last_name,email&limit=10`,
            { revalidate: 0 }
        );
    } catch (error) {
        console.error('searchUsersAction failed:', error);
        throw new Error('Failed to search users');
    }
}

/**
 * Create a manual signup for an event
 */
export async function createEventSignupAction(data: {
    event_id: number;
    payment_status: string;
    participant_name?: string;
    participant_email?: string;
    participant_phone?: string;
    directus_relations?: string | null; // user_id
}): Promise<{ success: boolean; id: number }> {
    await verifyEventManagementPermission(data.event_id);

    try {
        const payload = {
            event_id: data.event_id,
            payment_status: data.payment_status,
            participant_name: data.participant_name,
            participant_email: data.participant_email,
            participant_phone: data.participant_phone,
            directus_relations: data.directus_relations,
            created_at: new Date().toISOString()
        };

        const res = await serverDirectusFetch<any>('/items/event_signups', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        revalidatePath(`/admin/activiteiten/${data.event_id}/aanmeldingen`);
        return { success: true, id: res.id };
    } catch (error: any) {
        console.error('createEventSignupAction failed:', error);
        throw new Error(error.message || 'Failed to create signup');
    }
}

/**
 * Fetch all visible committees
 */
export async function getCommitteesAction(): Promise<Committee[]> {
    await verifyUserPermissions({});

    try {
        const committees = await serverDirectusFetch<Committee[]>('/items/committees?fields=id,name&sort=name&limit=-1&filter[is_visible][_eq]=true');
        return committees.map(c => ({
            ...c,
            name: c.name.replace(/\|\|.*salvemundi.*$/i, '').replace(/\|+$/g, '').trim()
        }));
    } catch (error) {
        console.error('getCommitteesAction failed:', error);
        throw new Error('Failed to fetch committees');
    }
}

/**
 * Upload an image for an event
 */
export async function uploadEventImageAction(formData: FormData): Promise<string> {
    // Check if user has permission to manage ANY event (to be safe)
    await verifyUserPermissions({});

    try {
        // Directus requires Authorization header with admin token for file uploads if not public
        // serverDirectusFetch handles this
        const res = await serverDirectusFetch<any>('/files', {
            method: 'POST',
            body: formData,
            // Don't set Content-Type, fetch will do it with boundary
        });

        return res.id;
    } catch (error) {
        console.error('uploadEventImageAction failed:', error);
        throw new Error('Failed to upload image');
    }
}

/**
 * Send a reminder for an event
 */
export async function sendEventReminderAction(eventId: number): Promise<{ success: boolean; sent: number }> {
    await verifyEventManagementPermission(eventId);

    const serviceSecret = process.env.SERVICE_SECRET || '';
    const notificationsUrl = process.env.INTERNAL_NOTIFICATIONS_URL || 'http://localhost:3003';

    try {
        const response = await fetch(`${notificationsUrl}/notify-event-reminder`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-internal-api-secret': serviceSecret
            },
            body: JSON.stringify({ eventId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to send reminder');
        }

        return await response.json();
    } catch (error: any) {
        console.error('sendEventReminderAction failed:', error);
        throw new Error(error.message || 'Failed to trigger reminder');
    }
}

/**
 * Send a custom notification
 */
export async function sendCustomNotificationAction(data: {
    title: string;
    body: string;
    data?: any;
    tag?: string;
}): Promise<{ success: boolean; sent: number }> {
    // Only Board/ICT/Kandi should send custom notifications usually
    await verifyUserPermissions({ commissie_tokens: ADMIN_TOKENS });

    const serviceSecret = process.env.SERVICE_SECRET || '';
    const notificationsUrl = process.env.INTERNAL_NOTIFICATIONS_URL || 'http://localhost:3003';

    try {
        const response = await fetch(`${notificationsUrl}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-internal-api-secret': serviceSecret
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to send custom notification');
        }

        return await response.json();
    } catch (error: any) {
        console.error('sendCustomNotificationAction failed:', error);
        throw new Error(error.message || 'Failed to trigger custom notification');
    }
}
