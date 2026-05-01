'use server';

import { z } from 'zod';
import { auth } from '@/server/auth/auth';
import { revalidateTag, revalidatePath, unstable_noStore as noStore } from "next/cache";
import { headers } from 'next/headers';
import { 
    INTRO_BLOG_FIELDS, 
    INTRO_PLANNING_FIELDS,
    FEATURE_FLAG_FIELDS,
    INTRO_SIGNUP_FIELDS,
    INTRO_PARENT_SIGNUP_FIELDS
} from '@salvemundi/validations/directus/fields';
import {
    introBlogSchema,
    introPlanningSchema,
    type IntroBlog,
    type IntroPlanningItem
} from '@salvemundi/validations/schema/intro.zod';

import { 
    getIntroStatsInternal, 
    getIntroSignupsInternal, 
    getIntroParentSignupsInternal, 
    getIntroBlogsInternal, 
    getIntroPlanningInternal 
} from '@/server/queries/admin-intro.queries';

import { getSystemDirectus } from "@/lib/directus";
import { 
    deleteItem,
    updateItem,
    createItem,
} from '@directus/sdk';

import { AdminResource } from '@/shared/lib/permissions-config';
import { getRedis } from '@/server/auth/redis-client';
import { FLAGS_CACHE_KEY } from '@/lib/config/feature-flags';
import { query } from '@/lib/database';

import { requireAdminResource } from '@/server/auth/auth-utils';

async function checkIntroAdminAccess() {
    return requireAdminResource(AdminResource.Intro);
}


export async function getIntroStats() {
    await checkIntroAdminAccess();
    return getIntroStatsInternal();
}


export async function getIntroSignups() {
    await checkIntroAdminAccess();
    return getIntroSignupsInternal();
}

export async function deleteIntroSignup(id: number): Promise<{ success: boolean; error?: string }> {
    const session = await checkIntroAdminAccess();
    try {
        await getSystemDirectus().request(deleteItem('intro_signups', id));
        revalidatePath('/beheer/intro');
        return { success: true };
    } catch (e) {
        
        return { success: false, error: 'Verwijderen mislukt' };
    }
}


export async function getIntroParentSignups() {
    await checkIntroAdminAccess();
    return getIntroParentSignupsInternal();
}

export async function deleteIntroParentSignup(id: number): Promise<{ success: boolean; error?: string }> {
    const session = await checkIntroAdminAccess();
    try {
        await getSystemDirectus().request(deleteItem('intro_parent_signups', id));
        revalidatePath('/beheer/intro');
        return { success: true };
    } catch (e) {
        
        return { success: false, error: 'Verwijderen mislukt' };
    }
}


export async function getIntroBlogs() {
    await checkIntroAdminAccess();
    return getIntroBlogsInternal();
}

export async function upsertIntroBlog(blog: Partial<IntroBlog>): Promise<{ success: boolean; data?: IntroBlog; error?: string; fieldErrors?: Record<string, string[] | undefined> }> {
    const session = await checkIntroAdminAccess();

    // Sanitize: Directus returns null for empty fields, but Zod .optional() expects undefined.
    const sanitized = Object.fromEntries(
        Object.entries(blog).map(([k, v]) => [k, v === null ? undefined : v])
    );

    const validated = introBlogSchema.safeParse(sanitized);
    if (!validated.success) {
        const fieldErrors = validated.error.flatten().fieldErrors;
        return { 
            success: false, 
            error: `Validatie mislukt: ${Object.keys(fieldErrors).join(', ')}`, 
            fieldErrors 
        };
    }

    const { id, ...payload } = validated.data;
    
    try {
        let rows: any[];
        const sanitizedPayload = {
            ...payload,
            created_at: payload.created_at instanceof Date ? payload.created_at.toISOString() : payload.created_at
        };
        
        if (id) {
            const sql = `
                UPDATE intro_blogs 
                SET title = $1, content = $2, blog_type = $3, is_published = $4, slug = $5, excerpt = $6, created_at = $7
                WHERE id = $8 RETURNING *
            `;
            const result = await query(sql, [
                sanitizedPayload.title, sanitizedPayload.content, sanitizedPayload.blog_type, 
                sanitizedPayload.is_published, sanitizedPayload.slug, sanitizedPayload.excerpt, 
                sanitizedPayload.created_at, id
            ]);
            rows = result.rows;
        } else {
            const sql = `
                INSERT INTO intro_blogs (title, content, blog_type, is_published, slug, excerpt, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
            `;
            const result = await query(sql, [
                sanitizedPayload.title, sanitizedPayload.content, sanitizedPayload.blog_type, 
                sanitizedPayload.is_published, sanitizedPayload.slug, sanitizedPayload.excerpt, 
                sanitizedPayload.created_at
            ]);
            rows = result.rows;
        }
        revalidatePath('/beheer/intro');
        
        const row = rows[0];
        return { success: true, data: { 
            id: Number(row.id),
            title: row.title || '',
            content: row.content || '',
            blog_type: (row.blog_type || 'update') as IntroBlog['blog_type'],
            is_published: !!row.is_published,
            created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
            slug: row.slug || '',
            excerpt: row.excerpt || ''
        } };
    } catch (e) {
        return { success: false, error: 'Opslaan mislukt' };
    }
}

export async function deleteIntroBlog(id: number): Promise<{ success: boolean; error?: string }> {
    const session = await checkIntroAdminAccess();
    try {
        await getSystemDirectus().request(deleteItem('intro_blogs', id));
        revalidatePath('/beheer/intro');
        return { success: true };
    } catch (e) {
        
        return { success: false, error: 'Verwijderen mislukt' };
    }
}


export async function getIntroPlanning() {
    await checkIntroAdminAccess();
    return getIntroPlanningInternal();
}

export async function upsertIntroPlanning(item: Partial<IntroPlanningItem>): Promise<{ success: boolean; data?: IntroPlanningItem; error?: string; fieldErrors?: Record<string, string[] | undefined> }> {
    const session = await checkIntroAdminAccess();

    // Sanitize: Directus returns null for empty fields, but Zod .optional() expects undefined.
    const sanitized = Object.fromEntries(
        Object.entries(item).map(([k, v]) => [k, v === null ? undefined : v])
    );

    const validated = introPlanningSchema.safeParse(sanitized);
    if (!validated.success) {
        const fieldErrors = validated.error.flatten().fieldErrors;
        return { 
            success: false, 
            error: `Validatie mislukt: ${Object.keys(fieldErrors).join(', ')}`, 
            fieldErrors 
        };
    }

    const { id, date, ...rest } = validated.data;

    let day = rest.day;
    if (date) {
        try {
            // Use a more robust way to get the Dutch day name
            const d = new Date(date);
            if (!isNaN(d.getTime())) {
                day = d.toLocaleDateString('nl-NL', { weekday: 'long' });
            }
        } catch (e) {
            console.error('Error calculating day:', e);
        }
    }

    // Ensure day is at least an empty string if it's missing, 
    // but better to throw an error if it's required and we can't calculate it.
    if (!day && date) {
        day = 'Onbekend'; // Fallback if calculation fails
    }

    const payload = { ...rest, date, day };
    
    try {
        let result;
        if (id) {
            result = await getSystemDirectus().request(updateItem('intro_planning', id, payload));
        } else {
            result = await getSystemDirectus().request(createItem('intro_planning', payload));
        }
        revalidatePath('/beheer/intro');
        return { success: true, data: { 
            id: Number(result.id),
            date: result.date || '',
            time_start: result.time_start || '',
            title: result.title || '',
            description: result.description || '',
            day: result.day || '',
            location: result.location
        } };
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Onbekende fout';
        console.error('[AdminIntro] Failed to upsert planning:', e);
        return { success: false, error: `Opslaan mislukt: ${message}` };
    }
}

export async function deleteIntroPlanning(id: number): Promise<{ success: boolean; error?: string }> {
    const session = await checkIntroAdminAccess();
    try {
        await getSystemDirectus().request(deleteItem('intro_planning', id));
        revalidatePath('/beheer/intro');
        return { success: true };
    } catch (e) {
        
        return { success: false, error: 'Verwijderen mislukt' };
    }
}

export async function updateIntroSignup(id: number, data: Partial<Record<string, unknown>>): Promise<{ success: boolean; error?: string }> {
    await checkIntroAdminAccess();
    
    const allowedFields = ['status', 'payment_status', 'is_member', 'notes', 'checked_in'];
    const filteredData = Object.fromEntries(
        Object.entries(data).filter(([key]) => allowedFields.includes(key))
    );

    if (Object.keys(filteredData).length === 0) {
        return { success: false, error: 'Geen geldige velden om bij te werken' };
    }

    try {
        await getSystemDirectus().request(updateItem('intro_signups', id, filteredData));
        revalidatePath('/beheer/intro');
        return { success: true };
    } catch (e) {
        return { success: false, error: 'Bijwerken mislukt' };
    }
}

export async function updateIntroParentSignup(id: number, data: Partial<Record<string, unknown>>): Promise<{ success: boolean; error?: string }> {
    await checkIntroAdminAccess();
    
    // PENTEST HARDENING: Strictly validate update payload
    const allowedFields = ['status', 'payment_status', 'notes', 'checked_in'];
    const filteredData = Object.fromEntries(
        Object.entries(data).filter(([key]) => allowedFields.includes(key))
    );

    if (Object.keys(filteredData).length === 0) {
        return { success: false, error: 'Geen geldige velden om bij te werken' };
    }

    try {
        await getSystemDirectus().request(updateItem('intro_parent_signups', id, filteredData));
        revalidatePath('/beheer/intro');
        return { success: true };
    } catch (e) {
        return { success: false, error: 'Bijwerken mislukt' };
    }
}


export async function toggleIntroVisibility(): Promise<{ success: boolean; show?: boolean; error?: string }> {
    await checkIntroAdminAccess();
    const route = '/intro';

    try {
        const sql = 'SELECT id, is_active FROM feature_flags WHERE route_match = $1 LIMIT 1';
        const { rows } = await query(sql, [route]);
        
        const flag = rows?.[0];
        const oldStatus = flag ? !!flag.is_active : true;
        const newStatus = !oldStatus;
        
        if (flag) {
            await query('UPDATE feature_flags SET is_active = $1 WHERE id = $2', [newStatus, flag.id]);
            
        } else {
            await query('INSERT INTO feature_flags (name, route_match, is_active) VALUES ($1, $2, $3)', 
                ['Intro Inschrijving', route, newStatus]);
            
        }

        // 1. Immediate clear to disrupt any current stale requests
        try {
            const redis = await getRedis();
            await redis.del(FLAGS_CACHE_KEY);
            
        } catch (e) {
            
        }

        // 2. Wait for Directus DB/Cache consistency if other systems read via API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        
        revalidateTag('feature_flags', 'max');
        revalidatePath('/', 'layout');
        revalidatePath('/beheer/intro');

        // 3. Final clear to ensure concurrent requests that fetched stale data are purged
        try {
            const redis = await getRedis();
            const deletedRows = await redis.del(FLAGS_CACHE_KEY);
            
        } catch (e) {
            
        }
        
        return { success: true, show: newStatus };
    } catch (e: unknown) {
        
        return { success: false, error: 'Bijwerken mislukt' };
    }
}

