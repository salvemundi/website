'use server';

import { serverDirectusFetch, CACHE_PRESETS, COLLECTION_TAGS } from '@/shared/lib/server-directus';

export type WhatsAppGroup = {
    id: number;
    name: string;
    description?: string;
    invite_link: string;
    is_active: boolean;
    requires_membership: boolean;
    created_at: string;
};

/**
 * Server Action to fetch WhatsApp groups.
 * This directly calls the Directus API using the service token on the server.
 */
export async function getWhatsAppGroupsAction(memberOnly: boolean = false) {
    try {
        const filter = memberOnly
            ? { is_active: { _eq: true }, requires_membership: { _eq: true } }
            : { is_active: { _eq: true } };

        const queryString = new URLSearchParams({
            filter: JSON.stringify(filter),
            sort: 'name',
            fields: 'id,name,description,invite_link,is_active,requires_membership,created_at'
        }).toString();

        const groups = await serverDirectusFetch<WhatsAppGroup[]>(
            `/items/whatsapp_groups?${queryString}`,
            {
                ...CACHE_PRESETS.MODERATE,
                tags: [COLLECTION_TAGS.WHATSAPP_GROUPS]
            }
        );
        return groups || [];
    } catch (error: any) {
        console.error('[WhatsAppAction] Failed to fetch groups:', error.message);
        return [];
    }
}
