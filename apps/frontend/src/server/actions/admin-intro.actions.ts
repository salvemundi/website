'use server';

import { auth } from '@/server/auth/auth';
import { revalidateTag, revalidatePath, unstable_noStore as noStore } from "next/cache";
import { isSuperAdmin } from "@/lib/auth-utils";
import { headers } from 'next/headers';
import type { IntroBlog, IntroPlanningItem } from '@salvemundi/validations';

import { getSystemDirectus } from "@/lib/directus";
import { 
    readItems,
    deleteItem,
    updateItem,
    createItem,
    aggregate 
} from '@directus/sdk';
import { 
    INTRO_BLOG_FIELDS, 
    INTRO_PLANNING_FIELDS,
    FEATURE_FLAG_FIELDS,
    INTRO_SIGNUP_FIELDS,
    INTRO_PARENT_SIGNUP_FIELDS
} from '@salvemundi/validations';

import { AdminResource } from '@/shared/lib/permissions-config';
import { getRedis } from '@/server/auth/redis-client';
import { FLAGS_CACHE_KEY } from '@/lib/feature-flags';
import { hasPermission } from '@/shared/lib/permissions';
import { query } from '@/lib/db';

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
    
    try {
        const client = getSystemDirectus();
        const [s, p, b, pl] = await Promise.all([
            client.request(aggregate('intro_signups', { aggregate: { count: '*' } })),
            client.request(aggregate('intro_parent_signups', { aggregate: { count: '*' } })),
            client.request(aggregate('intro_blogs', { aggregate: { count: '*' } })),
            client.request(aggregate('intro_planning', { aggregate: { count: '*' } })),
        ]);

        return {
            signups: Number(s?.[0]?.count ?? 0),
            parents: Number(p?.[0]?.count ?? 0),
            blogs: Number(b?.[0]?.count ?? 0),
            planning: Number(pl?.[0]?.count ?? 0),
        };
    } catch (e) {
        console.error('[AdminIntro] Get stats failed:', e);
        return { signups: 0, parents: 0, blogs: 0, planning: 0 };
    }
}


export async function getIntroSignups() {
    await checkIntroAdminAccess();
    try {
        const items = await getSystemDirectus().request(readItems('intro_signups', {
            sort: ['-id'],
            limit: 1000,
            fields: [...INTRO_SIGNUP_FIELDS]
        }));
        return (items ?? []) as any[];
    } catch (e) {
        console.error('[AdminIntro] Get signups failed:', e);
        throw new Error('Kon aanmeldingen niet ophalen');
    }
}

export async function deleteIntroSignup(id: number): Promise<{ success: boolean; error?: string }> {
    const session = await checkIntroAdminAccess();
    try {
        await getSystemDirectus().request(deleteItem('intro_signups', id));
        revalidatePath('/beheer/intro');
        return { success: true };
    } catch (e) {
        console.error('[AdminIntro] Delete signup failed:', e);
        return { success: false, error: 'Verwijderen mislukt' };
    }
}


export async function getIntroParentSignups() {
    await checkIntroAdminAccess();
    try {
        const items = await getSystemDirectus().request(readItems('intro_parent_signups', {
            sort: ['-id'],
            limit: 1000,
            fields: [...INTRO_PARENT_SIGNUP_FIELDS]
        }));
        return (items ?? []) as any[];
    } catch (e) {
        console.error('[AdminIntro] Get parent signups failed:', e);
        throw new Error('Kon ouder-aanmeldingen niet ophalen');
    }
}

export async function deleteIntroParentSignup(id: number): Promise<{ success: boolean; error?: string }> {
    const session = await checkIntroAdminAccess();
    try {
        await getSystemDirectus().request(deleteItem('intro_parent_signups', id));
        revalidatePath('/beheer/intro');
        return { success: true };
    } catch (e) {
        console.error('[AdminIntro] Delete parent signup failed:', e);
        return { success: false, error: 'Verwijderen mislukt' };
    }
}


export async function getIntroBlogs() {
    await checkIntroAdminAccess();
    try {
        const items = await getSystemDirectus().request(readItems('intro_blogs', {
            sort: ['-id'],
            limit: 200,
            fields: [...INTRO_BLOG_FIELDS]
        }));
        return (items ?? []).map(i => ({
            ...i,
            id: Number(i.id),
            title: i.title || '',
            content: i.content || '',
            blog_type: (i.blog_type || 'update') as any,
            is_published: !!i.is_published
        })) as IntroBlog[];
    } catch (e) {
        console.error('[AdminIntro] Get blogs failed:', e);
        throw new Error('Kon blogs niet ophalen');
    }
}

export async function upsertIntroBlog(blog: Partial<IntroBlog>): Promise<{ success: boolean; data?: IntroBlog; error?: string }> {
    const session = await checkIntroAdminAccess();
    const { id, ...payload } = blog;
    
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
        console.error('[AdminIntro] Upsert blog failed:', e);
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
        console.error('[AdminIntro] Delete blog failed:', e);
        return { success: false, error: 'Verwijderen mislukt' };
    }
}


export async function getIntroPlanning() {
    await checkIntroAdminAccess();
    try {
        const items = await getSystemDirectus().request(readItems('intro_planning', {
            sort: ['date', 'time_start'],
            limit: 200,
            fields: [...INTRO_PLANNING_FIELDS]
        }));
        return (items ?? []).map(i => ({
            ...i,
            id: Number(i.id),
            date: i.date || '',
            time_start: i.time_start || '',
            title: i.title || '',
            description: i.description || ''
        })) as IntroPlanningItem[];
    } catch (e) {
        console.error('[AdminIntro] Get planning failed:', e);
        throw new Error('Kon planning niet ophalen');
    }
}

export async function upsertIntroPlanning(item: Partial<IntroPlanningItem>): Promise<{ success: boolean; data?: IntroPlanningItem; error?: string }> {
    const session = await checkIntroAdminAccess();
    const { id, date, ...rest } = item;

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
        console.error('[AdminIntro] Upsert planning failed:', e);
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
        console.error('[AdminIntro] Delete planning failed:', e);
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
            console.log(`[AdminIntro] Toggle (SQL): DB was ${oldStatus}, setting to ${newStatus} (ID: ${flag.id})`);
        } else {
            await query('INSERT INTO feature_flags (name, route_match, is_active) VALUES ($1, $2, $3)', 
                ['Intro Inschrijving', route, newStatus]);
            console.log(`[AdminIntro] Toggle (SQL): Created new flag for ${route} with is_active: ${newStatus}`);
        }

        // 1. Immediate clear to disrupt any current stale requests
        try {
            const redis = await getRedis();
            await redis.del(FLAGS_CACHE_KEY);
            console.log(`[AdminIntro] Initial Redis cache clear (immediate)`);
        } catch (e) {
            console.error('[AdminIntro] Initial Redis clear failed:', e);
        }

        // 2. Wait for Directus DB/Cache consistency if other systems read via API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log(`[AdminIntro] Revalidating: feature_flags (profile: default)`);
        revalidateTag('feature_flags', 'default');
        revalidatePath('/', 'layout');
        revalidatePath('/beheer/intro');

        // 3. Final clear to ensure concurrent requests that fetched stale data are purged
        try {
            const redis = await getRedis();
            const deletedRows = await redis.del(FLAGS_CACHE_KEY);
            console.log(`[AdminIntro] Final Redis cache clear. Keys deleted: ${deletedRows}`);
        } catch (e) {
            console.error('[AdminIntro] Final Redis clear failed:', e);
        }
        
        return { success: true, show: newStatus };
    } catch (e) {
        console.error('[AdminIntro] Toggle visibility failed:', e);
        return { success: false, error: 'Bijwerken mislukt' };
    }
}


export async function sendIntroCustomNotification(
    title: string,
    body: string,
    includeParents: boolean
): Promise<{ success: boolean; sent?: number; error?: string }> {
    await checkIntroAdminAccess();
    const notificationApiUrl = process.env.NEXT_PUBLIC_NOTIFICATION_API_URL;
    if (!notificationApiUrl) return { success: false, error: 'Notification API niet geconfigureerd' };

    try {
        const res = await fetch(`${notificationApiUrl}/api/notifications/send-intro-custom`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, body, includeParents }),
        });
        if (!res.ok) return { success: false, error: 'Verzenden mislukt' };
        const json = await res.json();
        return { success: true, sent: json.sent ?? 0 };
    } catch {
        return { success: false, error: 'Verzenden mislukt' };
    }
}

