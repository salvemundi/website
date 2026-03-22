'use server';

import { auth } from '@/server/auth/auth';
import { revalidateTag, revalidatePath } from "next/cache";
import { headers } from 'next/headers';
import type { IntroBlog, IntroPlanningItem } from '@salvemundi/validations';

import { getSystemDirectus, getUserDirectus } from "@/lib/directus";
import { 
    readItems, 
    deleteItem, 
    updateItem, 
    createItem, 
    aggregate 
} from '@directus/sdk';

const ALLOWED_ROLES = ['introcommissie', 'intro', 'ictcommissie', 'ict', 'bestuur', 'kandi', 'kandidaat'];

async function checkIntroAdminAccess() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error('Niet ingelogd');
    const userRoles: string[] = (session.user as any).committees?.map((c: any) =>
        (c.committee_id?.name || c.name || '').toLowerCase().replace(/\s|\||-/g, '')
    ) ?? [];
    const hasAccess = userRoles.some(r => ALLOWED_ROLES.includes(r)) || (session.user as any).entra_id;
    if (!hasAccess) throw new Error('Geen toegang');
    return session;
}

// ── Stats ──────────────────────────────────────────────────────────────────

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

// ── Signups ────────────────────────────────────────────────────────────────

export async function getIntroSignups() {
    await checkIntroAdminAccess();
    try {
        const items = await getSystemDirectus().request(readItems('intro_signups', {
            sort: ['-date_created'],
            limit: 1000,
            fields: ['id', 'first_name', 'middle_name', 'last_name', 'email', 'phone_number', 'date_of_birth', 'favorite_gif', 'date_created']
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
        await getUserDirectus(session.session.token).request(deleteItem('intro_signups', id));
        revalidatePath('/beheer/intro');
        return { success: true };
    } catch (e) {
        console.error('[AdminIntro] Delete signup failed:', e);
        return { success: false, error: 'Verwijderen mislukt' };
    }
}

// ── Parent Signups ─────────────────────────────────────────────────────────

export async function getIntroParentSignups() {
    await checkIntroAdminAccess();
    try {
        const items = await getSystemDirectus().request(readItems('intro_parent_signups', {
            sort: ['-date_created'],
            limit: 1000,
            fields: ['id', 'first_name', 'last_name', 'email', 'phone_number', 'motivation', 'date_created']
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
        await getUserDirectus(session.session.token).request(deleteItem('intro_parent_signups', id));
        revalidatePath('/beheer/intro');
        return { success: true };
    } catch (e) {
        console.error('[AdminIntro] Delete parent signup failed:', e);
        return { success: false, error: 'Verwijderen mislukt' };
    }
}

// ── Blogs ──────────────────────────────────────────────────────────────────

export async function getIntroBlogs() {
    await checkIntroAdminAccess();
    try {
        const items = await getSystemDirectus().request(readItems('intro_blogs', {
            sort: ['-date_created'],
            limit: 200,
            fields: ['id', 'title', 'slug', 'excerpt', 'content', 'blog_type', 'image', 'is_published', 'date_created']
        }));
        return (items ?? []) as IntroBlog[];
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
        if (id) {
            result = await getUserDirectus(session.session.token).request(updateItem('intro_blogs', id, payload));
        } else {
            result = await getUserDirectus(session.session.token).request(createItem('intro_blogs', payload));
        }
        revalidatePath('/beheer/intro');
        return { success: true, data: result as IntroBlog };
    } catch (e) {
        console.error('[AdminIntro] Upsert blog failed:', e);
        return { success: false, error: 'Opslaan mislukt' };
    }
}

export async function deleteIntroBlog(id: number): Promise<{ success: boolean; error?: string }> {
    const session = await checkIntroAdminAccess();
    try {
        await getUserDirectus(session.session.token).request(deleteItem('intro_blogs', id));
        revalidatePath('/beheer/intro');
        return { success: true };
    } catch (e) {
        console.error('[AdminIntro] Delete blog failed:', e);
        return { success: false, error: 'Verwijderen mislukt' };
    }
}

// ── Planning ───────────────────────────────────────────────────────────────

export async function getIntroPlanning() {
    await checkIntroAdminAccess();
    try {
        const items = await getSystemDirectus().request(readItems('intro_planning', {
            sort: ['date', 'time_start'],
            limit: 200,
            fields: ['id', 'date', 'day', 'time_start', 'time_end', 'title', 'description', 'location']
        }));
        return (items ?? []) as IntroPlanningItem[];
    } catch (e) {
        console.error('[AdminIntro] Get planning failed:', e);
        throw new Error('Kon planning niet ophalen');
    }
}

export async function upsertIntroPlanning(item: Partial<IntroPlanningItem>): Promise<{ success: boolean; data?: IntroPlanningItem; error?: string }> {
    const session = await checkIntroAdminAccess();
    const { id, date, ...rest } = item;

    // Auto-fill day from date
    let day = rest.day;
    if (date) {
        try {
            day = new Date(date).toLocaleDateString('nl-NL', { weekday: 'long' });
        } catch { /* ignore */ }
    }

    const payload = { ...rest, date, day };
    
    try {
        let result;
        if (id) {
            result = await getUserDirectus(session.session.token).request(updateItem('intro_planning', id, payload));
        } else {
            result = await getUserDirectus(session.session.token).request(createItem('intro_planning', payload));
        }
        revalidatePath('/beheer/intro');
        return { success: true, data: result as IntroPlanningItem };
    } catch (e) {
        console.error('[AdminIntro] Upsert planning failed:', e);
        return { success: false, error: 'Opslaan mislukt' };
    }
}

export async function deleteIntroPlanning(id: number): Promise<{ success: boolean; error?: string }> {
    const session = await checkIntroAdminAccess();
    try {
        await getUserDirectus(session.session.token).request(deleteItem('intro_planning', id));
        revalidatePath('/beheer/intro');
        return { success: true };
    } catch (e) {
        console.error('[AdminIntro] Delete planning failed:', e);
        return { success: false, error: 'Verwijderen mislukt' };
    }
}

// ── Settings ───────────────────────────────────────────────────────────────

export async function toggleIntroVisibility(current: boolean): Promise<{ success: boolean; show?: boolean; error?: string }> {
    const session = await checkIntroAdminAccess();
    try {
        // Try update first
        await getUserDirectus(session.session.token).request(updateItem('site_settings', 'intro', { show: !current }));
    } catch (e) {
        // Try upsert with POST if PATCH fails (first time)
        try {
            await getUserDirectus(session.session.token).request(createItem('site_settings', { id: 'intro', show: !current }));
        } catch (postErr) {
            console.error('[AdminIntro] Toggle visibility failed:', postErr);
            return { success: false, error: 'Bijwerken mislukt' };
        }
    }
    revalidatePath('/beheer/intro');
    return { success: true, show: !current };
}

// ── Notifications ──────────────────────────────────────────────────────────

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

