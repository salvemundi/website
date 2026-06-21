'use server';

import { getSystemDirectus } from "@/lib/directus";
import { getAuthorizedUser, verifyActivityBOLA } from "@/server/actions/events/activiteiten/auth-check";
import { logAdminAction } from '@/server/actions/infrastructure/audit.actions';
import { deleteEventSignupDb, updateEventSignupDb } from "@/server/internal/event-db.utils";
import { fetchEventSignupByTokenDb } from "@/server/internal/event-db.utils";
import { safeConsoleError } from '@/server/utils/logger';
import {
    createItem,
    deleteItem,
    readUsers,
    updateItem
} from "@directus/sdk";
import { createManualSignupSchema, deleteSignupSchema, toggleCheckInSchema, USER_BASIC_FIELDS, type UserBasic } from "@salvemundi/validations";
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
            await getSystemDirectus().request(deleteItem('event_signups', signupId));
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
        const users = await getSystemDirectus().request(
            readUsers({
                search: query,
                limit: 10,
                fields: [...USER_BASIC_FIELDS]
            })
        );
        return { success: true, data: users as unknown as UserBasic[] };
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
        const payload: { [key: string]: unknown } = {
            event_id: eventId,
            payment_status: 'paid'
        };

        if (signupType === 'member') {
            if (!memberData) throw new Error('Lid gegevens ontbreken');
            payload.directus_relations = memberData.id;
            payload.participant_name = `${memberData.first_name} ${memberData.last_name || ''}`.trim();
            payload.participant_email = memberData.email;
            payload.is_member = true;
        } else {
            if (!guestData) throw new Error('Gast gegevens ontbreken');
            payload.participant_name = guestData.name;
            payload.participant_email = guestData.email;
            payload.participant_phone = guestData.phone || null;
            payload.is_member = false;
        }

        try {
            const newItem = await getSystemDirectus().request(createItem('event_signups', payload)) as unknown as { id?: number } | null;

            if (!newItem || !newItem.id) {
                throw new Error('Geen ID teruggekregen van het CMS');
            }

            await logAdminAction('admin_event_signup_manual_created', 'SUCCESS', { context: 'activiteit', event_id: eventId, context_name: eventName, id: newItem.id, data: payload });

            revalidateTag(`event_signups_${eventId}`, 'max');
            revalidatePath(`/beheer/activiteiten/${eventId}/aanmeldingen`);
            revalidatePath('/beheer/activiteiten');
            return { success: true };
        } catch (error) {
            const typedError = error instanceof Error ? error : new Error(String(error));
            safeConsoleError('[aanmeldingen.actions.ts][createManualSignupAction] ', `Directus createItem failed (signup): ${typedError.message}`);
            await logAdminAction('system_activity_signup_failed', 'ERROR', {
                context: 'activiteit',
                event_id: eventId,
                context_name: eventName,
                error: typedError.message,
                payload: payload
            });
            return { success: false, error: 'Synchronisatie met CMS mislukt. Aanmelding niet opgeslagen.' };
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
            await getSystemDirectus().request(updateItem('event_signups', signupId, payload));
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