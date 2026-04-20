'use server';

import { z } from "zod";
import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { revalidateTag, revalidatePath } from "next/cache";
import { getSystemDirectus } from "@/lib/directus";
import { readItems, updateItem, updateUser, readUsers, readUser } from "@directus/sdk";
import { isSuperAdmin, isMemberAdmin } from "@/lib/auth";
import { logAdminAction } from "./audit.actions";
import { USER_FULL_FIELDS, COMMITTEE_FIELDS, USER_ID_FIELDS } from "@salvemundi/validations";

const updateMemberSchema = z.object({
    first_name: z.string().min(1).optional(),
    last_name: z.string().min(1).optional(),
    phone_number: z.string().optional(),
    date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

const renewMembershipSchema = z.object({
    months: z.number().int().min(1).max(60),
});

const AZURE_MGMT_URL = process.env.AZURE_MANAGEMENT_SERVICE_URL;
const AZURE_SYNC_URL = process.env.AZURE_SYNC_SERVICE_URL;
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

async function checkAdminAccess() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session || !session.user) return null;
    
    const { fetchUserCommitteesDb } = await import("./user-db.utils");
    const committees = await fetchUserCommitteesDb(session.user.id);
    
    if (!isMemberAdmin(committees)) return null;
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
            
        }

    // Revalidate
    const { query: queryReval } = await import("@/lib/database");
    const { rows: revalRows } = await queryReval('SELECT email FROM directus_users WHERE id = $1 LIMIT 1', [directusUserId]);
    const emailSlug = revalRows?.[0]?.email?.split('@')[0]?.replace(/\./g, '-') ?? directusUserId;
    revalidatePath(`/beheer/leden/${encodeURIComponent(emailSlug)}`);
    revalidateTag(`user_${directusUserId}`, 'default');
    revalidateTag(`user_committees_${directusUserId}`, 'default');

        return { success: true };
    } catch (err: any) {
        
        return { success: false, error: "Er is een fout opgetreden bij het bijwerken in Azure." };
    }
}

export async function sendMembershipReminderAction(daysBeforeExpiry: number = 30) {
    const user = await checkAdminAccess();
    if (!user) return { success: false, error: "Unauthorized" };

    const validated = z.number().int().min(1).max(365).safeParse(daysBeforeExpiry);
    if (!validated.success) return { success: false, error: "Ongeldig aantal dagen" };

    const siteUrl = process.env.PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL || '';

    try {
        const res = await fetch(`${siteUrl}/api/notifications/send-membership-reminder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ daysBeforeExpiry: validated.data })
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
    data: z.infer<typeof updateMemberSchema>
) {
    const admin = await checkAdminAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    const validated = updateMemberSchema.safeParse(data);
    if (!validated.success) {
        return { success: false, error: "Validatie mislukt", fieldErrors: validated.error.flatten().fieldErrors };
    }

    const payload = validated.data;
    if (Object.keys(payload).length === 0) {
        return { success: false, error: "Geen wijzigingen opgegeven" };
    }

    try {
        await getSystemDirectus().request(updateUser(directusUserId, payload));

        const { fetchUserProfileByEmailDb } = await import("./user-db.utils");
        // We need user email to fetch profile via SQL helper (or just use direct query if id is known)
        // Since we have the ID, let's use a quick SQL query here
        const { query } = await import("@/lib/database");
        const { rows } = await query('SELECT entra_id FROM directus_users WHERE id = $1 LIMIT 1', [directusUserId]);
        const user = rows?.[0];

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
            }).catch(() => {});
        }

        const emailSlugForUpdate = (await (await import("@/lib/database")).query('SELECT email FROM directus_users WHERE id = $1 LIMIT 1', [directusUserId])).rows?.[0]?.email?.split('@')[0]?.replace(/\./g, '-') ?? directusUserId;
        revalidatePath(`/beheer/leden/${encodeURIComponent(emailSlugForUpdate)}`);
        
        // Log the change
        await logAdminAction('member_profile_updated', 'SUCCESS', { 
            member_id: directusUserId,
            updates: payload 
        });

        return { success: true };
    } catch (err) {
        
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

    const validated = renewMembershipSchema.safeParse({ months });
    if (!validated.success) {
        return { success: false, error: "Ongeldig aantal maanden (1-60)" };
    }

    try {
        const { fetchUserProfileByEmailDb } = await import("./user-db.utils");
        const { query } = await import("@/lib/database");
        const { rows } = await query('SELECT * FROM directus_users WHERE id = $1 LIMIT 1', [directusUserId]);
        const user = rows?.[0];
        if (!user) return { success: false, error: 'Kon lid niet ophalen' };
        
        const today = new Date();
        const currentExpiry = user.membership_expiry ? new Date(user.membership_expiry) : null;
        const baseDate = currentExpiry && currentExpiry > today ? currentExpiry : today;

        const newExpiry = new Date(baseDate);
        newExpiry.setMonth(newExpiry.getMonth() + months);
        const newExpiryStr = newExpiry.toISOString().substring(0, 10);

        await getSystemDirectus().request(updateUser(directusUserId, { membership_expiry: newExpiryStr } as any));

        if (user.entra_id && AZURE_MGMT_URL && INTERNAL_TOKEN) {
            const { rows: committees } = await (await import("@/lib/database")).query(
                "SELECT azure_group_id FROM committees WHERE name = 'Leden_Actief_Lidmaatschap' LIMIT 1"
            );
            const activeGroupId = committees?.[0]?.azure_group_id;

            if (activeGroupId) {
                await fetch(`${AZURE_MGMT_URL}/api/groups/${encodeURIComponent(activeGroupId)}/members`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${INTERNAL_TOKEN}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.entra_id })
                }).catch(() => {});
            }
        }

        if (AZURE_SYNC_URL && INTERNAL_TOKEN) {
            fetch(`${AZURE_SYNC_URL}/api/sync/run/${encodeURIComponent(directusUserId)}`, {
                method: 'POST',
            }).catch(() => {});
        }

        const renewSlug = user.email?.split('@')[0]?.replace(/\./g, '-') ?? directusUserId;
        revalidatePath(`/beheer/leden/${encodeURIComponent(renewSlug)}`);
        revalidatePath('/beheer/leden');

        // Log the renewal
        await logAdminAction('membership_renewed', 'SUCCESS', { 
            member_id: directusUserId,
            months_added: months,
            new_expiry: newExpiryStr 
        });

        return { success: true, newExpiry: newExpiryStr };
    } catch (err) {
        
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
        const { query } = await import("@/lib/database");
        const { rows } = await query('SELECT * FROM directus_users WHERE id = $1 LIMIT 1', [directusUserId]);
        const user = rows?.[0];

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

        const provisionSlug = user.email?.split('@')[0]?.replace(/\./g, '-') ?? directusUserId;
        revalidatePath(`/beheer/leden/${encodeURIComponent(provisionSlug)}`);

        // Log the provisioning
        await logAdminAction('azure_provisioning', 'SUCCESS', { 
            member_id: directusUserId,
            email: user.email 
        });

        return { success: true };
    } catch (err: any) {
        
        return { success: false, error: "Interne fout bij provisioning." };
    }
}



