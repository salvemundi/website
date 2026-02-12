'use server';

import { serverDirectusFetch } from '@/shared/lib/server-directus';
import { User, EventSignup } from '@/shared/model/types/auth';
import { cookies } from 'next/headers';
import { AUTH_COOKIES } from '@/shared/config/auth-config';
import { revalidatePath } from 'next/cache';

/**
 * Updates the current user's profile information.
 */
export async function updateCurrentUserAction(data: Partial<User>) {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get(AUTH_COOKIES.SESSION)?.value;

        if (!sessionToken) {
            throw new Error('Niet ingelogd');
        }

        // We only allow updating specific fields for security
        interface Updates {
            minecraft_username?: string;
            date_of_birth?: string;
            phone_number?: string;
            avatar?: string | null;
            [key: string]: any;
        }

        const allowedUpdates: Updates = {};
        if (data.minecraft_username !== undefined) allowedUpdates.minecraft_username = data.minecraft_username;
        if (data.date_of_birth !== undefined) allowedUpdates.date_of_birth = data.date_of_birth;
        if (data.phone_number !== undefined) allowedUpdates.phone_number = data.phone_number;
        if (data.avatar !== undefined) allowedUpdates.avatar = data.avatar;

        if (Object.keys(allowedUpdates).length === 0) {
            return { success: true };
        }

        const response = await serverDirectusFetch<any>('/users/me', {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${sessionToken}`,
            },
            body: JSON.stringify(allowedUpdates),
            revalidate: 0
        });

        if (!response) {
            throw new Error('Update mislukt');
        }

        revalidatePath('/account');
        return { success: true, data: response };
    } catch (error: any) {
        console.error('[account-actions] Update Error:', error);
        return { success: false, error: error.message || 'Kon gegevens niet bijwerken' };
    }
}

/**
 * Fetches event signups for the current user.
 */
export async function getUserEventSignupsAction(): Promise<EventSignup[]> {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get(AUTH_COOKIES.SESSION)?.value;

        if (!sessionToken) return [];

        // First get our user ID
        const me = await serverDirectusFetch<any>('/users/me?fields=id', {
            headers: { 'Authorization': `Bearer ${sessionToken}` },
            revalidate: 0
        });

        if (!me?.id) return [];

        const query = new URLSearchParams({
            'filter[directus_relations][_eq]': me.id,
            'fields': 'id,event_id.id,event_id.name,event_id.event_date,event_id.image,event_id.description,event_id.contact,event_id.committee_id,created_at',
            'sort': '-created_at',
        }).toString();

        const signups = await serverDirectusFetch<any[]>(`/items/event_signups?${query}`, {
            headers: { 'Authorization': `Bearer ${sessionToken}` },
            revalidate: 0
        });

        if (!signups || !Array.isArray(signups)) return [];

        // Enrichment logic: Fetch committee leader contact if no direct contact is provided
        const enrichedSignups = await Promise.all(
            signups.map(async (signup: any) => {
                const s = { ...signup };
                if (s.event_id && !s.event_id.contact && s.event_id.committee_id) {
                    try {
                        const leaderQuery = new URLSearchParams({
                            'filter[committee_id][_eq]': s.event_id.committee_id.toString(),
                            'filter[is_leader][_eq]': 'true',
                            'fields': 'user_id.first_name,user_id.last_name',
                            'limit': '1'
                        }).toString();

                        const leaders = await serverDirectusFetch<any[]>(`/items/committee_members?${leaderQuery}`, {
                            headers: { 'Authorization': `Bearer ${sessionToken}` }
                        });
                        if (leaders && leaders.length > 0) {
                            s.event_id.contact_name = `${leaders[0].user_id.first_name || ''} ${leaders[0].user_id.last_name || ''}`.trim();
                        }
                    } catch (e) {
                        // Silently skip enrichment on error
                    }
                }
                return s;
            })
        );

        // Map to typed EventSignup[] for callers
        const mapped: EventSignup[] = enrichedSignups.map((s) => ({
            id: Number(s.id),
            created_at: String(s.created_at || ''),
            event_id: {
                id: Number(s.event_id?.id ?? s.event_id ?? 0),
                name: String(s.event_id?.name || ''),
                event_date: String(s.event_id?.event_date || ''),
                description: String(s.event_id?.description || ''),
                image: s.event_id?.image ? String(s.event_id.image) : undefined,
                contact_phone: s.event_id?.contact ? String(s.event_id.contact) : undefined,
                contact_name: s.event_id?.contact_name ? String(s.event_id.contact_name) : undefined,
            }
        }));

        return mapped;
    } catch (error) {
        console.error('[account-actions] Fetch Signups Error:', error);
        return [];
    }
}

