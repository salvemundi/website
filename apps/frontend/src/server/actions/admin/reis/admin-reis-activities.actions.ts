'use server';

import { z } from 'zod';

import { revalidateTag, revalidatePath } from 'next/cache';
import {
    tripActivitySchema
} from '@salvemundi/validations/schema/admin-trip.zod';
import { requireAdminResource } from '@/server/auth/auth-utils';
import { AdminResource } from '@/shared/lib/permissions-config';
import { createTripActivityDb, updateTripActivityDb, deleteTripActivityDb } from '@/server/internal/reis/reis-activity-db.utils';;
import { safeConsoleError } from '@/server/utils/logger';

export async function createTripActivity(formData: FormData) {
    await requireAdminResource(AdminResource.Reis);

    const maxParticipantsRaw = formData.get('max_participants') as string;
    const maxSelectionsRaw = formData.get('max_selections') as string;

    const rawData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price: formData.get('price') === '' ? null : parseFloat(formData.get('price') as string),
        is_active: formData.get('is_active') === 'on' || formData.get('is_active') === 'true',
        display_order: formData.get('display_order') === '' ? 0 : parseInt(formData.get('display_order') as string),
        ...(maxParticipantsRaw && maxParticipantsRaw !== '' ? { max_participants: parseInt(maxParticipantsRaw) } : {}),
        ...(maxSelectionsRaw && maxSelectionsRaw !== '' ? { max_selections: parseInt(maxSelectionsRaw) } : {}),
        trip_id: formData.get('trip_id') === '' ? null : parseInt(formData.get('trip_id') as string),
        options: (() => {
            try {
                return JSON.parse(formData.get('options') as string || '[]') as unknown[];
            } catch {
                return [];
            }
        })()
    };

    const validated = tripActivitySchema.omit({ id: true }).safeParse(rawData);
    if (!validated.success) {
        safeConsoleError('[trip-activities.actions.ts][createTripActivity] Validation failed:', z.flattenError(validated.error).fieldErrors);
        safeConsoleError('[trip-activities.actions.ts][createTripActivity] Raw data:', rawData);
        return {
            error: "Sommige velden zijn niet correct ingevuld. Controleer het formulier.",
            fieldErrors: z.flattenError(validated.error).fieldErrors,
            success: false,
            initialData: rawData
        };
    }

    try {
        const newId = await createTripActivityDb(validated.data);
        if (!newId) throw new Error('Database insert failed');

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

export async function updateTripActivity(formData: FormData) {
    await requireAdminResource(AdminResource.Reis);

    const id = parseInt(formData.get('id') as string);
    if (!id) throw new Error('Geen ID gevonden voor update');

    const maxParticipantsRaw = formData.get('max_participants') as string;
    const maxSelectionsRaw = formData.get('max_selections') as string;

    const rawData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price: formData.get('price') === '' ? null : parseFloat(formData.get('price') as string),
        is_active: formData.get('is_active') === 'on' || formData.get('is_active') === 'true',
        display_order: formData.get('display_order') === '' ? 0 : parseInt(formData.get('display_order') as string),
        ...(maxParticipantsRaw && maxParticipantsRaw !== '' ? { max_participants: parseInt(maxParticipantsRaw) } : {}),
        ...(maxSelectionsRaw && maxSelectionsRaw !== '' ? { max_selections: parseInt(maxSelectionsRaw) } : {}),
        trip_id: formData.get('trip_id') === '' ? null : parseInt(formData.get('trip_id') as string),
        options: (() => {
            try {
                const opts = formData.get('options');
                return opts ? (JSON.parse(opts as string) as unknown[]) : undefined;
            } catch {
                return undefined;
            }
        })()
    };

    const validated = tripActivitySchema.omit({ id: true }).partial().safeParse(rawData);
    if (!validated.success) {
        return {
            error: "Sommige velden zijn niet correct ingevuld. Controleer het formulier.",
            fieldErrors: z.flattenError(validated.error).fieldErrors,
            success: false,
            initialData: rawData
        };
    }

    try {
        const success = await updateTripActivityDb(id, validated.data);
        if (!success) throw new Error('Database update failed');

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

        revalidateTag('trip_activities', 'default');
        revalidatePath('/beheer/reis');
        revalidatePath('/beheer/reis/instellingen');
        revalidatePath('/beheer/reis/activiteiten');
        revalidatePath('/reis');

        return { success: true };
    } catch (error) {
        safeConsoleError(`[trip-activities.actions.ts][deleteTripActivity] Failed to delete trip activity ${id}:`, error);
        const message = error instanceof Error ? error.message : 'Onbekende fout';
        return { success: false, error: message };
    }
}
