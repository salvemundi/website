'use server';

import { db, schema } from "@salvemundi/db";
import { eq } from "drizzle-orm";
import { getAuthorizedUser, verifyActivityBOLA } from "@/server/actions/events/activiteiten/auth-check";
import { logAdminAction } from '@/server/actions/infrastructure/audit.actions';
import { deleteEventSignupDb, updateEventSignupDb } from "@/server/internal/event-db.utils";
import { fetchEventSignupByTokenDb } from "@/server/internal/event-db.utils";
import { safeConsoleError } from '@/server/utils/logger';
import { createManualSignupSchema, deleteSignupSchema, toggleCheckInSchema, type UserBasic } from "@salvemundi/validations";
import { revalidatePath, revalidateTag } from "next/cache";

const getNotificationUrl = () => process.env.INTERNAL_NOTIFICATION_API_URL || process.env.NEXT_PUBLIC_NOTIFICATION_API_URL;

async function checkAdminAccess() {
    const user = await getAuthorizedUser();
    if (!user) return null;

    if (user.isAdmin || user.isICT || user.canAccessActivitiesEdit) {
        return { user };
    }

    return null;
}

async function sendCancellationEmail(email: string, eventName: string) {
    const url = getNotificationUrl();
    if (!url || !email) return;
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: email,
                subject: `Cancellation: ${eventName}`,
                html: `Dear member,<br/><br/>You have been signed off from the activity: <strong>${eventName}</strong>.<br/><br/>Kind regards,<br/>The Salve Mundi Team`
            })
        });
    } catch (error) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[aanmeldingen.actions.ts][sendCancellationEmail] ', `Fout opgetreden: ${typedError.message}`);
    }
}

export async function deleteSignupAction(signupId: number, eventId: string | number, participantEmail?: string, eventName?: string) {
    const validated = deleteSignupSchema.safeParse({ signupId, eventId, participantEmail, eventName });
    if (!validated.success) {
        return { success: false, error: "Ongeldige invoer" };
    }
    try {
        await verifyActivityBOLA(eventId);
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Unauthorized" };
    }

    try {
        const success = await deleteEventSignupDb(signupId);
        if (!success) throw new Error("Deletion from database failed");

        try {
            await db.delete(schema.event_signups).where(eq(schema.event_signups.id, signupId));
        } catch (error) {
            await logAdminAction('system_event_signup_delete_failed', 'ERROR', { context: 'activiteit', event_id: eventId, id: signupId, error: String(error) });
            return { success: false, error: "CMS Synchronisatie mislukt. Aanmelding niet verwijderd." };
        }

        if (participantEmail && eventName) {
            await sendCancellationEmail(participantEmail, eventName);
        }

        await logAdminAction('admin_event_signup_deleted', 'SUCCESS', {
            context: 'activiteit',
            event_id: eventId,
            id: signupId,
            email: participantEmail,
            event_name: eventName
        });

        revalidateTag(`event_signups_${eventId}`, 'max');
        revalidatePath(`/beheer/activiteiten/${eventId}/aanmeldingen`);
        revalidatePath('/beheer/activiteiten');
        return { success: true };
    } catch (error) {
        await logAdminAction('system_event_signup_delete_failed', 'ERROR', {
            context: 'activiteit',
            event_id: eventId,
            id: signupId,
            error: error instanceof Error ? error.message : String(error)
        });
        return { success: false, error: "Deletion failed" };
    }
}

export async function searchMembersAction(query: string) {
    const session = await checkAdminAccess();
    if (!session?.user) return { success: false, error: "Unauthorized", data: [] };

    if (query.length < 2) return { success: true, data: [] };

    try {
        const users = await db.query.directus_users.findMany({
            where: (users, { ilike, or }) => or(
                ilike(users.first_name, `%${query}%`),
                ilike(users.last_name, `%${query}%`),
                ilike(users.email, `%${query}%`)
            ),
            limit: 10,
            columns: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                avatar: true
            }
        });
        return { success: true, data: users as UserBasic[] };
    } catch {
        return { success: false, error: "Search failed", data: [] as UserBasic[] };
    }
}

export async function createManualSignupAction(
    eventId: number,
    eventName: string,
    signupType: 'member' | 'guest',
    guestData?: { name: string; email: string; phone?: string },
    memberData?: UserBasic
) {
    const validated = createManualSignupSchema.safeParse({ eventId, eventName, signupType, guestData, memberData });
    if (!validated.success) {
        return { success: false, error: "Ongeldige invoer" };
    }
    try {
        const user = await verifyActivityBOLA(eventId);
        const { rateLimit } = await import('@/server/utils/ratelimit');
        const { success } = await rateLimit(`manual-signup:${user.id}`, 20, 60);
        if (!success) {
            return { success: false, error: "Te veel aanmeldingen achter elkaar. Wacht even." };
        }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Unauthorized" };
    }

    try {
        const payload = {
            event_id: eventId,
            payment_status: 'paid',
            directus_relations: signupType === 'member' && memberData ? memberData.id : null,
            participant_name: signupType === 'member' && memberData ? `${memberData.first_name} ${memberData.last_name || ''}`.trim() : (guestData?.name || ''),
            participant_email: signupType === 'member' && memberData ? memberData.email : (guestData?.email || ''),
            participant_phone: signupType === 'guest' ? (guestData?.phone || null) : null,
            is_member: signupType === 'member',
        };

        try {
            const inserted = await db.insert(schema.event_signups).values(payload).returning({
                id: schema.event_signups.id
            });

            if (inserted.length === 0 || !inserted[0]) {
                throw new Error('Geen ID teruggekregen van de database');
            }
            const newItem = inserted[0];

            await logAdminAction('admin_event_signup_manual_created', 'SUCCESS', { context: 'activiteit', event_id: eventId, context_name: eventName, id: newItem.id, data: payload });

            revalidateTag(`event_signups_${eventId}`, 'max');
            revalidatePath(`/beheer/activiteiten/${eventId}/aanmeldingen`);
            revalidatePath('/beheer/activiteiten');
            return { success: true };
        } catch (error) {
            const typedError = error instanceof Error ? error : new Error(String(error));
            safeConsoleError('[aanmeldingen.actions.ts][createManualSignupAction] ', `Drizzle insert failed: ${typedError.message}`);
            await logAdminAction('system_activity_signup_failed', 'ERROR', {
                context: 'activiteit',
                event_id: eventId,
                context_name: eventName,
                error: typedError.message,
                payload: payload
            });
            return { success: false, error: 'Opslaan in database mislukt.' };
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('UNIQUE') || errorMessage.includes('duplicate')) {
            return { success: false, error: "This person is already signed up." };
        }
        return { success: false, error: "Failed to save signup." };
    }
}

export async function toggleCheckInAction(signupId: number, eventId: number, checkedIn: boolean) {
    const validated = toggleCheckInSchema.safeParse({ signupId, eventId, checkedIn });
    if (!validated.success) {
        return { success: false, error: "Ongeldige invoer" };
    }
    try {
        await verifyActivityBOLA(eventId);
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Unauthorized" };
    }

    try {
        const payload = {
            checked_in: checkedIn,
            checked_in_at: checkedIn ? new Date().toISOString() : null
        };

        const updated = await updateEventSignupDb(signupId, payload);
        if (!updated) throw new Error("Database update mislukt");

        try {
            await db.update(schema.event_signups).set(payload).where(eq(schema.event_signups.id, signupId));
        } catch (error) {
            await updateEventSignupDb(signupId, { checked_in: !checkedIn, checked_in_at: !checkedIn ? new Date().toISOString() : null });
            await logAdminAction('system_event_signup_checkin_rollback', 'ERROR', { context: 'activiteit', event_id: eventId, id: signupId, error: String(error), action: 'rollback_restore' });
            return { success: false, error: "CMS Synchronisatie mislukt. Check-in status niet bijgewerkt." };
        }

        await logAdminAction(checkedIn ? 'admin_event_signup_checked_in' : 'admin_event_signup_checked_out', 'SUCCESS', {
            context: 'activiteit',
            event_id: eventId,
            id: signupId,
            checked_in: checkedIn
        });

        revalidateTag(`event_signups_${eventId}`, 'max');
        return { success: true };
    } catch (error) {
        await logAdminAction('system_event_signup_checkin_rollback', 'ERROR', {
            context: 'activiteit',
            event_id: eventId,
            id: signupId,
            error: error instanceof Error ? error.message : String(error)
        });
        return { success: false, error: "Failed to update check-in" };
    }
}

export async function findSignupByTokenAction(token: string) {
    if (!token || typeof token !== 'string') {
        return { success: false, error: 'Ongeldige token' };
    }

    const session = await checkAdminAccess();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    try {
        const signup = await fetchEventSignupByTokenDb(token);
        if (!signup) return { success: false, error: 'Aanmelding niet gevonden' };

        return { success: true, data: signup };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Lookup failed' };
    }
}