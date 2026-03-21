'use server';

import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { revalidateTag, revalidatePath } from "next/cache";
import { directus, directusRequest } from "@/lib/directus";
import { readItems, updateItem, updateUser, readUsers, readUser } from "@directus/sdk";
import { isSuperAdmin } from "@/lib/auth-utils";

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
    return user;
}

/**
 * Manages committee membership in Azure AD and syncs it back to Directus.
 */
export async function manageAzureMembershipAction(userId: string, azureGroupId: string, action: 'add' | 'remove', directusUserId: string) {
    const admin = await checkAdminAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    if (!azureGroupId) return { success: false, error: "Dit comité is niet gekoppeld aan Azure." };

    try {
        // 1. Call Azure Management Service
        const mgmtEndpoint = action === 'add' 
            ? `${AZURE_MGMT_URL}/api/groups/${azureGroupId}/members`
            : `${AZURE_MGMT_URL}/api/groups/${azureGroupId}/members/${userId}`;
        
        const mgmtRes = await fetch(mgmtEndpoint, {
            method: action === 'add' ? 'POST' : 'DELETE',
            headers: {
                'Authorization': `Bearer ${INTERNAL_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: action === 'add' ? JSON.stringify({ userId }) : undefined
        });

        if (!mgmtRes.ok) {
            const errorData = await mgmtRes.json().catch(() => ({ error: 'Onbekende fout in management service' }));
            return { success: false, error: errorData.error || `Azure Management gefaald (${mgmtRes.status})` };
        }

        // 2. Trigger Targeted Sync for the specific user
        const syncRes = await fetch(`${AZURE_SYNC_URL}/api/sync/run/${directusUserId}`, {
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

/**
 * Legacy support / Membership reminders
 */
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

    // Strip empty strings to avoid overwriting with blank
    const payload: Record<string, string> = {};
    if (data.first_name !== undefined && data.first_name.trim()) payload.first_name = data.first_name.trim();
    if (data.last_name !== undefined && data.last_name.trim()) payload.last_name = data.last_name.trim();
    if (data.phone_number !== undefined) payload.phone_number = data.phone_number.trim();
    if (data.date_of_birth !== undefined && data.date_of_birth) payload.date_of_birth = data.date_of_birth;

    if (Object.keys(payload).length === 0) {
        return { success: false, error: "Geen wijzigingen opgegeven" };
    }

    try {
        await directus.request(updateUser(directusUserId, payload));

        revalidatePath(`/beheer/leden/${directusUserId}`);
        return { success: true };
    } catch (err) {
        console.error('[updateMemberProfile] Error:', err);
        return { success: false, error: 'Opslaan mislukt' };
    }
}

/**
 * Manually extend a member's membership by a given number of months.
 */
export async function renewMembershipAction(
    directusUserId: string,
    months: number = 12
): Promise<{ success: boolean; newExpiry?: string; error?: string }> {
    const admin = await checkAdminAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        // Get current expiry using SDK
        const users: any = await directus.request(readUsers({
            fields: ['membership_expiry'] as any,
            filter: { id: { _eq: directusUserId } } as any,
            limit: 1
        }));
        const user = users?.[0];
        
        if (!user) return { success: false, error: 'Kon lid niet ophalen' };
        
        // Compute new expiry: extend from current expiry or from today, whichever is later
        const today = new Date();
        const currentExpiry = user.membership_expiry ? new Date(user.membership_expiry) : null;
        const baseDate = currentExpiry && currentExpiry > today ? currentExpiry : today;

        const newExpiry = new Date(baseDate);
        newExpiry.setMonth(newExpiry.getMonth() + months);
        const newExpiryStr = newExpiry.toISOString().substring(0, 10);

        await directus.request(updateUser(directusUserId, { membership_expiry: newExpiryStr } as any));

        // Trigger targeted Azure sync to update group membership (Leden_Actief etc.)
        if (INTERNAL_TOKEN) {
            fetch(`${AZURE_SYNC_URL}/api/sync/run/${directusUserId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${INTERNAL_TOKEN}` },
            }).catch(e => console.warn('[renewMembership] Sync trigger failed:', e));
        }

        revalidatePath(`/beheer/leden/${directusUserId}`);
        revalidatePath('/beheer/leden');
        return { success: true, newExpiry: newExpiryStr };
    } catch (err) {
        console.error('[renewMembership] Error:', err);
        return { success: false, error: 'Er is een fout opgetreden' };
    }
}



