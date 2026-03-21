'use server';

import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { revalidateTag, revalidatePath } from "next/cache";
import { cache } from "react";
import { directus, directusRequest } from "@/lib/directus";
import { 
    readItems, 
    createItem, 
    updateItem, 
    deleteItem, 
    uploadFiles,
    aggregate
} from "@directus/sdk";
import { activityAdminSchema } from "@salvemundi/validations";
import { AdminActivitySchema } from "@salvemundi/validations";
import { logAdminAction } from "./audit.actions";
import { isSuperAdmin } from "@/lib/auth-utils";

async function getSession() {
    return await auth.api.getSession({
        headers: await headers()
    });
}

const NOTIFICATION_API = process.env.NEXT_PUBLIC_NOTIFICATION_API_URL!;

async function checkAdminAccess() {
    const session = await getSession();
    if (!session || !session.user) return false;
    
    const user = session.user as any;
    return isSuperAdmin(user.committees);
}

export const getAdminActivities = cache(async (search?: string, filter: 'all' | 'upcoming' | 'past' = 'all') => {
    if (!(await checkAdminAccess())) throw new Error("Unauthorized");

    try {
        const query: any = {
            fields: ['id', 'name', 'event_date', 'event_date_end', 'description', 'location', 'max_sign_ups', 'price_members', 'price_non_members', 'inschrijf_deadline', 'contact', { image: ['id'] }, 'committee_id', 'status', 'publish_date'],
            sort: ['-event_date'],
            limit: -1,
            filter: {}
        };

        if (search) {
            query.filter._or = [
                { name: { _icontains: search } },
                { description: { _icontains: search } },
                { location: { _icontains: search } }
            ];
        }

        const now = new Date().toISOString();
        if (filter === 'upcoming') {
            query.filter.event_date = { _gte: now };
        } else if (filter === 'past') {
            query.filter.event_date = { _lt: now };
        }

        const events = await directusRequest<any[]>(readItems('events', query));
        
        // Fix N+1 query by using a single aggregate call with groupBy
        const counts = await directusRequest<any[]>(
            aggregate('event_signups', {
                aggregate: { count: '*' },
                groupBy: ['event_id']
            })
        );

        const countMap = new Map((counts as any[]).map(c => [c.event_id, parseInt(c.count?.count || c.count || "0")]));
        
        const eventsWithCounts = events.map((event: any) => {
            return {
                ...event,
                signup_count: countMap.get(event.id) || 0
            };
        });
        
        return AdminActivitySchema.array().parse(eventsWithCounts);
    } catch (error) {
        // Logging is handled by directusRequest
        return [];
    }
});

export async function sendActivityReminder(eventId: number) {
    if (!(await checkAdminAccess())) return { success: false, error: "Unauthorized" };

    try {
        // Use the notification API as legacy did
        const response = await fetch(`${NOTIFICATION_API.replace('/send-email', '/send-reminder')}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId })
        });

        if (!response.ok) throw new Error("Failed to send reminder");
        const result = await response.json();
        
        return { success: true, sent: result.sent || 0 };
    } catch (error) {
        console.error("Failed to send activity reminder:", error);
        return { success: false, error: "Herinnering versturen mislukt" };
    }
}

export async function sendActivityCustomNotification(eventId: number, title: string, body: string) {
    if (!(await checkAdminAccess())) return { success: false, error: "Unauthorized" };

    try {
        const response = await fetch(`${NOTIFICATION_API.replace('/send-email', '/send-custom')}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                body,
                data: {
                    url: `/activiteit/${eventId}`,
                    eventId: eventId
                },
                tag: `custom-${eventId}`
            })
        });

        if (!response.ok) throw new Error("Failed to send custom notification");
        const result = await response.json();
        
        return { success: true, sent: result.sent || 0 };
    } catch (error) {
        console.error("Failed to send custom notification:", error);
        return { success: false, error: "Notificatie versturen mislukt" };
    }
}

export async function deleteActivity(eventId: number) {
    if (!(await checkAdminAccess())) return { success: false, error: "Unauthorized" };

    try {
        await directusRequest(deleteItem('events', eventId));
        await logAdminAction('delete', 'events', eventId);
        
        revalidateTag('events', 'default');
        revalidatePath('/beheer/activiteiten');
        revalidatePath('/beheer');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete activity:", error);
        return { success: false, error: "Verwijderen mislukt" };
    }
}

export async function createActivityAction(prevState: any, formData: FormData) {
    if (!(await checkAdminAccess())) return { error: "Unauthorized", success: false };

    // File upload handling
    const imageFile = formData.get('imageFile') as File | null;
    let imageId: string | null = null;
    
    if (imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
        const fileData = new FormData();
        fileData.append('file', imageFile);
        try {
            const res = await directusRequest<any>(uploadFiles(fileData));
            imageId = res.id;
        } catch (e) {
            console.error('Image upload failed', e);
        }
    }

    // Convert formData to object for Zod
    const rawData: Record<string, any> = {};
    formData.forEach((value, key) => {
        if (key !== 'imageFile') rawData[key] = value;
    });
    
    const validated = activityAdminSchema.safeParse(rawData);
    if (!validated.success) {
        return { 
            error: "Validatie mislukt", 
            fieldErrors: validated.error.flatten().fieldErrors,
            success: false 
        };
    }

    const data = validated.data;
    const directusPayload: Record<string, any> = {
        ...data,
        // Override status logic if scheduled
        status: data.status === 'scheduled' ? 'published' : data.status,
    };
    
    if (imageId) directusPayload.image = imageId;

    try {
        const res = await directusRequest<any>(createItem('events', directusPayload));
        await logAdminAction('create', 'events', res.id, directusPayload);

        revalidateTag('events', 'default');
        revalidatePath('/beheer/activiteiten');
        revalidatePath('/beheer');
        return { success: true, id: res.id };
    } catch (error) {
        console.error("Failed to create activity:", error);
        return { error: 'Fout bij opslaan in de database', success: false };
    }
}

export async function updateActivityAction(eventId: number, prevState: any, formData: FormData) {
    const session = await getSession();
    if (!session || !session.user) return { error: "Unauthorized", success: false };

    // Strict access check
    const user = session.user as any;
    const memberships = user.committees || [];
    const isPowerful = isSuperAdmin(memberships);

    try {
        // Fetch existing to check committee ownership if not powerful
        const existing = await directusRequest<any[]>(readItems('events', {
            fields: ['committee_id'],
            filter: { id: { _eq: eventId } },
            limit: 1
        }));
        
        if (!existing || existing.length === 0) return { error: "Activiteit niet gevonden", success: false };
        
        if (!isPowerful) {
            const isMember = existing[0].committee_id ? memberships.some((c: any) => String(c.id) === String(existing[0].committee_id)) : false;
            if (!isMember) return { error: "Geen rechten voor deze activiteit", success: false };
        }

        // Image handling
        const imageFile = formData.get('imageFile') as File | null;
        let imageId: string | null | undefined = undefined;
        const removeImage = formData.get('removeImage') === 'true';

        if (imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
            const fileData = new FormData();
            fileData.append('file', imageFile);
            const res = await directusRequest<any>(uploadFiles(fileData));
            imageId = res.id;
        } else if (removeImage) {
            imageId = null;
        }

        const rawData: Record<string, any> = {};
        formData.forEach((value, key) => {
            if (key !== 'imageFile' && key !== 'removeImage') rawData[key] = value;
        });
        
        const validated = activityAdminSchema.safeParse(rawData);
        if (!validated.success) {
            return { 
                error: "Validatie mislukt", 
                fieldErrors: validated.error.flatten().fieldErrors,
                success: false 
            };
        }

        const data = validated.data;
        const directusPayload: Record<string, any> = {
            ...data,
            status: data.status === 'scheduled' ? 'published' : data.status,
        };
        
        if (imageId !== undefined) directusPayload.image = imageId;

        await directusRequest(updateItem('events', eventId, directusPayload));
        await logAdminAction('update', 'events', eventId, directusPayload);

        revalidateTag('events', 'default');
        revalidateTag(`event_${eventId}`, 'default');
        revalidatePath('/beheer/activiteiten');
        revalidatePath(`/beheer/activiteiten/${eventId}/bewerken`);
        revalidatePath('/beheer');
        
        return { success: true };
    } catch (error) {
        console.error("Failed to update activity:", error);
        return { error: 'Interne serverfout', success: false };
    }
}

