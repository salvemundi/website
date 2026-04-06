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
    createItem,
    uploadFiles
} from '@directus/sdk';
import { requireReisAdmin } from './reis-admin-utils';
import { query } from '@/lib/db';
import { getRedis } from '@/server/auth/redis-client';
import { FLAGS_CACHE_KEY } from '@/lib/feature-flags';
import { revalidateTag } from 'next/cache';
import { createTripDb, updateTripDb } from './reis-db.utils';



async function handleImageUpload(formData: FormData): Promise<string | null> {
    const file = formData.get('image_file') as File;
    if (!file || file.size === 0) return null;

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    
    // Optional: Add folder ID if needed, or leave at root
    // uploadFormData.append('folder', 'TRIP_BANNERS_FOLDER_ID');

    try {
        const client = getSystemDirectus();
        const response = await client.request(uploadFiles(uploadFormData));
        return (response as any).id;
    } catch (error) {
        console.error('Image upload failed:', error);
        return null;
    }
}

export async function createTrip(prevState: any, formData: FormData) {
    await requireReisAdmin();

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
            base_price: parseFloat(rawData.base_price as string) || 0,
            crew_discount: parseFloat(rawData.crew_discount as string) || 0,
            deposit_amount: parseFloat(rawData.deposit_amount as string) || 0,
            registration_start_date: rawData.registration_start_date || null,
            image: newImageId || (rawData.image as string) || null,
            event_date: (rawData.start_date as string) || null,
            start_date: (rawData.start_date as string) || null,
            end_date: (rawData.end_date as string) || null,
            status: 'published'
        };

        const validated = tripSchema.omit({ id: true }).safeParse(data);
        if (!validated.success) {
            return { success: false, error: 'Validatie mislukt', fieldErrors: validated.error.flatten().fieldErrors };
        }

        const newId = await createTripDb(validated.data);
        if (!newId) throw new Error('Database insert failed');

        getSystemDirectus().request(updateItem('trips', newId, validated.data as any)).catch(err => {
            console.error('Directus sync error:', err);
        });

        revalidatePath('/beheer/reis');
        revalidatePath('/beheer/reis/instellingen');
        revalidatePath('/beheer/reis/activiteiten');
        revalidatePath('/reis');
        
        return { success: true };
    } catch (error) {
        console.error('Error creating trip:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Internal server error' };
    }
}

export async function updateTrip(prevState: any, formData: FormData) {
    await requireReisAdmin();

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
            base_price: parseFloat(rawData.base_price as string) || 0,
            crew_discount: parseFloat(rawData.crew_discount as string) || 0,
            deposit_amount: parseFloat(rawData.deposit_amount as string) || 0,
            registration_start_date: rawData.registration_start_date || null,
            image: newImageId || (rawData.image as string) || null,
            start_date: (rawData.start_date as string) || null,
            end_date: (rawData.end_date as string) || null,
            event_date: (rawData.start_date as string) || null,
        };

        const validated = tripSchema.omit({ id: true }).partial().safeParse(data);
        if (!validated.success) {
            return { success: false, error: 'Validatie mislukt', fieldErrors: validated.error.flatten().fieldErrors };
        }

        const success = await updateTripDb(id, validated.data);
        if (!success) throw new Error('Database update failed');

        getSystemDirectus().request(updateItem('trips', id, validated.data as any)).catch(err => {
            console.error('Directus sync error:', err);
        });

        revalidatePath('/beheer/reis');
        revalidatePath('/beheer/reis/instellingen');
        revalidatePath('/beheer/reis/activiteiten');
        revalidatePath('/reis');
        
        return { success: true };
    } catch (error) {
        console.error('Error updating trip:', error);
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
        console.error('Error deleting trip:', error);
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
        } else {
            await query('INSERT INTO feature_flags (name, route_match, is_active) VALUES ($1, $2, $3)', 
                [flagName, '/reis', newStatus]);
        }

        // 1. Immediate clear for Proxy
        try {
            const redis = await getRedis();
            await redis.del(FLAGS_CACHE_KEY);
        } catch (e) {
            console.error('Initial Redis clear failed:', e);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        
        revalidateTag('feature_flags', 'default');
        revalidatePath('/', 'layout');
        revalidatePath('/beheer/reis');
        revalidatePath('/beheer/reis/instellingen');
        revalidatePath('/beheer/reis/activiteiten');

        try {
            const redis = await getRedis();
            await redis.del(FLAGS_CACHE_KEY);
        } catch (e) {
            console.error('Final Redis clear failed:', e);
        }
        
        return { success: true, show: newStatus };
    } catch (e) {
        console.error('Toggle visibility failed:', e);
        return { success: false, error: 'Bijwerken mislukt' };
    }
}
