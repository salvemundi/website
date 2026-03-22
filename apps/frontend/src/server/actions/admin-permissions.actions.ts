'use server';

import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { revalidateTag } from 'next/cache';

import { getSystemDirectus, getUserDirectus } from "@/lib/directus";
import { readItems, updateItem, createItem } from '@directus/sdk';

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
    
    try {
        const items = await getSystemDirectus().request(readItems('site_settings', {
            limit: 100
        }));
        
        const settings: Record<string, string[]> = {};
        (items ?? []).forEach((item: any) => {
            if (item.authorized_tokens) {
                const tokens = typeof item.authorized_tokens === 'string' 
                    ? item.authorized_tokens.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean)
                    : Array.isArray(item.authorized_tokens) ? item.authorized_tokens : [];
                settings[item.id] = Array.from(new Set(tokens));
            }
        });

        return settings;
    } catch (e) {
        console.error('[AdminPermissions] Fetch failed:', e);
        throw new Error('Kon site settings niet ophalen');
    }
}

export async function savePermission(key: string, tokens: string[]) {
    const admin = await requireSuperAdmin();
    const cleanTokens = tokens.map(t => t.trim().toLowerCase()).filter(Boolean);
    const payload = { 
        id: key, 
        authorized_tokens: cleanTokens.join(',') 
    };

    try {
        // Try update first
        await getUserDirectus(admin.session.token).request(updateItem('site_settings', key, payload));
    } catch (e) {
        // If update fails, try create
        try {
            await getUserDirectus(admin.session.token).request(createItem('site_settings', payload));
        } catch (postErr) {
            console.error('[AdminPermissions] Save failed:', postErr);
            throw new Error(`Opslaan mislukt`);
        }
    }

    revalidateTag('site_settings', 'default');
    return { success: true };
}

export async function getAllCommittees() {
    await requireSuperAdmin();
    
    try {
        const items = await getSystemDirectus().request(readItems('committees', {
            sort: ['name'],
            fields: ['id', 'name', 'is_visible']
        }));
        
        return (items ?? []).map((c: any) => ({
            id: c.id,
            name: c.name.replace(/\|\|\s*Salve Mundi/gi, '').replace(/\|\s*Salve Mundi/gi, '').trim(),
            token: c.name.toLowerCase().replace(/[^a-z0-9]/g, '').trim(),
            is_visible: !!c.is_visible
        }));
    } catch (e) {
        console.error('[AdminPermissions] Fetch committees failed:', e);
        throw new Error('Kon commissies niet ophalen');
    }
}

