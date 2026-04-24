'use server';

import { revalidateTag, revalidatePath } from "next/cache";
import { getSystemDirectus } from "@/lib/directus";
import { 
    readItems, 
    createItem, 
    updateItem, 
    deleteItem, 
    uploadFiles 
} from "@directus/sdk";
import { 
    activityAdminSchema,
} from "@salvemundi/validations";
import { logAdminAction } from "../audit.actions";
import { createEventDb, updateEventDb, deleteEventDb } from "../event-db.utils";
import { ensureActivitiesEdit } from "./auth-check";

/**
 * WRITE ACTIONS: Create, Update, Delete.
 * Gated by: ActivitiesEdit (Leaders, Bestuur, ICT)
 */

export async function deleteActivity(eventId: number) {
    await ensureActivitiesEdit();

    try {
        const success = await deleteEventDb(eventId);
        if (!success) throw new Error("Deletion from database failed");

        try {
            await getSystemDirectus().request(deleteItem('events', eventId));
        } catch (err) {
            await logAdminAction('activity_delete_failed', 'ERROR', { id: eventId, error: String(err) });
            return { success: false, error: "CMS Synchronisatie mislukt. Activiteit is niet verwijderd." };
        }

        await logAdminAction('activity_deleted', 'SUCCESS', { id: eventId });
        
        revalidateTag('events', 'max');
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
    await ensureActivitiesEdit();

    const imageFile = formData.get('imageFile') as File | null;
    let imageId: string | null = null;
    
    if (imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
        const fileData = new FormData();
        fileData.append('file', imageFile);
        try {
            const res = await getSystemDirectus().request(uploadFiles(fileData));
            imageId = res.id;
        } catch (e) {}
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

        try {
            await getSystemDirectus().request(createItem('events', { ...directusPayload, id: newId }));
        } catch (err) {
            await deleteEventDb(newId);
            await logAdminAction('activity_create_rollback', 'ERROR', { id: newId, error: String(err), action: 'rollback_delete' });
            return { success: false, error: 'Synchronisatie met CMS mislukt. Activiteit is niet aangemaakt.' };
        }

        revalidateTag('events', 'max');
        revalidatePath('/beheer/activiteiten');
        revalidatePath('/beheer');

        return { success: true, id: newId };
    } catch (error) {
        return { error: 'Fout bij opslaan in de database', success: false };
    }
}

export async function updateActivityAction(eventId: number, prevState: any, formData: FormData) {
    await ensureActivitiesEdit();

    try {
        const existing = await getSystemDirectus().request(readItems('events', {
            fields: ['*'],
            filter: { id: { _eq: eventId } },
            limit: 1
        }));
        
        if (!existing || existing.length === 0) return { error: "Activity not found", success: false };
        const oldData = existing[0];
        
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

        try {
            await getSystemDirectus().request(updateItem('events', eventId, directusPayload));
        } catch (err) {
            await updateEventDb(eventId, oldData);
            await logAdminAction('activity_update_rollback', 'ERROR', { id: eventId, error: String(err), action: 'rollback_restore' });
            return { success: false, error: 'Synchronisatie met CMS mislukt. Wijzigingen niet opgeslagen.' };
        }

        await logAdminAction('activity_updated', 'SUCCESS', { id: eventId, data: directusPayload });

        revalidateTag('events', 'max');
        revalidateTag(`event_${eventId}`, 'max');
        revalidatePath('/beheer/activiteiten');
        revalidatePath(`/beheer/activiteiten/${eventId}/bewerken`);
        revalidatePath('/beheer');
        
        return { success: true };
    } catch (error) {
        return { error: 'Internal server error', success: false };
    }
}
