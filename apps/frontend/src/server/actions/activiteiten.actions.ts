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
    type Activiteit
} from "@salvemundi/validations";
import { 
    getActivitiesWithSignupCountsInternal 
} from "@/server/queries/admin-event.queries";
const EVENT_ID_FIELDS = ['id'] as const;
import { logAdminAction } from "./audit.actions";
import { isSuperAdmin } from "@/lib/auth-utils";

async function getSession() {
    return await auth.api.getSession({
        headers: await headers()
    });
}

async function checkAdminAccess() {
    const session = await getSession();
    if (!session || !session.user) return null;
    
    const user = session.user as any;
    // Gebruik de bestaande admin/ict vlaggen voor brede beheer-toegang
    if (user.isAdmin || user.isICT) return session;
    
    // Fallback voor specifieke commissie-rechten als die nodig zijn
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
        return { success: false, error: "Herinnering versturen mislukt" };
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
        return { success: false, error: "Notificatie versturen mislukt" };
    }
}

export async function deleteActivity(eventId: number) {
    const session = await checkAdminAccess();
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        await getSystemDirectus().request(deleteItem('events', eventId));
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
    
    const validated = AdminActivitySchema.safeParse(rawData);
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
    
    if (imageId) directusPayload.image = imageId;

    try {
        const res = await getSystemDirectus().request(createItem('events', directusPayload));
        await logAdminAction('activity_created', 'SUCCESS', { id: res.id, data: directusPayload });

        revalidateTag('events', 'default');
        revalidatePath('/beheer/activiteiten');
        revalidatePath('/beheer');
        if (typeof res.id !== 'number') {
            throw new Error('Geen ID teruggekregen van de database');
        }
        return { success: true, id: res.id };
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
            fields: [...EVENT_ID_FIELDS, 'committee_id' as any],
            filter: { id: { _eq: eventId } },
            limit: 1
        }));
        
        if (!existing || existing.length === 0) return { error: "Activiteit niet gevonden", success: false };
        
        if (!isPowerful) {
            const isMember = existing[0].committee_id ? memberships.some((c: any) => String(c.id) === String(existing[0].committee_id)) : false;
            if (!isMember) return { error: "Geen rechten voor deze activiteit", success: false };
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
        
        const validated = AdminActivitySchema.safeParse(rawData);
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

        await getSystemDirectus().request(updateItem('events', eventId, directusPayload));
        await logAdminAction('activity_updated', 'SUCCESS', { id: eventId, data: directusPayload });

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

