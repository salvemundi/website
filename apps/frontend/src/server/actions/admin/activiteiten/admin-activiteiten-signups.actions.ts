'use server';

import { db, schema } from "@salvemundi/db";
import { eq } from "drizzle-orm";
import { enforceFeatureAccess } from "@/server/actions/admin/admin-utils.actions";
import { verifyActivityBOLA } from "@/server/actions/events/activiteiten/activiteiten-write.actions";
import { logAdminAction } from '@/server/actions/infrastructure/audit.actions';
import { deleteEventSignupDb, updateEventSignupDb } from "@/server/internal/activiteiten/activiteiten-db.utils";
import { fetchEventSignupByTokenDb } from "@/server/internal/activiteiten/activiteiten-db.utils";
import { safeConsoleError } from '@/server/utils/logger';
import { createManualSignupSchema, deleteSignupSchema, toggleCheckInSchema, type UserBasic } from "@salvemundi/validations";
import { revalidatePath, revalidateTag } from "next/cache";



async function checkAdminAccess() {
    try {
        const { user } = await enforceFeatureAccess('activiteiten');
        return { user };
    } catch {
        return null;
    }
}

async function sendCancellationEmail(email: string, eventName: string, organizerEmail: string) {
    const mailUrl = process.env.MAIL_SERVICE_URL;
    const token = process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();

    if (!mailUrl || !token || !email) return;
    try {
        await fetch(`${mailUrl}/api/mail/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                to: email,
                templateId: 'event_cancellation',
                data: {
                    eventName: eventName,
                    organizerEmail: organizerEmail
                }
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
        await verifyActivityBOLA(Number(eventId));
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
            let organizerEmail = 'info@salvemundi.nl';
            try {
                const eventRecord = await db.query.events.findFirst({
                    where: eq(schema.events.id, Number(eventId)),
                    with: { committee: true }
                });
                
                if (eventRecord?.contact && eventRecord.contact.includes('@')) {
                    organizerEmail = eventRecord.contact;
                } else if (eventRecord?.committee?.name) {
                    const { buildCommitteeEmail } = await import('@/shared/lib/activity-utils');
                    const cEmail = buildCommitteeEmail(eventRecord.committee.name);
                    if (cEmail) organizerEmail = cEmail;
                }
            } catch (_err) {
                // Ignore and use fallback
            }

            await sendCancellationEmail(participantEmail, eventName, organizerEmail);
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
        const { checkRateLimit } = await import('@/server/utils/ratelimit');
        const rateLimitResult = await checkRateLimit(`manual-signup:${user.id}`, 20, 60, "Te veel aanmeldingen achter elkaar. Wacht even.");
        if (!rateLimitResult.success) return rateLimitResult;
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