import 'server-only';

import { serverDirectusFetch, CACHE_PRESETS, COLLECTION_TAGS } from '@/shared/lib/server-directus';
import { Sponsor } from '@/shared/model/types/sponsor';
import { Event, HeroBanner, Committee } from '@/shared/model/types/directus';

/**
 * Fetch sponsors - Cached statically with revalidation tag
 */
export async function getSponsors() {
    try {
        const data = await serverDirectusFetch<Sponsor[]>('/items/sponsors', {
            ...CACHE_PRESETS.STATIC,
            tags: [COLLECTION_TAGS.SPONSORS]
        });
        return data || [];
    } catch (error) {
        console.error('[salvemundi-server] Failed to fetch sponsors:', error);
        return [];
    }
}

/**
 * Fetch upcoming events
 */
export async function getEvents() {
    try {
        const now = new Date().toISOString();
        const query = new URLSearchParams({
            sort: 'event_date',
            filter: JSON.stringify({
                _or: [
                    { status: { _eq: 'published' }, publish_date: { _null: true } },
                    { status: { _eq: 'published' }, publish_date: { _lte: now } }
                ]
            })
        }).toString();
        const data = await serverDirectusFetch<Event[]>(`/items/events?${query}`, {
            ...CACHE_PRESETS.DYNAMIC,
            tags: [COLLECTION_TAGS.EVENTS]
        });
        return data || [];
    } catch (error) {
        console.error('[salvemundi-server] Failed to fetch events:', error);
        return [];
    }
}

/**
 * Fetch hero banners
 */
export async function getHeroBanners() {
    try {
        const query = new URLSearchParams({
            sort: 'sort'
        }).toString();
        const data = await serverDirectusFetch<HeroBanner[]>(`/items/hero_banners?${query}`, {
            ...CACHE_PRESETS.STATIC,
            tags: ['hero_banners']
        });
        return data || [];
    } catch (error) {
        console.error('[salvemundi-server] Failed to fetch hero banners:', error);
        return [];
    }
}

/**
 * Fetch committees with members
 */
export async function getCommitteesWithMembers() {
    try {
        const query = new URLSearchParams({
            fields: 'id,name,email,image.id,is_visible,short_description,created_at,updated_at',
            sort: 'name'
        }).toString();
        const committees = await serverDirectusFetch<Committee[]>(`/items/committees?${query}`, {
            ...CACHE_PRESETS.STATIC,
            tags: [COLLECTION_TAGS.COMMITTEES]
        });

        const visibleCommittees = (committees || []).filter(c => c.is_visible !== false);

        const committeesWithMembers = await Promise.all(
            visibleCommittees.map(async (committee) => {
                try {
                    const query = new URLSearchParams({
                        filter: JSON.stringify({ committee_id: { _eq: committee.id } }),
                        fields: '*,user_id.first_name,user_id.last_name,user_id.avatar'
                    }).toString();
                    const members = await serverDirectusFetch<any[]>(`/items/committee_members?${query}`, {
                        ...CACHE_PRESETS.STATIC
                    });
                    return { ...committee, committee_members: members || [] };
                } catch (e) {
                    console.error(`[salvemundi-server] Failed to fetch members for committee ${committee.id}:`, e);
                    return { ...committee, committee_members: [] };
                }
            })
        );
        return committeesWithMembers;
    } catch (error) {
        console.error('[salvemundi-server] Failed to fetch committees with members:', error);
        return [];
    }
}

/**
 * Fetch a single committee by ID with its members
 */
export async function getCommittee(id: number) {
    try {
        const committee = await serverDirectusFetch<any>(`/items/committees/${id}`, {
            ...CACHE_PRESETS.STATIC,
            tags: [COLLECTION_TAGS.COMMITTEES, `committees_${id}`],
            headers: {
                'x-directus-query': JSON.stringify({
                    fields: ['id', 'name', 'email', 'image.id', 'is_visible', 'short_description', 'description', 'created_at', 'updated_at']
                })
            }
        });

        if (!committee) return null;

        const query = new URLSearchParams({
            filter: JSON.stringify({ committee_id: { _eq: id } }),
            fields: '*,user_id.first_name,user_id.last_name,user_id.avatar'
        }).toString();

        const members = await serverDirectusFetch<any[]>(`/items/committee_members?${query}`, {
            ...CACHE_PRESETS.STATIC,
            tags: [COLLECTION_TAGS.COMMITTEES, `committee_members_${id}`]
        });

        return { ...committee, committee_members: members || [] };
    } catch (error) {
        console.error(`[salvemundi-server] Failed to fetch committee ${id}:`, error);
        return null;
    }
}

/**
 * Fetch events for a specific committee
 */
export async function getEventsByCommittee(committeeId: number) {
    try {
        const now = new Date().toISOString();
        const query = new URLSearchParams({
            sort: 'event_date',
            filter: JSON.stringify({
                _and: [
                    { committee_id: { _eq: committeeId } },
                    {
                        _or: [
                            { status: { _eq: 'published' }, publish_date: { _null: true } },
                            { status: { _eq: 'published' }, publish_date: { _lte: now } }
                        ]
                    }
                ]
            })
        }).toString();

        const data = await serverDirectusFetch<Event[]>(`/items/events?${query}`, {
            ...CACHE_PRESETS.DYNAMIC,
            tags: [COLLECTION_TAGS.EVENTS, `committee_events_${committeeId}`]
        });
        return data || [];
    } catch (error) {
        console.error(`[salvemundi-server] Failed to fetch events for committee ${committeeId}:`, error);
        return [];
    }
}
/**
 * Fetch a site setting by page identifier
 */
export async function getSiteSettings(page: string) {
    try {
        const query = new URLSearchParams({
            filter: JSON.stringify({ page: { _eq: page } }),
            limit: '1'
        }).toString();

        const data = await serverDirectusFetch<any[]>(`/items/site_settings?${query}`, {
            ...CACHE_PRESETS.STATIC,
            tags: [COLLECTION_TAGS.SITE_SETTINGS, `site_settings_${page}`]
        });

        return (data && data.length > 0) ? data[0] : null;
    } catch (error) {
        console.error(`[salvemundi-server] Failed to fetch site settings for ${page}:`, error);
        return null;
    }
}

/**
 * Fetch multiple site settings in one go
 */
export async function getCombinedSiteSettings(pages: string[]) {
    try {
        const query = new URLSearchParams({
            filter: JSON.stringify({ page: { _in: pages } })
        }).toString();

        const data = await serverDirectusFetch<any[]>(`/items/site_settings?${query}`, {
            ...CACHE_PRESETS.STATIC,
            tags: [COLLECTION_TAGS.SITE_SETTINGS]
        });

        // Map back to an object keyed by page name
        const result: Record<string, any> = {};
        pages.forEach(p => result[p] = null);

        if (Array.isArray(data)) {
            data.forEach(setting => {
                if (setting.page) {
                    result[setting.page] = setting;
                }
            });
        }

        return result;
    } catch (error) {
        console.error('[salvemundi-server] Failed to fetch combined site settings:', error);
        return {};
    }
}
