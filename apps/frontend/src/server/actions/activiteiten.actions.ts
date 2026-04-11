'use server';

import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { revalidateTag, revalidatePath } from "next/cache";
import { cache } from "react";
import { getSystemDirectus } from "@/lib/directus";
import { 
    readItems, 
    createItem, 
    updateItem, 
    deleteItem, 
    uploadFiles,
    aggregate
} from "@directus/sdk";
import { z } from 'zod';
import { 
    AdminActivitySchema,
    activityAdminSchema,
    type Activiteit
} from "@salvemundi/validations";
import { 
    getActivitiesWithSignupCountsInternal 
} from "@/server/queries/admin-event.queries";
const EVENT_ID_FIELDS = ['id'] as const;
import { logAdminAction } from "./audit.actions";
import { isSuperAdmin } from "@/lib/auth";
import { createEventDb, updateEventDb, deleteEventDb } from "./event-db.utils";


async function getSession() {
    return await auth.api.getSession({
        headers: await headers()
    });
}

async function checkAdminAccess() {
    const session = await getSession();
    if (!session || !session.user) return null;
    
    const user = session.user as any;
    // Use existing admin/ict flags for broad management access
    if (user.isAdmin || user.isICT) return session;
    
    // Fallback for specific committee permissions if needed
    if (user.committees && isSuperAdmin(user.committees)) return session;
    return null;
}

const getNotificationUrl = (type: 'reminder' | 'custom') => {
    const baseUrl = process.env.INTERNAL_NOTIFICATION_API_URL || process.env.NEXT_PUBLIC_NOTIFICATION_API_URL;
    if (!baseUrl) return null;
    
    const url = new URL(baseUrl);
    url.pathname = url.pathname.replace(/\/send-email$/, type === 'reminder' ? '/send-reminder' : '/send-custom');
    return url.toString();
};

export const getAdminActivities = cache(async (search?: string, filter: 'all' | 'upcoming' | 'past' = 'all') => {
    const session = await checkAdminAccess();
    if (!session) throw new Error("Unauthorized");

    try {
        const eventsWithCounts = await getActivitiesWithSignupCountsInternal(search, filter);
        const parsed = AdminActivitySchema.array().parse(eventsWithCounts);
        return parsed;
    } catch (error) {
        return [];
    }
});

export async function sendActivityReminder(eventId: number) {
    if (!(await checkAdminAccess())) return { success: false, error: "Unauthorized" };

    try {
        const url = getNotificationUrl('reminder');
        if (!url) throw new Error("Notification API URL not configured");

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId })
        });

        if (!response.ok) throw new Error("Failed to send reminder");
        const result = await response.json();
        
        return { success: true, sent: result.sent || 0 };
    } catch (error) {
        return { success: false, error: "Failed to send reminder" };
    }
}

export async function sendActivityCustomNotification(eventId: number, title: string, body: string) {
    if (!(await checkAdminAccess())) return { success: false, error: "Unauthorized" };

    try {
        const url = getNotificationUrl('custom');
        if (!url) throw new Error("Notification API URL not configured");

        const response = await fetch(url, {
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
        return { success: false, error: "Failed to send notification" };
    }
}

export async function deleteActivity(eventId: number) {
    const session = await checkAdminAccess();
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        const success = await deleteEventDb(eventId);
        if (!success) throw new Error("Deletion from database failed");

        // Sync to Directus - now awaited for data integrity
        try {
            await getSystemDirectus().request(deleteItem('events', eventId));
        } catch (err) {
            
            await logAdminAction('activity_delete_failed', 'ERROR', { id: eventId, error: String(err) });
            // We consider the action failed if CMS sync fails to avoid ghost data
            return { success: false, error: "CMS Synchronisatie mislukt. Activiteit is niet verwijderd." };
        }

        await logAdminAction('activity_deleted', 'SUCCESS', { id: eventId });
        
        revalidateTag('events', 'default');
        revalidatePath('/beheer/activiteiten');
        revalidatePath('/beheer');
        return { success: true };
    } catch (error) {
        
        return { success: false, error: "Verwijderen mislukt" };
    }
}

export type CreateActivityResult = 
    | { success: true; id: number }
    | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createActivityAction(prevState: any, formData: FormData): Promise<CreateActivityResult> {
    const session = await checkAdminAccess();
    if (!session) return { error: "Unauthorized", success: false };

    const imageFile = formData.get('imageFile') as File | null;
    let imageId: string | null = null;
    
    if (imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
        const fileData = new FormData();
        fileData.append('file', imageFile);
        try {
            const res = await getSystemDirectus().request(uploadFiles(fileData));
            imageId = res.id;
        } catch (e) {
            
        }
    }

    const rawData: Record<string, any> = {};
    formData.forEach((value, key) => {
        if (key !== 'imageFile') rawData[key] = value;
    });
    
    const validated = activityAdminSchema.safeParse(rawData);
    if (!validated.success) {
        return { 
            error: "Validation failed", 
            fieldErrors: validated.error.flatten().fieldErrors,
            success: false 
        };
    }

    const data = validated.data;
    const directusPayload: Record<string, any> = {
        ...data,
        status: data.status === 'scheduled' ? 'published' : data.status,
    };
    
    if (imageId) directusPayload.image = imageId;

    try {
        const newId = await createEventDb(directusPayload);
        if (!newId) throw new Error('No ID returned from database');

        await logAdminAction('activity_created', 'SUCCESS', { id: newId, data: directusPayload });

        // Sync to Directus - now awaited for data integrity
        try {
            await getSystemDirectus().request(createItem('events', { ...directusPayload, id: newId }));
        } catch (err) {
            
            // Cleanup: delete from DB if CMS sync fails to maintain atomicity
            await deleteEventDb(newId);
            await logAdminAction('activity_create_rollback', 'ERROR', { id: newId, error: String(err), action: 'rollback_delete' });
            return { success: false, error: 'Synchronisatie met CMS mislukt. Activiteit is niet aangemaakt.' };
        }

        revalidateTag('events', 'default');
        revalidatePath('/beheer/activiteiten');
        revalidatePath('/beheer');

        return { success: true, id: newId };
    } catch (error) {
        
        return { error: 'Fout bij opslaan in de database', success: false };
    }
}

export async function updateActivityAction(eventId: number, prevState: any, formData: FormData) {
    const session = await getSession();
    if (!session || !session.user) return { error: "Unauthorized", success: false };

    const user = session.user as any;
    const memberships = user.committees || [];
    const isPowerful = isSuperAdmin(memberships);

    try {
        const existing = await getSystemDirectus().request(readItems('events', {
            fields: ['*'], // Fetch everything for potential rollback
            filter: { id: { _eq: eventId } },
            limit: 1
        }));
        
        if (!existing || existing.length === 0) return { error: "Activity not found", success: false };
        const oldData = existing[0];
        
        if (!isPowerful) {
            const isMember = oldData.committee_id ? memberships.some((c: any) => String(c.id) === String(oldData.committee_id)) : false;
            if (!isMember) return { error: "Insufficient permissions for this activity", success: false };
        }

        const imageFile = formData.get('imageFile') as File | null;
        let imageId: string | null | undefined = undefined;
        const removeImage = formData.get('removeImage') === 'true';

        if (imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
            const fileData = new FormData();
            fileData.append('file', imageFile);
            const res = await getSystemDirectus().request(uploadFiles(fileData));
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
                error: "Validation failed", 
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

        const updated = await updateEventDb(eventId, directusPayload);
        if (!updated) throw new Error('Database update failed');

        // Sync to Directus - now awaited for data integrity
        try {
            await getSystemDirectus().request(updateItem('events', eventId, directusPayload));
        } catch (err) {
            
            // Rollback Postgres to maintain atomicity
            await updateEventDb(eventId, oldData);
            await logAdminAction('activity_update_rollback', 'ERROR', { id: eventId, error: String(err), action: 'rollback_restore' });
            return { success: false, error: 'Synchronisatie met CMS mislukt. Wijzigingen niet opgeslagen.' };
        }

        await logAdminAction('activity_updated', 'SUCCESS', { id: eventId, data: directusPayload });

        revalidateTag('events', 'default');
        revalidateTag(`event_${eventId}`, 'default');
        revalidatePath('/beheer/activiteiten');
        revalidatePath(`/beheer/activiteiten/${eventId}/bewerken`);
        revalidatePath('/beheer');
        
        return { success: true };
    } catch (error) {
        
        return { error: 'Internal server error', success: false };
    }
}

