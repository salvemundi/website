'use server';

import { z } from 'zod';

import { revalidateTag, revalidatePath } from "next/cache";
import { db, schema } from "@salvemundi/db";
import { eq, sql, and, ne } from "drizzle-orm";
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
        if (!imageFile.type.startsWith('image/') && !imageFile.type.startsWith('video/')) {
            return { success: false, error: "Alleen afbeeldingen of video's zijn toegestaan." };
        }

        const fileData = new FormData();
        fileData.append('file', imageFile);
        try {
            const token = process.env.DIRECTUS_STATIC_TOKEN;
            const directusUrl = process.env.INTERNAL_DIRECTUS_URL;
            const res = await fetch(`${directusUrl}/files`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: fileData
            });
            if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`);
            const data = await res.json() as { data: { id: string } };
            imageId = data.data.id;
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

    const nameCheck = await db.query.events.findFirst({
        columns: { id: true },
        where: eq(sql`LOWER(${schema.events.name})`, data.name.toLowerCase())
    });
    if (nameCheck) {
        return {
            success: false,
            error: `Er bestaat al een activiteit met de naam "${data.name}". Kies een unieke naam.`,
            initialData: rawData
        };
    }

    const insertPayload = {
        name: data.name,
        description: data.description,
        short_description: data.short_description || null,
        description_logged_in: data.description_logged_in || null,
        event_date: data.event_date,
        event_time: data.event_time || null,
        event_date_end: data.event_date_end || null,
        event_time_end: data.event_time_end || null,
        location: data.location || null,
        max_sign_ups: data.max_sign_ups || null,
        price_members: data.price_members.toString(),
        price_non_members: data.price_non_members.toString(),
        registration_deadline: data.registration_deadline || null,
        custom_url: data.custom_url || null,
        committee_id: data.committee_id || null,
        contact: data.contact || null,
        only_members: data.only_members,
        status: data.status === 'scheduled' ? 'published' : data.status,
        publish_date: data.publish_date || null,
        ...(imageId && { image: imageId }),
    };

    try {
        const createdItems = await db.insert(schema.events).values(insertPayload).returning();
        const newItem = createdItems[0];

        await logAdminAction('admin_activity_created', 'SUCCESS', { context: 'activiteit', context_name: data.name, id: newItem.id, data: insertPayload });

        revalidateTag('events', 'max');
        revalidatePath('/beheer/activiteiten');
        revalidatePath(`/beheer/activiteiten/${newItem.id}/bewerken`);
        revalidatePath('/beheer');

        return { success: true, id: newItem.id };
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[activities-write.actions.ts][createActivityAction] ', `Drizzle createItem failed: ${typedError.message}`);
        await logAdminAction('system_activity_create_failed', 'ERROR', {
            context: 'activiteit',
            context_name: data.name,
            error: typedError.message,
            payload: insertPayload
        });
        return { success: false, error: 'Activiteit is niet aangemaakt.', initialData: rawData };
    }
}

export async function updateActivityAction(eventId: number, prevState: unknown, formData: FormData) {
    try {
        await verifyActivityBOLA(eventId);
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : "Unauthorized" };
    }

    try {
        const existing = await db.query.events.findFirst({
            where: eq(schema.events.id, eventId)
        });

        if (!existing) return { error: "Activity not found", success: false };
        const oldData = existing as unknown as { [key: string]: unknown };

        const imageFile = formData.get('imageFile') as File | null;
        let imageId: string | null | undefined = undefined;
        const removeImage = formData.get('removeImage') === 'true';

        if (imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
            if (imageFile.size > 5 * 1024 * 1024) {
                return { success: false, error: "Afbeelding is te groot (max 5MB)." };
            }
            if (!imageFile.type.startsWith('image/') && !imageFile.type.startsWith('video/')) {
                return { success: false, error: "Alleen afbeeldingen of video's zijn toegestaan." };
            }

            const fileData = new FormData();
            fileData.append('file', imageFile);
            const token = process.env.DIRECTUS_STATIC_TOKEN;
            const directusUrl = process.env.INTERNAL_DIRECTUS_URL;
            const res = await fetch(`${directusUrl}/files`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: fileData
            });
            if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`);
            const data = await res.json() as { data: { id: string } };
            imageId = data.data.id;
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
            const nameCheck = await db.query.events.findFirst({
                columns: { id: true },
                where: and(
                    eq(sql`LOWER(${schema.events.name})`, data.name.toLowerCase()),
                    ne(schema.events.id, eventId)
                )
            });
            if (nameCheck) {
                return {
                    success: false,
                    error: `Er bestaat al een andere activiteit met de naam "${data.name}".`
                };
            }
        }

        const updatePayload = {
            name: data.name,
            event_date: data.event_date,
            description: data.description || null,
            description_logged_in: data.description_logged_in || null,
            price_members: data.price_members.toString(),
            price_non_members: data.price_non_members.toString(),
            max_sign_ups: data.max_sign_ups || null,
            only_members: data.only_members,
            committee_id: data.committee_id || null,
            contact: data.contact || null,
            event_time: data.event_time || null,
            location: data.location || null,
            event_time_end: data.event_time_end || null,
            registration_deadline: data.registration_deadline || null,
            publish_date: data.publish_date || null,
            event_date_end: data.event_date_end || null,
            custom_url: data.custom_url || null,
            short_description: data.short_description || null,
            status: data.status === 'scheduled' ? 'published' : data.status,
            ...(imageId !== undefined && { image: imageId }),
        };

        try {
            await db.update(schema.events).set(updatePayload).where(eq(schema.events.id, eventId));

            await logAdminAction('admin_activity_updated', 'SUCCESS', { context: 'activiteit', context_name: data.name, id: eventId, data: updatePayload });

            revalidateTag('events', 'max');
            revalidateTag(`event_${eventId}`, 'max');
            revalidatePath('/beheer/activiteiten');
            revalidatePath(`/beheer/activiteiten/${eventId}/bewerken`);
            revalidatePath('/beheer');

            return { success: true };
        } catch (error) {
            const typedError = error instanceof Error ? error : new Error(String(error));
            safeConsoleError('[activities-write.actions.ts][updateActivityAction] ', `Drizzle updateItem failed: ${typedError.message}`);
            await logAdminAction('system_activity_update_failed', 'ERROR', {
                context: 'activiteit',
                id: eventId,
                error: typedError.message
            });
            return { success: false, error: 'Wijzigingen zijn niet opgeslagen.' };
        }
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Internal server error';
        safeConsoleError('[activities-write.actions.ts][updateActivityAction] ', `Outer catch error: ${msg}`);
        return { error: msg, success: false };
    }
}