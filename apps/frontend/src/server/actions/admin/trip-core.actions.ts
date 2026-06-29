'use server';

import { z } from 'zod';

import { revalidatePath, revalidateTag } from 'next/cache';
import { db, schema } from '@salvemundi/db';
import { eq } from 'drizzle-orm';
import { requireAdminResource } from '@/server/auth/auth-utils';
import { AdminResource } from '@/shared/lib/permissions-config';
import { getRedis } from '@/server/auth/redis-client';
import { FLAGS_CACHE_KEY } from '@/lib/config/feature-flags';
import {
    createTripDb,
    updateTripDb,
    deleteTripDb,
    fetchFullTripsDb,
    fetchTripByIdDb
} from '@/server/internal/trip-db.utils';
import { tripSchema } from '@salvemundi/validations/schema/admin-trip.zod';
import { safeConsoleError } from '@/server/utils/logger';
import { logAdminAction } from '@/server/actions/infrastructure/audit.actions';

async function handleImageUpload(formData: FormData): Promise<string | null> {
    const file = formData.get('image_file') as File | null;
    if (!file || file.size === 0) return null;

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
        const token = process.env.DIRECTUS_STATIC_TOKEN;
        const directusUrl = process.env.INTERNAL_DIRECTUS_URL;
        const res = await fetch(`${directusUrl}/files`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: uploadFormData
        });

        if (!res.ok) {
            throw new Error(`Upload failed: ${await res.text()}`);
        }

        const json = await res.json() as { data?: { id?: string } };
        return json.data?.id || null;
    } catch (error) {
        safeConsoleError('[trip-core.actions.ts][handleImageUpload] Upload failed:', error);
        return null;
    }
}

export async function getAdminTrips() {
    await requireAdminResource(AdminResource.Reis);
    return await fetchFullTripsDb();
}

export async function getAdminTripById(id: number) {
    await requireAdminResource(AdminResource.Reis);
    return await fetchTripByIdDb(id);
}

export async function createTrip(prevState: unknown, formData: FormData) {
    await requireAdminResource(AdminResource.Reis);

    try {
        const newImageId = await handleImageUpload(formData);

        const rawData = Object.fromEntries(formData.entries());
        const data = {
            name: rawData.name as string,
            description: (rawData.description as string) || null,
            registration_open: rawData.registration_open === 'on' || rawData.registration_open === 'true',
            is_bus_trip: rawData.is_bus_trip === 'on' || rawData.is_bus_trip === 'true',
            allow_final_payments: rawData.allow_final_payments === 'on' || rawData.allow_final_payments === 'true',
            max_participants: parseInt(rawData.max_participants as string) || 0,
            max_crew: parseInt(rawData.max_crew as string) || null,
            base_price: parseFloat(rawData.base_price as string) || 0,
            crew_discount: parseFloat(rawData.crew_discount as string) || 0,
            deposit_amount: parseFloat(rawData.deposit_amount as string) || 0,
            start_date: rawData.start_date || null,
            registration_start_date: rawData.registration_start_date || null,
            image: newImageId || (rawData.image as string) || null,
            end_date: (rawData.end_date as string) || null,
            status: 'published'
        };

        const validated = tripSchema.omit({ id: true }).safeParse(data);
        if (!validated.success) {
            return {
                success: false,
                error: 'Sommige velden zijn niet correct ingevuld.',
                fieldErrors: z.flattenError(validated.error).fieldErrors,
                initialData: rawData
            };
        }

        const newId = await createTripDb(validated.data);
        if (!newId) throw new Error('Database insert failed');

        await logAdminAction('admin_trip_created', 'SUCCESS', {
            context: 'reis',
            trip_id: newId,
            name: validated.data.name,
            data: validated.data
        });

        revalidatePath('/beheer/reis');
        revalidatePath('/beheer/reis/instellingen');
        revalidatePath('/beheer/reis/activiteiten');
        revalidatePath('/reis');

        return { success: true, id: newId };
    } catch (error) {
        safeConsoleError('[trip-core.actions.ts][createTrip] Error:', error);
        const rawData = Object.fromEntries(formData.entries());
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Interne serverfout',
            initialData: rawData
        };
    }
}

export async function updateTrip(prevState: unknown, formData: FormData) {
    await requireAdminResource(AdminResource.Reis);

    try {
        const id = parseInt(formData.get('id') as string);
        if (!id) throw new Error('Geen ID gevonden voor update');

        const newImageId = await handleImageUpload(formData);

        const rawData = Object.fromEntries(formData.entries());
        const data = {
            name: rawData.name as string,
            description: (rawData.description as string) || null,
            registration_open: rawData.registration_open === 'on' || rawData.registration_open === 'true',
            is_bus_trip: rawData.is_bus_trip === 'on' || rawData.is_bus_trip === 'true',
            allow_final_payments: rawData.allow_final_payments === 'on' || rawData.allow_final_payments === 'true',
            max_participants: parseInt(rawData.max_participants as string) || 0,
            max_crew: parseInt(rawData.max_crew as string) || null,
            base_price: parseFloat(rawData.base_price as string) || 0,
            crew_discount: parseFloat(rawData.crew_discount as string) || 0,
            deposit_amount: parseFloat(rawData.deposit_amount as string) || 0,
            start_date: rawData.start_date || null,
            registration_start_date: rawData.registration_start_date || null,
            image: newImageId || (rawData.existing_image_id as string) || null,

            end_date: (rawData.end_date as string) || null
        };

        const validated = tripSchema.omit({ id: true }).partial().safeParse(data);
        if (!validated.success) {
            return {
                success: false,
                error: 'Sommige velden zijn niet correct ingevuld.',
                fieldErrors: z.flattenError(validated.error).fieldErrors,
                initialData: rawData
            };
        }

        const success = await updateTripDb(id, validated.data);
        if (!success) throw new Error('Database update failed');

        await logAdminAction('admin_trip_updated', 'SUCCESS', {
            context: 'reis',
            trip_id: id,
            updates: validated.data
        });

        revalidatePath('/beheer/reis');
        revalidatePath('/beheer/reis/instellingen');
        revalidatePath('/beheer/reis/activiteiten');
        revalidatePath('/reis');

        return { success: true };
    } catch (error) {
        safeConsoleError(`[trip-core.actions.ts][updateTrip] Error for ${formData.get('id')}:`, error);
        const rawData = Object.fromEntries(formData.entries());
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Interne serverfout',
            initialData: rawData
        };
    }
}

export async function deleteTrip(id: number) {
    await requireAdminResource(AdminResource.Reis);
    try {
        await deleteTripDb(id);

        await logAdminAction('admin_trip_deleted', 'SUCCESS', {
            context: 'reis',
            trip_id: id
        });

        revalidatePath('/beheer/reis');
        revalidatePath('/beheer/reis/instellingen');
        revalidatePath('/beheer/reis/activiteiten');
        return { success: true };
    } catch (error) {
        safeConsoleError(`[trip-core.actions.ts][deleteTrip] Error for ${id}:`, error);
        return { success: false, error: error instanceof Error ? error.message : 'Interne serverfout' };
    }
}

interface _FeatureFlag {
    id: string;
    name: string;
    is_active: boolean;
    route_match: string;
}

export async function toggleReisVisibility(): Promise<{ success: boolean; show?: boolean; error?: string }> {
    await requireAdminResource(AdminResource.Reis);
    const flagName = 'trip_registration';

    try {
        const rows = await db.select({
            id: schema.feature_flags.id,
            is_active: schema.feature_flags.is_active
        }).from(schema.feature_flags)
        .where(eq(schema.feature_flags.name, flagName))
        .limit(1);

        const oldStatus = rows.length > 0 ? rows[0].is_active : true;
        const newStatus = !oldStatus;

        if (rows.length > 0) {
            await db.update(schema.feature_flags).set({ is_active: newStatus }).where(eq(schema.feature_flags.id, rows[0].id));
        } else {
            await db.insert(schema.feature_flags).values({
                name: flagName,
                route_match: '/reis',
                is_active: newStatus
            });
        }

        await logAdminAction('admin_trip_visibility_toggled', 'SUCCESS', {
            context: 'reis',
            show: newStatus
        });

        // Clear Proxy Cache
        try {
            const redis = await getRedis();
            await redis.del(FLAGS_CACHE_KEY);
        } catch (e) {
            safeConsoleError('[trip-core.actions.ts][toggleReisVisibility] Redis clear failed:', e);
        }

        revalidateTag('feature_flags', 'max');
        revalidatePath('/', 'layout');
        revalidatePath('/beheer/reis');
        revalidatePath('/beheer/reis/instellingen');

        return { success: true, show: newStatus };
    } catch (e) {
        safeConsoleError('[trip-core.actions.ts][toggleReisVisibility] Error:', e);
        return { success: false, error: 'Bijwerken mislukt' };
    }
}
