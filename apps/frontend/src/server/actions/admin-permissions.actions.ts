'use server';

import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { revalidateTag } from 'next/cache';

const getDirectusUrl = () => process.env.INTERNAL_DIRECTUS_URL || 'http://v7-core-directus:8055';

const getDirectusHeaders = (): HeadersInit => {
    const token = process.env.DIRECTUS_STATIC_TOKEN;
    if (!token) throw new Error('DIRECTUS_STATIC_TOKEN is missing');
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

/**
 * Require ICT or Bestuur for permissions management
 */
async function requireSuperAdmin() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error('Niet ingelogd');

    const userRoles: string[] = (session.user as any).committees?.map((c: any) =>
        (c.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    ) ?? [];

    const isSuperAdmin = userRoles.some(r => ['ictcommissie', 'ict', 'bestuur'].includes(r));
    if (!isSuperAdmin) throw new Error('Geen toegang tot permissiebeheer');

    return session;
}

export async function getPermissions() {
    await requireSuperAdmin();
    const res = await fetch(`${getDirectusUrl()}/items/site_settings?limit=100`, { 
        headers: getDirectusHeaders(),
        next: { tags: ['site_settings'] }
    });
    
    if (!res.ok) throw new Error('Kon site settings niet ophalen');
    const json = await res.json();
    
    const settings: Record<string, string[]> = {};
    (json.data ?? []).forEach((item: any) => {
        if (item.authorized_tokens) {
            const tokens = typeof item.authorized_tokens === 'string' 
                ? item.authorized_tokens.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean)
                : Array.isArray(item.authorized_tokens) ? item.authorized_tokens : [];
            settings[item.id] = Array.from(new Set(tokens));
        }
    });

    return settings;
}

export async function savePermission(key: string, tokens: string[]) {
    await requireSuperAdmin();
    const cleanTokens = tokens.map(t => t.trim().toLowerCase()).filter(Boolean);
    const payload = { 
        id: key, 
        authorized_tokens: cleanTokens.join(',') 
    };

    // Try PATCH first, if it fails (not found), try POST
    const patchRes = await fetch(`${getDirectusUrl()}/items/site_settings/${key}`, {
        method: 'PATCH',
        headers: getDirectusHeaders(),
        body: JSON.stringify(payload),
    });

    if (!patchRes.ok) {
        const postRes = await fetch(`${getDirectusUrl()}/items/site_settings`, {
            method: 'POST',
            headers: getDirectusHeaders(),
            body: JSON.stringify(payload),
        });
        if (!postRes.ok) throw new Error(`Opslaan mislukt: ${postRes.status}`);
    }

    revalidateTag('site_settings', 'default');
    return { success: true };
}

export async function getAllCommittees() {
    await requireSuperAdmin();
    const res = await fetch(`${getDirectusUrl()}/items/committees?sort=name&fields=id,name,is_visible`, { 
        headers: getDirectusHeaders() 
    });
    
    if (!res.ok) throw new Error('Kon commissies niet ophalen');
    const json = await res.json();
    
    // Normalize names to tokens (slugs)
    return (json.data ?? []).map((c: any) => ({
        id: c.id,
        name: c.name.replace(/\|\|\s*Salve Mundi/gi, '').replace(/\|\s*Salve Mundi/gi, '').trim(),
        token: c.name.toLowerCase().replace(/[^a-z0-9]/g, '').trim(),
        is_visible: !!c.is_visible
    }));
}
