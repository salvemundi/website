'use server';

import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import { db, schema } from '@salvemundi/db';
import { eq } from 'drizzle-orm';
import { requireBeheerFeature } from '@/server/auth/auth-utils';
import { getRedis } from '@/server/auth/redis-client';
import { FLAGS_CACHE_KEY, isAccEnvironment } from '@/lib/config/feature-flags';
import { createTripDb, updateTripDb, deleteTripDb, fetchFullTripsDb, fetchTripByIdDb } from '@/server/internal/reis/reis-trip-db.utils';
import { tripSchema, type Trip } from '@salvemundi/validations';
import { safeConsoleError } from '@/server/utils/logger';
import { logAuditAction } from '@/server/actions/infrastructure/audit.actions';
import { uploadToDirectus } from '@/server/utils/media';
import { amsterdamToUTC } from '@/lib/utils/date-utils';

async function handleImageUpload(formData: FormData): Promise<string | null> {
    const file = formData.get('image_file') as File | null;
    if (!file || file.size === 0) return null;

    const uploadResult = await uploadToDirectus(file);
    if (!uploadResult.success) {
        safeConsoleError('[trip-core.actions.ts][handleImageUpload] Upload failed:', uploadResult.error);
        return null;
    }
    
    return uploadResult.id;
}

export async function getBeheerTrips(): Promise<Trip[]> {
    await requireBeheerFeature('reis');
    return await fetchFullTripsDb();
}

export async function getBeheerTripById(id: number): Promise<Trip | null> {
    await requireBeheerFeature('reis');
    return await fetchTripByIdDb(id);
}

export async function createTrip(prevState: unknown, formData: FormData) {
    await requireBeheerFeature('reis');

    try {
        const newImageId = await handleImageUpload(formData);

        const rawData = Object.fromEntries(formData.entries());
        const data = {
            name: rawData.name as string,
            description: (rawData.description as string) || null,
            registration_open: rawData.registration_open === 'on' || rawData.registration_open === 'true',
            is_bus_trip: rawData.is_bus_trip === 'on' || rawData.is_bus_trip === 'true',
            allow_final_payments: rawData.allow_final_payments === 'on' || rawData.allow_final_payments === 'true',
            allow_deposit_payments: rawData.allow_deposit_payments === 'on' || rawData.allow_deposit_payments === 'true',
            max_participants: parseInt(rawData.max_participants as string) || 0,
            max_crew: parseInt(rawData.max_crew as string) || null,
            base_price: parseFloat(rawData.base_price as string) || 0,
            crew_discount: parseFloat(rawData.crew_discount as string) || 0,
            deposit_amount: parseFloat(rawData.deposit_amount as string) || 0,
            start_date: rawData.start_date || null,
            registration_start_date: amsterdamToUTC(rawData.registration_start_date as string) || null,
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

        const rawImage = validated.data.image;
        const imageId: string | null = typeof rawImage === 'string' ? rawImage : null;
        const depositAmount = String(validated.data.deposit_amount);
        const basePrice = String(validated.data.base_price);
        const crewDiscount = String(validated.data.crew_discount);
        const newId = await createTripDb({
            ...validated.data,
            image: imageId,
            base_price: basePrice,
            crew_discount: crewDiscount,
            deposit_amount: depositAmount
        });
        if (!newId) throw new Error('Database insert failed');

        await logAuditAction('admin_trip_created', 'SUCCESS', {
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
    await requireBeheerFeature('reis');

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
            allow_deposit_payments: rawData.allow_deposit_payments === 'on' || rawData.allow_deposit_payments === 'true',
            max_participants: parseInt(rawData.max_participants as string) || 0,
            max_crew: parseInt(rawData.max_crew as string) || null,
            base_price: parseFloat(rawData.base_price as string) || 0,
            crew_discount: parseFloat(rawData.crew_discount as string) || 0,
            deposit_amount: parseFloat(rawData.deposit_amount as string) || 0,
            start_date: rawData.start_date || null,
            registration_start_date: amsterdamToUTC(rawData.registration_start_date as string) || null,
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

        const rawImageUpdate = validated.data.image;
        const imageIdUpdate: string | null = typeof rawImageUpdate === 'string' ? rawImageUpdate : null;
        const depositAmount = validated.data.deposit_amount !== undefined
            ? String(validated.data.deposit_amount)
            : undefined;
        const basePrice = validated.data.base_price !== undefined
            ? String(validated.data.base_price)
            : undefined;
        const crewDiscount = validated.data.crew_discount !== undefined
            ? String(validated.data.crew_discount)
            : undefined;
        const success = await updateTripDb(id, {
            ...validated.data,
            image: imageIdUpdate,
            base_price: basePrice,
            crew_discount: crewDiscount,
            deposit_amount: depositAmount
        });
        if (!success) throw new Error('Database update failed');

        await logAuditAction('admin_trip_updated', 'SUCCESS', {
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
    await requireBeheerFeature('reis');
    try {
        await deleteTripDb(id);

        await logAuditAction('admin_trip_deleted', 'SUCCESS', {
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
    await requireBeheerFeature('reis');
    if (isAccEnvironment()) {
        return { success: false, error: 'Op de acceptatie-omgeving staan alle modules altijd aan.' };
    }

    try {
        const rows = await db.select({
            id: schema.feature_flags.id,
            is_active: schema.feature_flags.is_active
        }).from(schema.feature_flags)
        .where(eq(schema.feature_flags.route_match, '/reis'))
        .limit(1);

        const oldStatus = rows.length > 0 ? rows[0].is_active : true;
        const newStatus = !oldStatus;

        if (rows.length > 0) {
            await db.update(schema.feature_flags).set({ is_active: newStatus }).where(eq(schema.feature_flags.id, rows[0].id));
        } else {
            await db.insert(schema.feature_flags).values({
                name: 'trip_registration',
                route_match: '/reis',
                is_active: newStatus
            });
        }

        await logAuditAction('admin_trip_visibility_toggled', 'SUCCESS', {
            context: 'reis',
            show: newStatus
        });

        try {
            const redis = await getRedis();
            await redis.del(FLAGS_CACHE_KEY);
        } catch (error) {
            safeConsoleError('[trip-core.actions.ts][toggleReisVisibility] Redis clear failed:', error);
        }

        revalidateTag('feature_flags', 'max');
        revalidatePath('/', 'layout');
        revalidatePath('/beheer/reis');
        revalidatePath('/beheer/reis/instellingen');

        return { success: true, show: newStatus };
    } catch (error) {
        safeConsoleError('[trip-core.actions.ts][toggleReisVisibility] Error:', error);
        return { success: false, error: 'Bijwerken mislukt' };
    }
}
