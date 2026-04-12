'use server';

import { z } from 'zod';
import { auth } from '@/server/auth/auth';
import { revalidateTag, revalidatePath, unstable_noStore as noStore } from "next/cache";
import { isSuperAdmin } from "@/lib/auth";
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

const introNotificationSchema = z.object({
    title: z.string().min(1, 'Titel is verplicht'),
    body: z.string().min(1, 'Inhoud is verplicht'),
    includeParents: z.boolean().default(false),
});

import { AdminResource } from '@/shared/lib/permissions-config';
import { getRedis } from '@/server/auth/redis-client';
import { FLAGS_CACHE_KEY } from '@/lib/config/feature-flags';
import { hasPermission } from '@/shared/lib/permissions';
import { query } from '@/lib/database';

async function checkIntroAdminAccess() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error('Niet ingelogd');

    const user = session.user as any;
    if (!hasPermission(user.committees, AdminResource.Intro)) {
        throw new Error('Geen toegang: onvoldoende rechten voor intro beheer');
    }
    
    return session;
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

export async function upsertIntroBlog(blog: Partial<IntroBlog>): Promise<{ success: boolean; data?: IntroBlog; error?: string; fieldErrors?: any }> {
    const session = await checkIntroAdminAccess();

    const validated = introBlogSchema.partial().safeParse(blog);
    if (!validated.success) {
        return { success: false, error: 'Validatie mislukt', fieldErrors: validated.error.flatten().fieldErrors };
    }

    const { id, ...payload } = validated.data;
    
    try {
        let result;
        const sanitizedPayload = {
            ...payload,
            created_at: payload.created_at instanceof Date ? payload.created_at.toISOString() : payload.created_at
        };
        
        if (id) {
            result = await getSystemDirectus().request(updateItem('intro_blogs', id, sanitizedPayload));
        } else {
            result = await getSystemDirectus().request(createItem('intro_blogs', sanitizedPayload));
        }
        revalidatePath('/beheer/intro');
        return { success: true, data: { 
            ...result, 
            id: Number(result.id),
            title: result.title || '',
            content: result.content || '',
            blog_type: (result.blog_type || 'update') as any,
            is_published: !!result.is_published
        } as IntroBlog };
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

export async function upsertIntroPlanning(item: Partial<IntroPlanningItem>): Promise<{ success: boolean; data?: IntroPlanningItem; error?: string; fieldErrors?: any }> {
    const session = await checkIntroAdminAccess();

    const validated = introPlanningSchema.partial().safeParse(item);
    if (!validated.success) {
        return { success: false, error: 'Validatie mislukt', fieldErrors: validated.error.flatten().fieldErrors };
    }

    const { id, date, ...rest } = validated.data;

    let day = rest.day;
    if (date) {
        try {
            day = new Date(date).toLocaleDateString('nl-NL', { weekday: 'long' });
        } catch { }
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
            ...result, 
            id: Number(result.id),
            date: result.date || '',
            time_start: result.time_start || '',
            title: result.title || '',
            description: result.description || ''
        } as IntroPlanningItem };
    } catch (e) {
        
        return { success: false, error: 'Opslaan mislukt' };
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
        
        
        revalidateTag('feature_flags', 'default');
        revalidatePath('/', 'layout');
        revalidatePath('/beheer/intro');

        // 3. Final clear to ensure concurrent requests that fetched stale data are purged
        try {
            const redis = await getRedis();
            const deletedRows = await redis.del(FLAGS_CACHE_KEY);
            
        } catch (e) {
            
        }
        
        return { success: true, show: newStatus };
    } catch (e) {
        
        return { success: false, error: 'Bijwerken mislukt' };
    }
}


export async function sendIntroCustomNotification(
    title: string,
    body: string,
    includeParents: boolean
): Promise<{ success: boolean; sent?: number; error?: string }> {
    await checkIntroAdminAccess();

    const validated = introNotificationSchema.safeParse({ title, body, includeParents });
    if (!validated.success) {
        return { success: false, error: 'Validatie mislukt' };
    }

    const notificationApiUrl = process.env.NEXT_PUBLIC_NOTIFICATION_API_URL;
    if (!notificationApiUrl) return { success: false, error: 'Notification API niet geconfigureerd' };

    try {
        const res = await fetch(`${notificationApiUrl}/api/notifications/send-intro-custom`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validated.data),
        });
        if (!res.ok) return { success: false, error: 'Verzenden mislukt' };
        const json = await res.json();
        return { success: true, sent: json.sent ?? 0 };
    } catch {
        return { success: false, error: 'Verzenden mislukt' };
    }
}

