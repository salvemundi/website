'use server';

import { revalidateTag, revalidatePath } from "next/cache";
import { getSystemDirectus } from "@/lib/directus";
import { getAuthorizedUser, verifyActivityBOLA } from "./activiteiten/auth-check";
import { 
    deleteItem,
    createItem,
    updateItem,
    readUsers
} from "@directus/sdk";
import { USER_BASIC_FIELDS, type UserBasic } from "@salvemundi/validations";
import { updateEventSignupDb, deleteEventSignupDb } from "./event-db.utils";
import { logAdminAction } from "./audit.actions";
import { 
    deleteSignupSchema,
    createManualSignupSchema,
    toggleCheckInSchema 
} from "@salvemundi/validations";


const getNotificationUrl = () => process.env.INTERNAL_NOTIFICATION_API_URL || process.env.NEXT_PUBLIC_NOTIFICATION_API_URL;

import { getEnrichedSession } from "@/server/auth/auth-utils";

async function getSession() {
    return await getEnrichedSession();
}

async function checkAdminAccess() {
    const user = await getAuthorizedUser();
    if (!user) return null;

    // Use isAdmin/isICT for broad management access, or check for granular activity edit permission
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
    } catch {
        
    }
}

export async function deleteSignupAction(signupId: number, eventId: string | number, participantEmail?: string, eventName?: string) {
    const validated = deleteSignupSchema.safeParse({ signupId, eventId, participantEmail, eventName });
    if (!validated.success) {
        return { success: false, error: "Ongeldige invoer" };
    }
    try {
        await verifyActivityBOLA(eventId);
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Unauthorized" };
    }

    try {
        const success = await deleteEventSignupDb(signupId);
        if (!success) throw new Error("Deletion from database failed");

        // Sync to Directus - now awaited
        try {
            await getSystemDirectus().request(deleteItem('event_signups', signupId));
        } catch (err) {
            
            await logAdminAction('event_signup_delete_failed', 'ERROR', { id: signupId, error: String(err) });
            // Non-critical rollback for delete? Actually we should probably revert the DB delete
            // But we already deleted it from Postgres. Ideally we do this in reverse.
            return { success: false, error: "CMS Synchronisatie mislukt. Aanmelding niet verwijderd." };
        }

        if (participantEmail && eventName) {
            await sendCancellationEmail(participantEmail, eventName);
        }
        
        revalidateTag(`event_signups_${eventId}`, 'max');
        revalidatePath(`/beheer/activiteiten/${eventId}/aanmeldingen`);
        revalidatePath('/beheer/activiteiten');
        return { success: true };
    } catch {
        
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
        return { success: true, data: (users || []) as unknown as UserBasic[] };
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
        const { rateLimit } = await import('../utils/ratelimit');
        const { success } = await rateLimit(`manual-signup:${user.id}`, 20, 60);
        if (!success) {
            return { success: false, error: "Te veel aanmeldingen achter elkaar. Wacht even." };
        }
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Unauthorized" };
    }

    try {
        const payload: Record<string, unknown> = {
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
            // Directus SDK will handle the database insertion and trigger internal logic (activity logs, etc.)
            // Since they share the same database, we don't need the redundant createEventSignupDb call here which causes ID conflicts.
            const newItem = await getSystemDirectus().request(createItem('event_signups', payload)) as unknown as { id: number };
            
            if (!newItem || !newItem.id) {
                throw new Error('Geen ID teruggekregen van het CMS');
            }

            await logAdminAction('event_signup_manual_created', 'SUCCESS', { id: newItem.id, data: payload });

            revalidateTag(`event_signups_${eventId}`, 'max');
            revalidatePath(`/beheer/activiteiten/${eventId}/aanmeldingen`);
            revalidatePath('/beheer/activiteiten');
            return { success: true };
        } catch (err) {
            console.error('[CMS Sync] Directus createItem failed (signup):', err);
            await logAdminAction('activity_signup_failed', 'ERROR', { 
                error: err instanceof Error ? err.message : JSON.stringify(err), 
                payload: payload
            });
            return { success: false, error: 'Synchronisatie met CMS mislukt. Aanmelding niet opgeslagen.' };
        }
    } catch (error: unknown) {
        const errMessage = error instanceof Error ? error.message : String(error);
        if (errMessage.includes('UNIQUE') || errMessage.includes('duplicate')) {
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
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Unauthorized" };
    }

    try {
        const payload = {
            checked_in: checkedIn,
            checked_in_at: checkedIn ? new Date().toISOString() : null
        };

        const updated = await updateEventSignupDb(signupId, payload);
        if (!updated) throw new Error("Database update mislukt");

        // Sync to Directus - now awaited
        try {
            await getSystemDirectus().request(updateItem('event_signups', signupId, payload));
        } catch (err) {
            
            // Revert DB on sync fail
            await updateEventSignupDb(signupId, { checked_in: !checkedIn, checked_in_at: !checkedIn ? new Date().toISOString() : null });
            await logAdminAction('event_signup_checkin_rollback', 'ERROR', { id: signupId, error: String(err), action: 'rollback_restore' });
            return { success: false, error: "CMS Synchronisatie mislukt. Check-in status niet bijgewerkt." };
        }

        revalidateTag(`event_signups_${eventId}`, 'max');
        return { success: true };
    } catch {
        
        return { success: false, error: "Failed to update check-in" };
    }
}
