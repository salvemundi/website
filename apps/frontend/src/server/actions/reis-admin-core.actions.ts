'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
    tripSchema,
    TRIP_FIELDS,
    type DbTrip
} from '@salvemundi/validations';
import { getSystemDirectus } from '@/lib/directus';
import { 
    readItems, 
    updateItem, 
    deleteItem, 
    createItem
} from '@directus/sdk';
import { requireReisAdmin } from './reis-admin-utils';
import { query } from '@/lib/db';
import { getRedis } from '@/server/auth/redis-client';
import { FLAGS_CACHE_KEY } from '@/lib/feature-flags';
import { revalidateTag } from 'next/cache';

// getTrips removed - Use getTrips from @/server/queries/admin-reis.queries instead to avoid redundancy.

export async function createTrip(prevState: unknown, formData: FormData) {
    await requireReisAdmin();

    const rawData = Object.fromEntries(formData.entries());
    const data = {
        ...rawData,
        registration_open: rawData.registration_open === 'on' || rawData.registration_open === 'true',
        is_bus_trip: rawData.is_bus_trip === 'on' || rawData.is_bus_trip === 'true',
        allow_final_payments: rawData.allow_final_payments === 'on' || rawData.allow_final_payments === 'true',
        max_participants: parseInt(rawData.max_participants as string) || 0,
        max_crew: parseInt(rawData.max_crew as string) || 0,
        base_price: parseFloat(rawData.base_price as string) || 0,
        crew_discount: parseFloat(rawData.crew_discount as string) || 0,
        deposit_amount: parseFloat(rawData.deposit_amount as string) || 0,
        registration_start_date: rawData.registration_start_date || null,
        description: rawData.description || null,
        image: rawData.image || null,
        event_date: rawData.start_date || null,
    };

    const validated = tripSchema.omit({ id: true }).safeParse(data);
    if (!validated.success) {
        return { success: false, error: 'Validatie mislukt', fieldErrors: validated.error.flatten().fieldErrors };
    }

    try {
        await getSystemDirectus().request(createItem('trips', validated.data as any));

        revalidatePath('/beheer/reis');
        revalidatePath('/beheer/reis/instellingen');
        revalidatePath('/beheer/reis/activiteiten');
        return { success: true };
    } catch (error) {
        console.error('[AdminReisActions#createTrip] Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Internal server error' };
    }
}

export async function updateTrip(id: number, prevState: unknown, formData: FormData) {
    await requireReisAdmin();

    const rawData = Object.fromEntries(formData.entries());
    const data = {
        ...rawData,
        registration_open: rawData.registration_open === 'on' || rawData.registration_open === 'true',
        is_bus_trip: rawData.is_bus_trip === 'on' || rawData.is_bus_trip === 'true',
        allow_final_payments: rawData.allow_final_payments === 'on' || rawData.allow_final_payments === 'true',
        max_participants: parseInt(rawData.max_participants as string) || 0,
        max_crew: parseInt(rawData.max_crew as string) || 0,
        base_price: parseFloat(rawData.base_price as string) || 0,
        crew_discount: parseFloat(rawData.crew_discount as string) || 0,
        deposit_amount: parseFloat(rawData.deposit_amount as string) || 0,
        registration_start_date: rawData.registration_start_date || null,
        description: rawData.description || null,
        image: rawData.image || null,
        event_date: rawData.start_date || null,
    };

    const validated = tripSchema.omit({ id: true }).partial().safeParse(data);
    if (!validated.success) {
        return { success: false, error: 'Validatie mislukt', fieldErrors: validated.error.flatten().fieldErrors };
    }

    try {
        await getSystemDirectus().request(updateItem('trips', id, validated.data as any));

        revalidatePath('/beheer/reis');
        revalidatePath('/beheer/reis/instellingen');
        revalidatePath('/beheer/reis/activiteiten');
        return { success: true };
    } catch (error) {
        console.error('[AdminReisActions#updateTrip] Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Internal server error' };
    }
}

export async function deleteTrip(id: number) {
    await requireReisAdmin();
    try {
        await getSystemDirectus().request(deleteItem('trips', id));
        revalidatePath('/beheer/reis');
        revalidatePath('/beheer/reis/instellingen');
        revalidatePath('/beheer/reis/activiteiten');
        return { success: true };
    } catch (error) {
        console.error('[AdminReisActions#deleteTrip] Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Internal server error' };
    }
}

export async function toggleReisVisibility(): Promise<{ success: boolean; show?: boolean; error?: string }> {
    await requireReisAdmin();
    const flagName = 'trip_registration';

    try {
        const sql = 'SELECT id, is_active FROM feature_flags WHERE name = $1 LIMIT 1';
        const { rows } = await query(sql, [flagName]);
        
        const flag = rows?.[0];
        const oldStatus = flag ? !!flag.is_active : true;
        const newStatus = !oldStatus;
        
        if (flag) {
            await query('UPDATE feature_flags SET is_active = $1 WHERE id = $2', [newStatus, flag.id]);
            console.log(`[AdminReis] Toggle (SQL): DB was ${oldStatus}, setting to ${newStatus} (ID: ${flag.id})`);
        } else {
            await query('INSERT INTO feature_flags (name, route_match, is_active) VALUES ($1, $2, $3)', 
                [flagName, '/reis', newStatus]);
            console.log(`[AdminReis] Toggle (SQL): Created new flag for ${flagName} with is_active: ${newStatus}`);
        }

        // 1. Immediate clear for Proxy
        try {
            const redis = await getRedis();
            await redis.del(FLAGS_CACHE_KEY);
            console.log(`[AdminReis] Initial Redis cache clear (immediate)`);
        } catch (e) {
            console.error('[AdminReis] Initial Redis clear failed:', e);
        }

        // 2. Consistency wait
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log(`[AdminReis] Revalidating: feature_flags (profile: default)`);
        revalidateTag('feature_flags', 'default');
        revalidatePath('/', 'layout');
        revalidatePath('/beheer/reis');
        revalidatePath('/beheer/reis/instellingen');
        revalidatePath('/beheer/reis/activiteiten');

        // 3. Final clear
        try {
            const redis = await getRedis();
            const deletedRows = await redis.del(FLAGS_CACHE_KEY);
            console.log(`[AdminReis] Final Redis cache clear. Keys deleted: ${deletedRows}`);
        } catch (e) {
            console.error('[AdminReis] Final Redis clear failed:', e);
        }
        
        return { success: true, show: newStatus };
    } catch (e) {
        console.error('[AdminReis] Toggle visibility failed:', e);
        return { success: false, error: 'Bijwerken mislukt' };
    }
}
