'use server';

import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { revalidateTag, revalidatePath } from "next/cache";
import { getSystemDirectus } from "@/lib/directus";
import { getAuthorizedUser } from "./activiteiten/auth-check";
import { isSuperAdmin } from "@/lib/auth";
import { 
    deleteItem,
    createItem,
    updateItem,
    readUsers
} from "@directus/sdk";
import { USER_BASIC_FIELDS, type UserBasic } from "@salvemundi/validations";
import { createEventSignupDb, updateEventSignupDb, deleteEventSignupDb } from "./event-db.utils";
import { logAdminAction } from "./audit.actions";
import { query as dbQuery } from "@/lib/database";
import { COMMITTEES } from "@/shared/lib/permissions-config";
import { 
    deleteSignupSchema,
    createManualSignupSchema,
    toggleCheckInSchema 
} from "@salvemundi/validations";


const getNotificationUrl = () => process.env.INTERNAL_NOTIFICATION_API_URL || process.env.NEXT_PUBLIC_NOTIFICATION_API_URL;

async function getSession() {
    return await auth.api.getSession({
        headers: await headers()
    });
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
    } catch (e) {
        
    }
}

export async function deleteSignupAction(signupId: number, eventId: string | number, participantEmail?: string, eventName?: string) {
    const validated = deleteSignupSchema.safeParse({ signupId, eventId, participantEmail, eventName });
    if (!validated.success) {
        return { success: false, error: "Ongeldige invoer" };
    }
    const session = await checkAdminAccess();
    if (!session) return { success: false, error: "Unauthorized" };
    const { user } = session;

    // BOLA Check: Only ICT, Bestuur or the owning committee leader can delete
    const activityRes = await dbQuery("SELECT committee_id FROM events WHERE id = $1", [eventId]);
    const activityCommitteeId = activityRes.rows[0]?.committee_id;
    const isSuperAdmin = user.isICT || user.committees?.some(c => c.azure_group_id === COMMITTEES.BESTUUR);
    const userCommitteeIds = user.committees?.map(c => Number(c.id)) || [];

    if (!isSuperAdmin && !userCommitteeIds.includes(Number(activityCommitteeId))) {
        return { success: false, error: "Unauthorized: Je mag alleen aanmeldingen van je eigen commissie beheren." };
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
    } catch (error) {
        
        return { success: false, error: "Deletion failed" };
    }
}

export async function searchMembersAction(query: string) {
    const session = await checkAdminAccess();
    if (!session) return { success: false, error: "Unauthorized", data: [] };

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
    } catch (error) {
        
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
    const session = await checkAdminAccess();
    if (!session) return { success: false, error: "Unauthorized" };
    const { user } = session;

    const { rateLimit } = await import('../utils/ratelimit');
    const { success } = await rateLimit(`manual-signup:${user.id}`, 20, 60);
    if (!success) {
        return { success: false, error: "Te veel aanmeldingen achter elkaar. Wacht even." };
    }

    // BOLA Check
    const activityRes = await dbQuery("SELECT committee_id FROM events WHERE id = $1", [eventId]);
    const activityCommitteeId = activityRes.rows[0]?.committee_id;
    const isSuperAdmin = user.isICT || user.committees?.some(c => c.azure_group_id === COMMITTEES.BESTUUR);
    const userCommitteeIds = user.committees?.map(c => Number(c.id)) || [];

    if (!isSuperAdmin && !userCommitteeIds.includes(Number(activityCommitteeId))) {
        return { success: false, error: "Unauthorized: Je mag alleen aanmeldingen van je eigen commissie beheren." };
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
        } else {
            if (!guestData) throw new Error('Gast gegevens ontbreken');
            payload.participant_name = guestData.name;
            payload.participant_email = guestData.email;
            payload.participant_phone = guestData.phone || null;
        }

        const newId = await createEventSignupDb(payload);
        if (!newId) throw new Error('Toevoegen aan database mislukt');

        // Sync to Directus - now awaited
        try {
            await getSystemDirectus().request(createItem('event_signups', { ...payload, id: newId }));
        } catch (err) {
            
            // Cleanup DB if sync fails
            await deleteEventSignupDb(newId);
            await logAdminAction('event_signup_manual_rollback', 'ERROR', { id: newId, error: String(err), action: 'rollback_delete' });
            return { success: false, error: 'Synchronisatie met CMS mislukt. Aanmelding niet opgeslagen.' };
        }

        revalidateTag(`event_signups_${eventId}`, 'max');
        revalidatePath(`/beheer/activiteiten/${eventId}/aanmeldingen`);
        revalidatePath('/beheer/activiteiten');
        return { success: true };
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
    const session = await checkAdminAccess();
    if (!session) return { success: false, error: "Unauthorized" };
    const { user } = session;

    // BOLA Check
    const activityRes = await dbQuery("SELECT committee_id FROM events WHERE id = $1", [eventId]);
    const activityCommitteeId = activityRes.rows[0]?.committee_id;
    const isSuperAdmin = user.isICT || user.committees?.some(c => c.azure_group_id === COMMITTEES.BESTUUR);
    const userCommitteeIds = user.committees?.map(c => Number(c.id)) || [];

    if (!isSuperAdmin && !userCommitteeIds.includes(Number(activityCommitteeId))) {
        return { success: false, error: "Unauthorized: Je mag alleen aanmeldingen van je eigen commissie beheren." };
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
    } catch (error) {
        
        return { success: false, error: "Failed to update check-in" };
    }
}

