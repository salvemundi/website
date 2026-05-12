'use server';

import { revalidateTag, revalidatePath } from 'next/cache';
import {
    tripActivitySchema
} from '@salvemundi/validations/schema/admin-reis.zod';
import { getSystemDirectus } from '@/lib/directus';
import {
    updateItem,
    deleteItem,
    createItem
} from '@directus/sdk';
import { requireAdminResource } from '@/server/auth/auth-utils';
import { AdminResource } from '@/shared/lib/permissions-config';
import {
    createTripActivityDb,
    updateTripActivityDb,
    deleteTripActivityDb,
} from '@/server/internal/reis-db.utils';



export async function createTripActivity(prevState: unknown, formData: FormData) {
    await requireAdminResource(AdminResource.Reis);

    const rawData: Record<string, unknown> = {};
    formData.forEach((value, key) => {
        if (key === 'options') {
            try { rawData[key] = JSON.parse(value as string); } catch (_error) { rawData[key] = []; }
        } else if (key === 'price' || key === 'display_order' || key === 'max_participants' || key === 'max_selections' || key === 'trip_id') {
            rawData[key] = value === '' ? null : (key === 'price' ? parseFloat(value as string) : parseInt(value as string));
        } else if (key === 'is_active') {
            rawData[key] = value === 'on' || value === 'true';
        } else {
            rawData[key] = value;
        }
    });

    const validated = tripActivitySchema.omit({ id: true }).safeParse(rawData);
    if (!validated.success) {
        return {
            error: "Sommige velden zijn niet correct ingevuld. Controleer het formulier.",
            fieldErrors: validated.error.flatten().fieldErrors,
            success: false,
            initialData: rawData
        };
    }

    try {
        const newId = await createTripActivityDb(validated.data);
        if (!newId) throw new Error('Database insert failed');

        getSystemDirectus().request(createItem('trip_activities', validated.data)).catch(() => {

        });

        revalidateTag('trip_activities', 'max');
        revalidatePath('/beheer/reis');
        revalidatePath('/beheer/reis/instellingen');
        revalidatePath('/beheer/reis/activiteiten');
        revalidatePath('/reis');

        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Onbekende fout';

        return { success: false, error: message };
    }
}

export async function updateTripActivity(prevState: unknown, formData: FormData) {
    await requireAdminResource(AdminResource.Reis);

    const id = parseInt(formData.get('id') as string);
    if (!id) throw new Error('Geen ID gevonden voor update');

    const rawData: Record<string, unknown> = {};
    formData.forEach((value, key) => {
        if (key === 'options') {
            try { rawData[key] = JSON.parse(value as string); } catch (_error) { rawData[key] = []; }
        } else if (key === 'price' || key === 'display_order' || key === 'max_participants' || key === 'max_selections' || key === 'trip_id') {
            rawData[key] = value === '' ? null : (key === 'price' ? parseFloat(value as string) : parseInt(value as string));
        } else if (key === 'is_active') {
            rawData[key] = value === 'on' || value === 'true';
        } else {
            rawData[key] = value;
        }
    });

    const validated = tripActivitySchema.omit({ id: true }).partial().safeParse(rawData);
    if (!validated.success) {
        return {
            error: "Sommige velden zijn niet correct ingevuld. Controleer het formulier.",
            fieldErrors: validated.error.flatten().fieldErrors,
            success: false,
            initialData: rawData
        };
    }

    try {
        const success = await updateTripActivityDb(id, validated.data);
        if (!success) throw new Error('Database update failed');

        getSystemDirectus().request(updateItem('trip_activities', id, validated.data)).catch(() => {

        });

        revalidateTag('trip_activities', 'max');
        revalidatePath('/beheer/reis');
        revalidatePath('/beheer/reis/instellingen');
        revalidatePath('/beheer/reis/activiteiten');
        revalidatePath('/reis');

        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Onbekende fout';

        return { success: false, error: message };
    }
}

export async function deleteTripActivity(id: number) {
    await requireAdminResource(AdminResource.Reis);

    try {
        const success = await deleteTripActivityDb(id);
        if (!success) throw new Error('Database delete failed');

        getSystemDirectus().request(deleteItem('trip_activities', id)).catch(() => {

        });

        revalidateTag('trip_activities', 'default');
        revalidatePath('/beheer/reis');
        revalidatePath('/beheer/reis/instellingen');
        revalidatePath('/beheer/reis/activiteiten');
        revalidatePath('/reis');

        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Onbekende fout';

        return { success: false, error: message };
    }
}
