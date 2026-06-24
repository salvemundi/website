'use server';

import { z } from "zod";
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { revalidateTag, revalidatePath } from "next/cache";
import { isMemberAdmin } from "@/lib/auth";
import { logAdminAction } from '@/server/actions/infrastructure/audit.actions';
import { safeConsoleError } from '@/server/utils/logger';

const renewMembershipSchema = z.object({
    months: z.number().int().min(1).max(60)
});

const AZURE_MGMT_URL = process.env.AZURE_MANAGEMENT_SERVICE_URL;
const AZURE_SYNC_URL = process.env.AZURE_SYNC_SERVICE_URL;
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();

interface UserRow {
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    phone_number: string | null;
    date_of_birth: string | null;
    membership_expiry: string | null;
    entra_id: string | null;
}

async function checkAdminAccess() {
    const session = await getEnrichedSession();
    if (!session) return null;
    const { fetchUserCommitteesDb } = await import("@/server/internal/user-db.utils");
    const committees = await fetchUserCommitteesDb(session.user.id);

    if (!isMemberAdmin(committees)) return null;
    return session;
}

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
            const errorText = await mgmtRes.text().catch(() => 'Unknown Error');
            await logAdminAction('admin_azure_membership_updated', 'ERROR', {
                context: 'lidmaatschap',
                member_id: directusUserId,
                azure_group_id: azureGroupId,
                action: action,
                error: errorText
            });
            return { success: false, error: "Fout bij communicatie met de Azure Management service." };
        }

        await fetch(`${AZURE_SYNC_URL}/api/sync/run/${encodeURIComponent(directusUserId)}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${INTERNAL_TOKEN}`
            }
        });

        const { query: queryReval } = await import("@/lib/database");
        const { rows: revalRows } = await queryReval<{ email: string | null }>('SELECT email FROM directus_users WHERE id = $1 LIMIT 1', [directusUserId]);
        const firstRevalRow = revalRows[0] as { email: string | null } | undefined;
        const emailSlug = firstRevalRow?.email?.split('@')[0]?.replace(/\./g, '-') ?? directusUserId;
        revalidatePath(`/beheer/leden/${encodeURIComponent(emailSlug)}`);
        revalidateTag(`user_${directusUserId}`, 'max');
        revalidateTag(`user_committees_${directusUserId}`, 'max');

        await logAdminAction('admin_azure_membership_updated', 'SUCCESS', {
            context: 'lidmaatschap',
            member_id: directusUserId,
            azure_group_id: azureGroupId,
            action: action
        });

        return { success: true };
    } catch (error: unknown) {
        safeConsoleError(`[leden.actions.ts][manageAzureMembershipAction] Failed to manage Azure membership for ${directusUserId}:`, error);
        await logAdminAction('admin_azure_membership_updated', 'ERROR', {
            context: 'lidmaatschap',
            member_id: directusUserId,
            azure_group_id: azureGroupId,
            action: action,
            error: error instanceof Error ? error.message : String(error)
        });
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
            const errorText = await res.text().catch(() => 'Unknown Error');
            await logAdminAction('admin_membership_reminder_sent', 'ERROR', {
                context: 'lidmaatschap',
                days_before_expiry: validated.data,
                error: errorText
            });
            return { success: false, error: "Service onbeschikbaar." };
        }

        const data = (await res.json()) as { sent?: number };
        await logAdminAction('admin_membership_reminder_sent', 'SUCCESS', {
            context: 'lidmaatschap',
            days_before_expiry: validated.data,
            recipient_count: data.sent || 0
        });
        return { success: true, count: data.sent || 0 };
    } catch (error: unknown) {
        safeConsoleError(`[leden.actions.ts][sendMembershipReminderAction] Failed to send membership reminder:`, error);
        await logAdminAction('admin_membership_reminder_sent', 'ERROR', {
            context: 'lidmaatschap',
            days_before_expiry: validated.data,
            error: error instanceof Error ? error.message : String(error)
        });
        return { success: false, error: "Interne serverfout bij het versturen van herinneringen." };
    }
}

export async function updateMemberProfileAction(
    directusUserId: string,
    payload: {
        first_name?: string | null;
        last_name?: string | null;
        phone_number?: string | null;
        date_of_birth?: string | null;
    }
) {
    const admin = await checkAdminAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const { query: queryUpdate } = await import("@/lib/database");
        const { rows: updateRows } = await queryUpdate<{ email: string | null; entra_id: string | null }>(
            'SELECT email, entra_id FROM directus_users WHERE id = $1 LIMIT 1',
            [directusUserId]
        );
        const user = updateRows[0] as { email: string | null; entra_id: string | null } | undefined;
        if (!user) return { success: false, error: 'Lid niet gevonden' };

        if (user.entra_id && AZURE_MGMT_URL && INTERNAL_TOKEN) {
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
            }).catch((error: unknown) => {
                safeConsoleError(`[leden.actions.ts][updateMemberProfileAction] Azure patch request failed:`, error);
            });
        }

        if (AZURE_SYNC_URL && INTERNAL_TOKEN) {
            await fetch(`${AZURE_SYNC_URL}/api/sync/run/${encodeURIComponent(directusUserId)}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${INTERNAL_TOKEN}`
                }
            }).catch((error: unknown) => {
                safeConsoleError(`[leden.actions.ts][updateMemberProfileAction] Failed to sync user for ${directusUserId}:`, error);
            });
        }

        const emailSlugForUpdate = user.email?.split('@')[0]?.replace(/\./g, '-') ?? directusUserId;
        revalidatePath(`/beheer/leden/${encodeURIComponent(emailSlugForUpdate)}`);

        await logAdminAction('admin_member_profile_updated', 'SUCCESS', {
            context: 'lidmaatschap',
            member_id: directusUserId,
            updates: payload
        });

        return { success: true };
    } catch (error: unknown) {
        safeConsoleError(`[leden.actions.ts][updateMemberProfileAction] Failed to update profile for ${directusUserId}:`, error);
        return { success: false, error: 'Opslaan mislukt' };
    }
}

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
        const { query } = await import("@/lib/database");
        const { rows } = await query<UserRow>('SELECT email, membership_expiry, entra_id, first_name, last_name, phone_number, date_of_birth FROM directus_users WHERE id = $1 LIMIT 1', [directusUserId]);

        const user = rows[0] as UserRow | undefined;
        if (!user) return { success: false, error: 'Kon lid niet ophalen' };

        const today = new Date();
        const currentExpiry = user.membership_expiry ? new Date(user.membership_expiry) : null;
        const baseDate = currentExpiry && currentExpiry > today ? currentExpiry : today;

        const newExpiry = new Date(baseDate);
        newExpiry.setMonth(newExpiry.getMonth() + months);
        const { toLocalISOString } = await import("@/lib/utils/date-utils");
        const newExpiryStr = toLocalISOString(newExpiry) as string;

        const { db, schema } = await import('@salvemundi/db');
        const { eq } = await import('drizzle-orm');
        await db.update(schema.directus_users).set({ membership_expiry: newExpiryStr }).where(eq(schema.directus_users.id, directusUserId));

        if (user.entra_id && AZURE_MGMT_URL && INTERNAL_TOKEN) {
            // Update Entra ID custom security attributes (membershipExpiry)
            await fetch(`${AZURE_MGMT_URL}/api/users/${encodeURIComponent(user.entra_id)}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${INTERNAL_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    membershipExpiry: newExpiryStr
                })
            }).catch((error: unknown) => {
                safeConsoleError(`[leden.actions.ts][renewMembershipAction] Failed to update Entra ID custom attribute for ${directusUserId}:`, error);
            });

            // Add user to active group
            const { rows: committees } = await (await import("@/lib/database")).query<{ azure_group_id: string | null }>(
                "SELECT azure_group_id FROM committees WHERE name = 'Leden_Actief_Lidmaatschap' LIMIT 1"
            );
            const firstCommittee = committees[0] as { azure_group_id: string | null } | undefined;
            const activeGroupId = firstCommittee?.azure_group_id;

            if (activeGroupId) {
                await fetch(`${AZURE_MGMT_URL}/api/groups/${encodeURIComponent(activeGroupId)}/members`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${INTERNAL_TOKEN}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.entra_id })
                }).catch((error: unknown) => {
                    safeConsoleError(`[leden.actions.ts][renewMembershipAction] Failed to add user to group for ${directusUserId}:`, error);
                });
            }
        }

        if (AZURE_SYNC_URL && INTERNAL_TOKEN) {
            await fetch(`${AZURE_SYNC_URL}/api/sync/run/${encodeURIComponent(directusUserId)}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${INTERNAL_TOKEN}`
                }
            }).catch((error: unknown) => {
                safeConsoleError(`[leden.actions.ts][renewMembershipAction] Failed to sync user for ${directusUserId}:`, error);
            });
        }

        const renewSlug = user.email?.split('@')[0]?.replace(/\./g, '-') ?? directusUserId;
        revalidatePath(`/beheer/leden/${encodeURIComponent(renewSlug)}`);
        revalidatePath('/beheer/leden');

        await logAdminAction('admin_membership_renewed', 'SUCCESS', {
            context: 'lidmaatschap',
            member_id: directusUserId,
            months_added: months,
            new_expiry: newExpiryStr
        });

        return { success: true, newExpiry: newExpiryStr };
    } catch (error: unknown) {
        safeConsoleError(`[leden.actions.ts][renewMembershipAction] Failed to renew membership for ${directusUserId}:`, error);
        return { success: false, error: 'Er is een fout opgetreden' };
    }
}

export async function provisionAzureAccountAction(directusUserId: string) {
    const admin = await checkAdminAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const { query } = await import("@/lib/database");
        const { rows } = await query<UserRow>('SELECT email, first_name, last_name, phone_number, date_of_birth FROM directus_users WHERE id = $1 LIMIT 1', [directusUserId]);

        const user = rows[0] as UserRow | undefined;
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
            const errorData = (await res.json().catch(() => ({ error: 'Onbekende fout' }))) as { error?: string };
            safeConsoleError(`[leden.actions.ts][provisionAzureAccountAction] Failed to provision Azure account for ${directusUserId}:`, errorData);
            return { success: false, error: errorData.error || "Azure provisioning mislukt." };
        }

        const provisionSlug = user.email.split('@')[0].replace(/\./g, '-');
        revalidatePath(`/beheer/leden/${encodeURIComponent(provisionSlug)}`);

        await logAdminAction('admin_azure_provisioning', 'SUCCESS', {
            context: 'lidmaatschap',
            member_id: directusUserId,
            email: user.email
        });

        return { success: true };
    } catch (error: unknown) {
        safeConsoleError(`[leden.actions.ts][provisionAzureAccountAction] Failed to provision Azure account for ${directusUserId}:`, error);
        return { success: false, error: "Er is een fout opgetreden bij het aanmaken van het Azure account." };
    }
}