'use server';

import { z } from 'zod';

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
    activityAdminSchema
} from "@salvemundi/validations";
import { logAdminAction } from '@/server/actions/infrastructure/audit.actions';
import { safeConsoleError } from '@/server/utils/logger';
import { deleteEventDb } from "@/server/internal/event-db.utils";
import { ensureActivitiesEdit, verifyActivityBOLA } from "@/server/actions/events/activiteiten/auth-check";

export async function deleteActivity(eventId: number) {
    try {
        await verifyActivityBOLA(eventId);
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Unauthorized" };
    }

    try {
        const success = await deleteEventDb(eventId);
        if (!success) throw new Error("Deletion from database failed");

        try {
            await getSystemDirectus().request(deleteItem('events', eventId));
        } catch (error) {
            await logAdminAction('system_activity_delete_failed', 'ERROR', { context: 'activiteit', id: eventId, error: String(error) });
            return { success: false, error: "CMS Synchronisatie mislukt. Activiteit is niet verwijderd." };
        }

        await logAdminAction('admin_activity_deleted', 'SUCCESS', { context: 'activiteit', id: eventId });

        revalidateTag('events', 'max');
        revalidatePath('/beheer/activiteiten');
        revalidatePath('/beheer');
        return { success: true };
    } catch {
        return { success: false, error: "Verwijderen mislukt" };
    }
}

export type CreateActivityResult =
    | { success: true; id: number }
    | { success: false; error: string; fieldErrors?: Record<string, string[]>; initialData?: { [key: string]: unknown } };

export async function createActivityAction(prevState: unknown, formData: FormData): Promise<CreateActivityResult> {
    await ensureActivitiesEdit();

    const imageFile = formData.get('imageFile') as File | null;
    let imageId: string | null = null;

    if (imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
        if (imageFile.size > 5 * 1024 * 1024) {
            return { success: false, error: "Afbeelding is te groot (max 5MB)." };
        }
        if (!imageFile.type.startsWith('image/')) {
            return { success: false, error: "Alleen afbeeldingen zijn toegestaan." };
        }

        const fileData = new FormData();
        fileData.append('file', imageFile);
        try {
            const res = (await getSystemDirectus().request(uploadFiles(fileData))) as unknown as { id: string };
            imageId = res.id;
        } catch (error: unknown) {
            const typedError = error instanceof Error ? error : new Error(String(error));
            safeConsoleError('[activities-write.actions.ts][createActivityAction] ', `Failed to upload image: ${typedError.message}`);
        }
    }

    const rawData: { [key: string]: unknown } = {};
    formData.forEach((value, key) => {
        if (key !== 'imageFile') rawData[key] = value;
    });

    const validated = activityAdminSchema.safeParse(rawData);
    if (!validated.success) {
        return {
            error: "Sommige velden zijn niet correct ingevuld. Controleer het formulier.",
            fieldErrors: z.flattenError(validated.error).fieldErrors,
            success: false,
            initialData: rawData
        };
    }

    const data = validated.data;

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

    const directusPayload: { [key: string]: unknown } = {
        ...data,
        status: data.status === 'scheduled' ? 'published' : data.status,
        price_members: data.price_members,
        price_non_members: data.price_non_members
    };

    if (imageId) directusPayload.image = imageId;

    try {
        const newItem = (await getSystemDirectus().request(createItem('events', directusPayload))) as unknown as { id: number } | null | undefined;

        if (!newItem || !newItem.id) {
            throw new Error('Geen ID teruggekregen van het CMS');
        }

        await logAdminAction('admin_activity_created', 'SUCCESS', { context: 'activiteit', context_name: data.name, id: newItem.id, data: directusPayload });

        revalidateTag('events', 'max');
        revalidatePath('/beheer/activiteiten');
        revalidatePath(`/beheer/activiteiten/${newItem.id}/bewerken`);
        revalidatePath('/beheer');

        return { success: true, id: newItem.id };
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[activities-write.actions.ts][createActivityAction] ', `Directus createItem failed: ${typedError.message}`);
        await logAdminAction('system_activity_create_failed', 'ERROR', {
            context: 'activiteit',
            context_name: data.name,
            error: typedError.message,
            payload: directusPayload
        });
        return { success: false, error: 'Synchronisatie met CMS mislukt. Activiteit is niet aangemaakt.', initialData: rawData };
    }
}

export async function updateActivityAction(eventId: number, prevState: unknown, formData: FormData) {
    try {
        await verifyActivityBOLA(eventId);
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : "Unauthorized" };
    }

    try {
        const existing = (await getSystemDirectus().request(readItems('events', {
            fields: ['*'],
            filter: { id: { _eq: eventId } },
            limit: 1
        }))) as unknown[] | null | undefined;

        if (!existing || existing.length === 0) return { error: "Activity not found", success: false };
        const oldData = existing[0] as unknown as { [key: string]: unknown };

        const imageFile = formData.get('imageFile') as File | null;
        let imageId: string | null | undefined = undefined;
        const removeImage = formData.get('removeImage') === 'true';

        if (imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
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

        const rawData: { [key: string]: unknown } = {};
        formData.forEach((value, key) => {
            if (key !== 'imageFile' && key !== 'removeImage') rawData[key] = value;
        });

        const validated = activityAdminSchema.safeParse(rawData);
        if (!validated.success) {
            return {
                error: "Sommige velden zijn niet correct ingevuld. Controleer het formulier.",
                fieldErrors: z.flattenError(validated.error).fieldErrors,
                success: false,
                initialData: rawData
            };
        }

        const data = validated.data;

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

        const directusPayload: { [key: string]: unknown } = {
            ...data,
            status: data.status === 'scheduled' ? 'published' : data.status
        };

        if (imageId !== undefined) directusPayload.image = imageId;

        try {
            await getSystemDirectus().request(updateItem('events', eventId, directusPayload));

            await logAdminAction('admin_activity_updated', 'SUCCESS', { context: 'activiteit', context_name: data.name, id: eventId, data: directusPayload });

            revalidateTag('events', 'max');
            revalidateTag(`event_${eventId}`, 'max');
            revalidatePath('/beheer/activiteiten');
            revalidatePath(`/beheer/activiteiten/${eventId}/bewerken`);
            revalidatePath('/beheer');

            return { success: true };
        } catch (error) {
            const typedError = error instanceof Error ? error : new Error(String(error));
            safeConsoleError('[activities-write.actions.ts][updateActivityAction] ', `Directus updateItem failed: ${typedError.message}`);
            await logAdminAction('system_activity_update_failed', 'ERROR', {
                context: 'activiteit',
                id: eventId,
                error: typedError.message
            });
            return { success: false, error: 'Synchronisatie met CMS mislukt. Wijzigingen zijn niet opgeslagen.' };
        }
    } catch {
        return { error: 'Internal server error', success: false };
    }
}