'use server';

import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import type { IntroBlog, IntroPlanningItem } from '@salvemundi/validations';

const getDirectusUrl = () => process.env.INTERNAL_DIRECTUS_URL;

const getDirectusHeaders = (): HeadersInit => {
    const token = process.env.DIRECTUS_STATIC_TOKEN;
    if (!token) throw new Error('DIRECTUS_STATIC_TOKEN is missing');
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

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
    const [signupsRes, parentsRes, blogsRes, planningRes] = await Promise.all([
        fetch(`${getDirectusUrl()}/items/intro_signups?meta=total_count&limit=0`, { headers: getDirectusHeaders() }),
        fetch(`${getDirectusUrl()}/items/intro_parent_signups?meta=total_count&limit=0`, { headers: getDirectusHeaders() }),
        fetch(`${getDirectusUrl()}/items/intro_blogs?meta=total_count&limit=0`, { headers: getDirectusHeaders() }),
        fetch(`${getDirectusUrl()}/items/intro_planning?meta=total_count&limit=0`, { headers: getDirectusHeaders() }),
    ]);

    const [s, p, b, pl] = await Promise.all([signupsRes.json(), parentsRes.json(), blogsRes.json(), planningRes.json()]);

    return {
        signups: s.meta?.total_count ?? 0,
        parents: p.meta?.total_count ?? 0,
        blogs: b.meta?.total_count ?? 0,
        planning: pl.meta?.total_count ?? 0,
    };
}

// ── Signups ────────────────────────────────────────────────────────────────

export async function getIntroSignups() {
    await checkIntroAdminAccess();
    const res = await fetch(
        `${getDirectusUrl()}/items/intro_signups?sort=-date_created&limit=1000&fields=id,first_name,middle_name,last_name,email,phone_number,date_of_birth,favorite_gif,date_created`,
        { headers: getDirectusHeaders() }
    );
    if (!res.ok) throw new Error('Kon aanmeldingen niet ophalen');
    const json = await res.json();
    return (json.data ?? []) as {
        id: number;
        first_name: string;
        middle_name?: string;
        last_name: string;
        email: string;
        phone_number: string;
        date_of_birth?: string;
        favorite_gif?: string;
        date_created?: string;
    }[];
}

export async function deleteIntroSignup(id: number): Promise<{ success: boolean; error?: string }> {
    await checkIntroAdminAccess();
    const res = await fetch(`${getDirectusUrl()}/items/intro_signups/${id}`, {
        method: 'DELETE',
        headers: getDirectusHeaders(),
    });
    if (!res.ok) return { success: false, error: 'Verwijderen mislukt' };
    return { success: true };
}

// ── Parent Signups ─────────────────────────────────────────────────────────

export async function getIntroParentSignups() {
    await checkIntroAdminAccess();
    const res = await fetch(
        `${getDirectusUrl()}/items/intro_parent_signups?sort=-date_created&limit=1000&fields=id,first_name,last_name,email,phone_number,motivation,date_created`,
        { headers: getDirectusHeaders() }
    );
    if (!res.ok) throw new Error('Kon ouder-aanmeldingen niet ophalen');
    const json = await res.json();
    return (json.data ?? []) as {
        id: number;
        first_name?: string;
        last_name?: string;
        email?: string;
        phone_number?: string;
        motivation?: string;
        date_created?: string;
    }[];
}

export async function deleteIntroParentSignup(id: number): Promise<{ success: boolean; error?: string }> {
    await checkIntroAdminAccess();
    const res = await fetch(`${getDirectusUrl()}/items/intro_parent_signups/${id}`, {
        method: 'DELETE',
        headers: getDirectusHeaders(),
    });
    if (!res.ok) return { success: false, error: 'Verwijderen mislukt' };
    return { success: true };
}

// ── Blogs ──────────────────────────────────────────────────────────────────

export async function getIntroBlogs() {
    await checkIntroAdminAccess();
    const res = await fetch(
        `${getDirectusUrl()}/items/intro_blogs?sort=-date_created&limit=200&fields=id,title,slug,excerpt,content,blog_type,image,is_published,date_created`,
        { headers: getDirectusHeaders() }
    );
    if (!res.ok) throw new Error('Kon blogs niet ophalen');
    const json = await res.json();
    return (json.data ?? []) as IntroBlog[];
}

export async function upsertIntroBlog(blog: Partial<IntroBlog>): Promise<{ success: boolean; data?: IntroBlog; error?: string }> {
    await checkIntroAdminAccess();
    const { id, ...payload } = blog;
    const method = id ? 'PATCH' : 'POST';
    const url = id
        ? `${getDirectusUrl()}/items/intro_blogs/${id}`
        : `${getDirectusUrl()}/items/intro_blogs`;

    const res = await fetch(url, {
        method,
        headers: getDirectusHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        console.error('[admin-intro] upsertIntroBlog failed:', text);
        return { success: false, error: 'Opslaan mislukt' };
    }
    const json = await res.json();
    return { success: true, data: json.data };
}

export async function deleteIntroBlog(id: number): Promise<{ success: boolean; error?: string }> {
    await checkIntroAdminAccess();
    const res = await fetch(`${getDirectusUrl()}/items/intro_blogs/${id}`, {
        method: 'DELETE',
        headers: getDirectusHeaders(),
    });
    if (!res.ok) return { success: false, error: 'Verwijderen mislukt' };
    return { success: true };
}

// ── Planning ───────────────────────────────────────────────────────────────

export async function getIntroPlanning() {
    await checkIntroAdminAccess();
    const res = await fetch(
        `${getDirectusUrl()}/items/intro_planning?sort=date,time_start&limit=200&fields=id,date,day,time_start,time_end,title,description,location`,
        { headers: getDirectusHeaders() }
    );
    if (!res.ok) throw new Error('Kon planning niet ophalen');
    const json = await res.json();
    return (json.data ?? []) as IntroPlanningItem[];
}

export async function upsertIntroPlanning(item: Partial<IntroPlanningItem>): Promise<{ success: boolean; data?: IntroPlanningItem; error?: string }> {
    await checkIntroAdminAccess();
    const { id, date, ...rest } = item;

    // Auto-fill day from date
    let day = rest.day;
    if (date) {
        try {
            day = new Date(date).toLocaleDateString('nl-NL', { weekday: 'long' });
        } catch { /* ignore */ }
    }

    const payload = { ...rest, date, day };
    const method = id ? 'PATCH' : 'POST';
    const url = id
        ? `${getDirectusUrl()}/items/intro_planning/${id}`
        : `${getDirectusUrl()}/items/intro_planning`;

    const res = await fetch(url, {
        method,
        headers: getDirectusHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        return { success: false, error: 'Opslaan mislukt' };
    }
    const json = await res.json();
    return { success: true, data: json.data };
}

export async function deleteIntroPlanning(id: number): Promise<{ success: boolean; error?: string }> {
    await checkIntroAdminAccess();
    const res = await fetch(`${getDirectusUrl()}/items/intro_planning/${id}`, {
        method: 'DELETE',
        headers: getDirectusHeaders(),
    });
    if (!res.ok) return { success: false, error: 'Verwijderen mislukt' };
    return { success: true };
}

// ── Settings ───────────────────────────────────────────────────────────────

export async function toggleIntroVisibility(current: boolean): Promise<{ success: boolean; show?: boolean; error?: string }> {
    await checkIntroAdminAccess();
    const res = await fetch(`${getDirectusUrl()}/items/site_settings/intro`, {
        method: 'PATCH',
        headers: getDirectusHeaders(),
        body: JSON.stringify({ show: !current }),
    });
    if (!res.ok) {
        // Try upsert with POST if PATCH fails (first time)
        const resPost = await fetch(`${getDirectusUrl()}/items/site_settings`, {
            method: 'POST',
            headers: getDirectusHeaders(),
            body: JSON.stringify({ id: 'intro', show: !current }),
        });
        if (!resPost.ok) return { success: false, error: 'Bijwerken mislukt' };
    }
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

