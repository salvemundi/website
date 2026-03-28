'use server';

import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { revalidateTag, revalidatePath } from "next/cache";
import { getSystemDirectus } from "@/lib/directus";
import { readItems, updateItem, updateUser, readUsers, readUser } from "@directus/sdk";
import { isSuperAdmin } from "@/lib/auth-utils";
import { logAdminAction } from "./audit.actions";
import { USER_FULL_FIELDS, COMMITTEE_FIELDS, USER_ID_FIELDS } from "@salvemundi/validations";

const AZURE_MGMT_URL = process.env.AZURE_MANAGEMENT_SERVICE_URL;
const AZURE_SYNC_URL = process.env.AZURE_SYNC_SERVICE_URL;
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

async function checkAdminAccess() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session || !session.user) return null;
    
    const user = session.user as any;
    if (!isSuperAdmin(user.committees)) return null;
    return session;
}

/**
 * Manages committee membership in Azure AD and syncs it back to Directus.
 */
export async function manageAzureMembershipAction(userId: string, azureGroupId: string, action: 'add' | 'remove', directusUserId: string) {
    const admin = await checkAdminAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    if (!azureGroupId) return { success: false, error: "Dit comité is niet gekoppeld aan Azure." };

    try {
        const mgmtEndpoint = action === 'add' 
            ? `${AZURE_MGMT_URL}/api/groups/${encodeURIComponent(azureGroupId)}/members`
            : `${AZURE_MGMT_URL}/api/groups/${encodeURIComponent(azureGroupId)}/members/${encodeURIComponent(userId)}`;
        
        const mgmtRes = await fetch(mgmtEndpoint, {
            method: action === 'add' ? 'POST' : 'DELETE',
            headers: {
                'Authorization': `Bearer ${INTERNAL_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: action === 'add' ? JSON.stringify({ userId }) : undefined
        });

        if (!mgmtRes.ok) {
            const errorData = await mgmtRes.json().catch(() => ({ error: 'Onbekende fout' }));
            console.error('[LedenAction] Azure Management Error:', errorData);
            return { success: false, error: "Fout bij communicatie met de Azure Management service." };
        }

        // 2. Trigger Targeted Sync for the specific user
        const syncRes = await fetch(`${AZURE_SYNC_URL}/api/sync/run/${encodeURIComponent(directusUserId)}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${INTERNAL_TOKEN}`
            }
        });

        if (!syncRes.ok) {
            console.warn(`[LedenAction] Azure Sync voor ${directusUserId} is gefaald of traag, maar Azure is bijgewerkt.`);
        }

    // Revalidate
    revalidatePath(`/beheer/leden/${directusUserId}`);
    revalidateTag(`user_${directusUserId}`, 'default');
    revalidateTag(`user_committees_${directusUserId}`, 'default');

        return { success: true };
    } catch (err: any) {
        console.error("[LedenAction] Error:", err);
        return { success: false, error: "Er is een fout opgetreden bij het bijwerken in Azure." };
    }
}

export async function sendMembershipReminderAction(daysBeforeExpiry: number = 30) {
    const user = await checkAdminAccess();
    if (!user) return { success: false, error: "Unauthorized" };

    const siteUrl = process.env.PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL || '';

    try {
        const res = await fetch(`${siteUrl}/api/notifications/send-membership-reminder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ daysBeforeExpiry })
        });

        if (!res.ok) {
           return { success: false, error: "Service onbeschikbaar." };
        }
        
        const data = await res.json();
        return { success: true, count: data.sent || 0 };
    } catch {
        return { success: false, error: "Interne serverfout bij het versturen van herinneringen." };
    }
}

/**
 * Update a member's profile data (name, phone, date of birth).
 */
export async function updateMemberProfileAction(
    directusUserId: string,
    data: {
        first_name?: string;
        last_name?: string;
        phone_number?: string;
        date_of_birth?: string;
    }
) {
    const admin = await checkAdminAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    const payload: Record<string, string> = {};
    if (data.first_name !== undefined && data.first_name.trim()) payload.first_name = data.first_name.trim();
    if (data.last_name !== undefined && data.last_name.trim()) payload.last_name = data.last_name.trim();
    if (data.phone_number !== undefined) payload.phone_number = data.phone_number.trim();
    if (data.date_of_birth !== undefined && data.date_of_birth) payload.date_of_birth = data.date_of_birth;

    if (Object.keys(payload).length === 0) {
        return { success: false, error: "Geen wijzigingen opgegeven" };
    }

    try {
        await getSystemDirectus().request(updateUser(directusUserId, payload));

        const user: any = await getSystemDirectus().request(readUser(directusUserId, {
            fields: [...USER_ID_FIELDS]
        }));

        if (user?.entra_id && AZURE_MGMT_URL && INTERNAL_TOKEN) {
            await fetch(`${AZURE_MGMT_URL}/api/users/${encodeURIComponent(user.entra_id)}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${INTERNAL_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    displayName: payload.first_name || payload.last_name ? `${payload.first_name || ''} ${payload.last_name || ''}`.trim() : undefined,
                    phoneNumber: payload.phone_number,
                    dateOfBirth: payload.date_of_birth
                })
            }).catch(e => console.error('[updateMemberProfile] Azure sync failed:', e));
        }

        revalidatePath(`/beheer/leden/${directusUserId}`);
        
        // Log the change
        await logAdminAction('member_profile_updated', 'SUCCESS', { 
            member_id: directusUserId,
            updates: payload 
        });

        return { success: true };
    } catch (err) {
        console.error('[updateMemberProfile] Error:', err);
        return { success: false, error: 'Opslaan mislukt' };
    }
}

/**
 * Manually extend a member's membership and update Azure AD group.
 */
export async function renewMembershipAction(
    directusUserId: string,
    months: number = 12
): Promise<{ success: boolean; newExpiry?: string; error?: string }> {
    const admin = await checkAdminAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const users: any = await getSystemDirectus().request(readUsers({
            fields: [...USER_FULL_FIELDS] as any,
            filter: { id: { _eq: directusUserId } } as any,
            limit: 1
        }));
        const user = users?.[0];
        if (!user) return { success: false, error: 'Kon lid niet ophalen' };
        
        const today = new Date();
        const currentExpiry = user.membership_expiry ? new Date(user.membership_expiry) : null;
        const baseDate = currentExpiry && currentExpiry > today ? currentExpiry : today;

        const newExpiry = new Date(baseDate);
        newExpiry.setMonth(newExpiry.getMonth() + months);
        const newExpiryStr = newExpiry.toISOString().substring(0, 10);

        await getSystemDirectus().request(updateUser(directusUserId, { membership_expiry: newExpiryStr } as any));

        if (user.entra_id && AZURE_MGMT_URL && INTERNAL_TOKEN) {
            const committees: any = await getSystemDirectus().request(readItems('committees', {
                filter: { name: { _eq: 'Leden_Actief_Lidmaatschap' } },
                fields: [...COMMITTEE_FIELDS],
                limit: 1
            }));
            const activeGroupId = committees?.[0]?.azure_group_id;

            if (activeGroupId) {
                await fetch(`${AZURE_MGMT_URL}/api/groups/${encodeURIComponent(activeGroupId)}/members`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${INTERNAL_TOKEN}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.entra_id })
                }).catch(e => console.warn('[renewMembership] Azure group update failed:', e));
            }
        }

        if (AZURE_SYNC_URL && INTERNAL_TOKEN) {
            fetch(`${AZURE_SYNC_URL}/api/sync/run/${encodeURIComponent(directusUserId)}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${INTERNAL_TOKEN}` },
            }).catch(e => console.warn('[renewMembership] Sync trigger failed:', e));
        }

        revalidatePath(`/beheer/leden/${directusUserId}`);
        revalidatePath('/beheer/leden');

        // Log the renewal
        await logAdminAction('membership_renewed', 'SUCCESS', { 
            member_id: directusUserId,
            months_added: months,
            new_expiry: newExpiryStr 
        });

        return { success: true, newExpiry: newExpiryStr };
    } catch (err) {
        console.error('[renewMembership] Error:', err);
        return { success: false, error: 'Er is een fout opgetreden' };
    }
}

/**
 * Provisions a member in Azure AD if they don't have an account yet.
 */
export async function provisionAzureAccountAction(directusUserId: string) {
    const admin = await checkAdminAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const user: any = await getSystemDirectus().request(readUser(directusUserId, {
            fields: [...USER_FULL_FIELDS]
        }));

        if (!user || !user.email) return { success: false, error: "Lid niet gevonden of geen e-mailadres." };

        const res = await fetch(`${AZURE_MGMT_URL}/api/provisioning/user`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${INTERNAL_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                phoneNumber: user.phone_number,
                dateOfBirth: user.date_of_birth
            })
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({ error: 'Onbekende fout' }));
            return { success: false, error: errData.error || "Azure provisioning mislukt." };
        }

        revalidatePath(`/beheer/leden/${directusUserId}`);

        // Log the provisioning
        await logAdminAction('azure_provisioning', 'SUCCESS', { 
            member_id: directusUserId,
            email: user.email 
        });

        return { success: true };
    } catch (err: any) {
        console.error("[ProvisionAction] Error:", err);
        return { success: false, error: "Interne fout bij provisioning." };
    }
}



