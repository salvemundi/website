'use server';

import { serverDirectusFetch, CACHE_PRESETS, COLLECTION_TAGS } from '@/shared/lib/server-directus';

export type Committee = {
    id: number;
    name: string;
    is_visible?: boolean;
};

export type SiteSetting = {
    page: string;
    show: boolean;
};

export async function getFooterCommittees() {
    try {
        const committees = await serverDirectusFetch<Committee[]>(
            '/items/committees?fields=id,name,is_visible&sort=name',
            {
                ...CACHE_PRESETS.MODERATE,
                tags: [COLLECTION_TAGS.COMMITTEES]
            }
        );
        return (committees || []).filter(c => c.is_visible !== false);
    } catch (error) {
        console.error('[FooterAction] Failed to fetch committees:', error);
        return [];
    }
}

export async function getFooterSettings() {
    try {
        const settings = await serverDirectusFetch<SiteSetting[]>(
            '/items/site_settings?fields=page,show',
            {
                ...CACHE_PRESETS.STATIC,
                tags: [COLLECTION_TAGS.SITE_SETTINGS]
            }
        );
        return settings || [];
    } catch (error) {
        console.error('[FooterAction] Failed to fetch site settings:', error);
        return [];
    }
}
