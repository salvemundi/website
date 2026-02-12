'use server';

import { serverDirectusFetch, CACHE_PRESETS, COLLECTION_TAGS } from '@/shared/lib/server-directus';

export interface FooterCommittee {
    id: number;
    name: string;
    is_visible?: boolean;
}

export interface FooterSetting {
    page: string;
    show: boolean;
}

export async function getFooterCommittees() {
    try {
        // Fetch minimal fields for footer
        const query = new URLSearchParams({
            fields: 'id,name,is_visible',
            limit: '-1', // Fetch all
            sort: 'name'
        }).toString();

        const committees = await serverDirectusFetch<FooterCommittee[]>(`/items/committees?${query}`, {
            tags: ['committees'],
            ...CACHE_PRESETS.STATIC // Footer doesn't change often
        });

        return (committees || []).filter(c => c.is_visible !== false);
    } catch (error) {
        console.error('[Action] Failed to fetch footer committees:', error);
        return [];
    }
}

export async function getFooterSettings() {
    try {
        const query = new URLSearchParams({
            fields: 'page,show',
            limit: '-1'
        }).toString();

        return await serverDirectusFetch<FooterSetting[]>(`/items/site_settings?${query}`, {
            tags: [COLLECTION_TAGS.SITE_SETTINGS],
            ...CACHE_PRESETS.STATIC
        });
    } catch (error) {
        console.error('[Action] Failed to fetch footer settings:', error);
        return [];
    }
}
