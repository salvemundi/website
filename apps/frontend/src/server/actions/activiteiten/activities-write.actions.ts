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
import { query as dbQuery } from "@/lib/database";
import { COMMITTEES } from "@/shared/lib/permissions-config";

/**
 * WRITE ACTIONS: Create, Update, Delete.
 * Gated by: ActivitiesEdit (Leaders, Bestuur, ICT)
 */

export async function deleteActivity(eventId: number) {
    const user = await ensureActivitiesEdit();

    // BOLA Check: Only ICT, Bestuur or the owning committee leader can delete
    const activityRes = await dbQuery("SELECT committee_id FROM events WHERE id = $1", [eventId]);
    const activityCommitteeId = activityRes.rows[0]?.committee_id;
    const isSuperAdmin = user.isICT || user.committees?.some(c => c.azure_group_id === COMMITTEES.BESTUUR);
    const userCommitteeIds = user.committees?.map(c => Number(c.id)) || [];

    if (!isSuperAdmin && !userCommitteeIds.includes(Number(activityCommitteeId))) {
        return { success: false, error: "Unauthorized: Je mag alleen activiteiten van je eigen commissie verwijderen." };
    }

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
    | { success: false; error: string; fieldErrors?: Record<string, string[]>; initialData?: Record<string, any> };

export async function createActivityAction(prevState: unknown, formData: FormData): Promise<CreateActivityResult> {
    await ensureActivitiesEdit();

    const imageFile = formData.get('imageFile') as File | null;
    let imageId: string | null = null;
    
    if (imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
        // Validation: Max 5MB and image only
        if (imageFile.size > 5 * 1024 * 1024) {
            return { success: false, error: "Afbeelding is te groot (max 5MB)." };
        }
        if (!imageFile.type.startsWith('image/')) {
            return { success: false, error: "Alleen afbeeldingen zijn toegestaan." };
        }

        const fileData = new FormData();
        fileData.append('file', imageFile);
        try {
            const res = await getSystemDirectus().request(uploadFiles(fileData));
            imageId = res.id;
        } catch (e) {}
    }

    const rawData: Record<string, unknown> = {};
    formData.forEach((value, key) => {
        if (key !== 'imageFile') rawData[key] = value;
    });

    const validated = activityAdminSchema.safeParse(rawData);
    if (!validated.success) {
        return { 
            error: "Sommige velden zijn niet correct ingevuld. Controleer het formulier.", 
            fieldErrors: validated.error.flatten().fieldErrors,
            success: false,
            initialData: rawData
        };
    }

    const data = validated.data;

    // Check for duplicate name (case-insensitive)
    const { query: dbQuery } = await import("@/lib/database");
    const nameCheck = await dbQuery(
        "SELECT id FROM events WHERE LOWER(name) = LOWER($1) LIMIT 1",
        [data.name]
    );
    if (nameCheck.rows.length > 0) {
        return { 
            success: false, 
            error: `Er bestaat al een activiteit met de naam "${data.name}". Kies een unieke naam.`,
            initialData: rawData
        };
    }

    const directusPayload: Record<string, unknown> = {
        ...data,
        status: data.status === 'scheduled' ? 'published' : data.status,
        price_members: data.price_members ?? 0,
        price_non_members: data.price_non_members ?? 0,
    };
    
    if (imageId) directusPayload.image = imageId;

    try {
        // Directus SDK will handle the database insertion and trigger internal logic (activity logs, etc.)
        // Since they share the same database, we don't need the redundant createEventDb call here which causes ID conflicts.
        const newItem = await getSystemDirectus().request(createItem('events', directusPayload)) as unknown as { id: number };
        
        if (!newItem || !newItem.id) {
            throw new Error('Geen ID teruggekregen van het CMS');
        }

        await logAdminAction('activity_created', 'SUCCESS', { id: newItem.id, data: directusPayload });

        revalidateTag('events', 'max');
        revalidatePath('/beheer/activiteiten');
        revalidatePath(`/beheer/activiteiten/${newItem.id}/bewerken`);
        revalidatePath('/beheer');
        
        return { success: true, id: newItem.id };
    } catch (err) {
        console.error('[CMS Sync] Directus createItem failed:', err);
        await logAdminAction('activity_create_failed', 'ERROR', { 
            error: err instanceof Error ? err.message : JSON.stringify(err), 
            payload: directusPayload
        });
        return { success: false, error: 'Synchronisatie met CMS mislukt. Activiteit is niet aangemaakt.', initialData: rawData };
    }
}

export async function updateActivityAction(eventId: number, prevState: unknown, formData: FormData) {
    const user = await ensureActivitiesEdit();

    // BOLA Check: Only ICT, Bestuur or the owning committee leader can update
    const activityRes = await dbQuery("SELECT committee_id FROM events WHERE id = $1", [eventId]);
    const activityCommitteeId = activityRes.rows[0]?.committee_id;
    const isSuperAdmin = user.isICT || user.committees?.some(c => c.azure_group_id === COMMITTEES.BESTUUR);
    const userCommitteeIds = user.committees?.map(c => Number(c.id)) || [];

    if (!isSuperAdmin && !userCommitteeIds.includes(Number(activityCommitteeId))) {
        return { success: false, error: "Unauthorized: Je mag alleen activiteiten van je eigen commissie bewerken." };
    }

    try {
        const existing = await getSystemDirectus().request(readItems('events', {
            fields: ['*'],
            filter: { id: { _eq: eventId } },
            limit: 1
        }));
        
        if (!existing || existing.length === 0) return { error: "Activity not found", success: false };
        const oldData = existing[0] as unknown as Record<string, unknown>;
        
        const imageFile = formData.get('imageFile') as File | null;
        let imageId: string | null | undefined = undefined;
        const removeImage = formData.get('removeImage') === 'true';

        if (imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
            // Validation: Max 5MB and image only
            if (imageFile.size > 5 * 1024 * 1024) {
                return { success: false, error: "Afbeelding is te groot (max 5MB)." };
            }
            if (!imageFile.type.startsWith('image/')) {
                return { success: false, error: "Alleen afbeeldingen zijn toegestaan." };
            }

            const fileData = new FormData();
            fileData.append('file', imageFile);
            const res = await getSystemDirectus().request(uploadFiles(fileData));
            imageId = res.id;
        } else if (removeImage) {
            imageId = null;
        }

        const rawData: Record<string, unknown> = {};
        formData.forEach((value, key) => {
            if (key !== 'imageFile' && key !== 'removeImage') rawData[key] = value;
        });
        
        const validated = activityAdminSchema.safeParse(rawData);
        if (!validated.success) {
            return { 
                error: "Sommige velden zijn niet correct ingevuld. Controleer het formulier.", 
                fieldErrors: validated.error.flatten().fieldErrors,
                success: false,
                initialData: rawData
            };
        }

        const data = validated.data;

        // Check for duplicate name if changed
        const oldName = oldData.name as string | undefined;
        if (data.name.toLowerCase() !== oldName?.toLowerCase()) {
            const { query: dbQuery } = await import("@/lib/database");
            const nameCheck = await dbQuery(
                "SELECT id FROM events WHERE LOWER(name) = LOWER($1) AND id != $2 LIMIT 1",
                [data.name, eventId]
            );
            if (nameCheck.rows.length > 0) {
                return { 
                    success: false, 
                    error: `Er bestaat al een andere activiteit met de naam "${data.name}".` 
                };
            }
        }

        const directusPayload: Record<string, unknown> = {
            ...data,
            status: data.status === 'scheduled' ? 'published' : data.status,
        };
        
        if (imageId !== undefined) directusPayload.image = imageId;

        try {
            await getSystemDirectus().request(updateItem('events', eventId, directusPayload));
            
            await logAdminAction('activity_updated', 'SUCCESS', { id: eventId, data: directusPayload });

            revalidateTag('events', 'max');
            revalidateTag(`event_${eventId}`, 'max');
            revalidatePath('/beheer/activiteiten');
            revalidatePath(`/beheer/activiteiten/${eventId}/bewerken`);
            revalidatePath('/beheer');
            
            return { success: true };
        } catch (err) {
            console.error('[CMS Sync] Directus updateItem failed:', err);
            await logAdminAction('activity_update_failed', 'ERROR', { 
                id: eventId, 
                error: err instanceof Error ? err.message : JSON.stringify(err) 
            });
            return { success: false, error: 'Synchronisatie met CMS mislukt. Wijzigingen zijn niet opgeslagen.' };
        }
    } catch (error) {
        return { error: 'Internal server error', success: false };
    }
}
