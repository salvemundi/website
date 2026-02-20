'use server';

import { mutateDirectus, serverDirectusFetch } from '@/shared/lib/server-directus';
import { User, EventSignup } from '@/shared/model/types/auth';
import { z } from 'zod';
import { isValidPhoneNumber, formatPhoneNumber } from '@/shared/lib/phone';
import { getCurrentUserAction } from '@/shared/api/auth-actions';
import { updateUserPhoneInEntra, updateUserDobInEntra } from '@/shared/lib/ms-graph';
import { getServerSessionToken } from '@/shared/lib/auth-server';

/**
 * Updates the given user's profile information using an elevated Admin Token.
 * Enforces strict authorization by checking that the acting user matches the target.
 */
export async function updateCurrentUserAction(data: Partial<User>) {
    try {
        const currentUser = await getCurrentUserAction();

        if (!currentUser?.id) {
            throw new Error('Niet ingelogd of ongeldige sessie');
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

        // Elevate Privileges: Call Directus with the STATIC_TOKEN (Admin Token)
        // This bypasses user role limits while our manual check ensures safety.
        const response = await mutateDirectus<any>(
            `/users/${currentUser.id}`,
            'PATCH',
            allowedUpdates
        );

        if (!response) {
            throw new Error('Update mislukt');
        }

        const { revalidatePath } = await import('next/cache');
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
        const sessionToken = await getServerSessionToken();

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

// Validation schemas for profile edits
const phoneSchema = z.string().refine(isValidPhoneNumber, "Vul een geldig telefoonnummer in (bijv. +31 6 12345678)");
const dobSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Vul een geldige datum in (YYYY-MM-DD)");
const minecraftSchema = z.string().max(16, "Minecraft gebruikersnaam mag maximaal 16 tekens zijn").optional().or(z.literal(''));

/**
 * Server action to update the user's phone number using standard HTML form submission.
 */
export async function updatePhoneAction(_prevState: any, formData: FormData) {
    const rawValue = formData.get('phone_number') as string;
    if (!rawValue) return { success: false, error: 'Telefoonnummer is vereist' };

    const validation = phoneSchema.safeParse(rawValue);
    if (!validation.success) {
        return { success: false, error: validation.error.issues[0]?.message || 'Ongeldig telefoonnummer' };
    }

    // Format to standard international format before saving
    const formatted = formatPhoneNumber(validation.data);

    // Identity check: get the explicitly resolved active user (impersonated or real)
    const currentUser = await getCurrentUserAction();
    if (!currentUser?.id) {
        return { success: false, error: 'Niet geautoriseerd' };
    }

    // Sync to MS Entra ID first (Source of Truth) using the resolved user's context
    if (currentUser.entra_id) {
        try {
            await updateUserPhoneInEntra(currentUser.entra_id, formatted);
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    // Sync to Directus via the Privileged Server-Side Function
    // Passes ONLY the single explicitly allowed field.
    const result = await updateCurrentUserAction({ phone_number: formatted });
    if (!result.success) return { success: false, error: result.error };

    return { success: true, data: result.data };
}

/**
 * Server action to update the user's date of birth using standard HTML form submission.
 */
export async function updateDateOfBirthAction(_prevState: any, formData: FormData) {
    const rawValue = formData.get('date_of_birth') as string;
    if (!rawValue) return { success: false, error: 'Geboortedatum is vereist' };

    const validation = dobSchema.safeParse(rawValue);
    if (!validation.success) {
        return { success: false, error: validation.error.issues[0]?.message || 'Ongeldige datum' };
    }

    // Identity check: get the explicitly resolved active user (impersonated or real)
    const currentUser = await getCurrentUserAction();
    if (!currentUser?.id) {
        return { success: false, error: 'Niet geautoriseerd' };
    }

    // Sync to MS Entra ID first (Source of Truth) using the resolved user's context
    if (currentUser.entra_id) {
        try {
            await updateUserDobInEntra(currentUser.entra_id, validation.data);
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    // Sync to Directus via the Privileged Server-Side Function
    // Passes ONLY the single explicitly allowed field.
    const result = await updateCurrentUserAction({ date_of_birth: validation.data });
    if (!result.success) return { success: false, error: result.error };

    return { success: true, data: result.data };
}

/**
 * Server action to update the user's Minecraft username using standard HTML form submission.
 */
export async function updateMinecraftAction(_prevState: any, formData: FormData) {
    const rawValue = formData.get('minecraft_username') as string | null;
    const value = rawValue?.trim() || '';

    const validation = minecraftSchema.safeParse(value);
    if (!validation.success) {
        return { success: false, error: validation.error.issues[0]?.message || 'Ongeldige gebruikersnaam' };
    }

    // Identity check: get the explicitly resolved active user (impersonated or real)
    const currentUser = await getCurrentUserAction();
    if (!currentUser?.id) {
        return { success: false, error: 'Niet geautoriseerd' };
    }

    // Sync to Directus via the Privileged Server-Side Function
    // Passes ONLY the single explicitly allowed field.
    const result = await updateCurrentUserAction({ minecraft_username: validation.data });
    if (!result.success) return { success: false, error: result.error };

    return { success: true, data: result.data };
}

