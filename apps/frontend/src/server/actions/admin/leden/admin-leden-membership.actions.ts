'use server';

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { enforceFeatureAccess } from '@/server/actions/admin/admin-utils.actions';
import { logAdminAction } from '@/server/actions/infrastructure/audit.actions';
import { safeConsoleError } from '@/server/utils/logger';
import { db, schema } from '@salvemundi/db';
import { eq } from 'drizzle-orm';

const renewMembershipSchema = z.object({
    months: z.number().int().min(1).max(60)
});

const AZURE_MGMT_URL = process.env.AZURE_MANAGEMENT_SERVICE_URL;
const AZURE_SYNC_URL = process.env.AZURE_SYNC_SERVICE_URL;
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();

async function checkAdminAccess() {
    try {
        const result = await enforceFeatureAccess('leden');
        return result.user;
    } catch {
        return null;
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
        safeConsoleError(`[admin-leden-membership.actions.ts][sendMembershipReminderAction] Failed to send membership reminder:`, error);
        await logAdminAction('admin_membership_reminder_sent', 'ERROR', {
            context: 'lidmaatschap',
            days_before_expiry: validated.data,
            error: error instanceof Error ? error.message : String(error)
        });
        return { success: false, error: "Interne serverfout bij het versturen van herinneringen." };
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
        const user = await db.query.directus_users.findFirst({
            columns: { email: true, membership_expiry: true, entra_id: true, first_name: true, last_name: true, phone_number: true, date_of_birth: true },
            where: eq(schema.directus_users.id, directusUserId)
        });
        if (!user) return { success: false, error: 'Kon lid niet ophalen' };

        const today = new Date();
        const currentExpiry = user.membership_expiry ? new Date(user.membership_expiry) : null;
        const baseDate = currentExpiry && currentExpiry > today ? currentExpiry : today;

        const newExpiry = new Date(baseDate);
        newExpiry.setMonth(newExpiry.getMonth() + months);
        const { toLocalISOString } = await import("@/lib/utils/date-utils");
        const newExpiryStr = toLocalISOString(newExpiry) as string;

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
                safeConsoleError(`[admin-leden-membership.actions.ts][renewMembershipAction] Failed to update Entra ID custom attribute for ${directusUserId}:`, error);
            });

            // Add user to active group
            const firstCommittee = await db.query.committees.findFirst({
                columns: { azure_group_id: true },
                where: eq(schema.committees.name, 'Leden_Actief_Lidmaatschap')
            });
            const activeGroupId = firstCommittee?.azure_group_id;

            if (activeGroupId) {
                await fetch(`${AZURE_MGMT_URL}/api/groups/${encodeURIComponent(activeGroupId)}/members`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${INTERNAL_TOKEN}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.entra_id })
                }).catch((error: unknown) => {
                    safeConsoleError(`[admin-leden-membership.actions.ts][renewMembershipAction] Failed to add user to group for ${directusUserId}:`, error);
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
                safeConsoleError(`[admin-leden-membership.actions.ts][renewMembershipAction] Failed to sync user for ${directusUserId}:`, error);
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
        safeConsoleError(`[admin-leden-membership.actions.ts][renewMembershipAction] Failed to renew membership for ${directusUserId}:`, error);
        return { success: false, error: 'Er is een fout opgetreden' };
    }
}
