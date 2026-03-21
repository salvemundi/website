'use server';

import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { revalidateTag, revalidatePath } from "next/cache";
import { directus, directusRequest } from "@/lib/directus";
import { 
    readItems, 
    createItem, 
    updateItem, 
    deleteItem,
    readUsers
} from "@directus/sdk";

const getNotificationUrl = () => process.env.INTERNAL_NOTIFICATION_API_URL || process.env.NEXT_PUBLIC_NOTIFICATION_API_URL;

async function getSession() {
    return await auth.api.getSession({
        headers: await headers()
    });
}

async function checkAdminAccess() {
    const session = await getSession();
    if (!session || !session.user) return false;
    return session.user;
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
                subject: `Uitschrijving: ${eventName}`,
                html: `Beste aanmelder,<br/><br/>Je bent afgemeld voor de activiteit: <strong>${eventName}</strong>.<br/><br/>Met vriendelijke groet,<br/>Het Salve Mundi Team`
            })
        });
    } catch (e) {
        console.error('Cancellation email failed', e);
    }
}

export async function deleteSignupAction(signupId: number, eventId: string | number, participantEmail?: string, eventName?: string) {
    const user = await checkAdminAccess();
    if (!user) return { success: false, error: "Unauthorized" };

    try {
        await directusRequest(deleteItem('event_signups', signupId));
        
        if (participantEmail && eventName) {
            await sendCancellationEmail(participantEmail, eventName);
        }
        
        revalidateTag(`event_signups_${eventId}`, 'default');
        revalidatePath(`/beheer/activiteiten/${eventId}/aanmeldingen`);
        revalidatePath('/beheer/activiteiten');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete signup:", error);
        return { success: false, error: "Verwijderen mislukt" };
    }
}

export async function searchMembersAction(query: string) {
    const user = await checkAdminAccess();
    if (!user) return { success: false, error: "Unauthorized", data: [] };

    if (query.length < 2) return { success: true, data: [] };

    try {
        const users = await directusRequest<any[]>(
            readUsers({
                search: query,
                limit: 10,
                fields: ['id', 'first_name', 'last_name', 'email']
            })
        );
        return { success: true, data: users || [] };
    } catch (error) {
        console.error("Failed to search members:", error);
        return { success: false, error: "Zoeken mislukt", data: [] };
    }
}

export async function createManualSignupAction(eventId: number, eventName: string, signupType: 'member' | 'guest', guestData?: any, memberData?: any) {
    const user = await checkAdminAccess();
    if (!user) return { success: false, error: "Unauthorized" };

    try {
        let payload: any = {
            event_id: eventId,
            payment_status: 'paid'
        };

        if (signupType === 'member') {
            payload.directus_relations = memberData.id;
            payload.participant_name = `${memberData.first_name} ${memberData.last_name || ''}`.trim();
            payload.participant_email = memberData.email;
        } else {
            payload.participant_name = guestData.name;
            payload.participant_email = guestData.email;
            payload.participant_phone = guestData.phone || null;
        }

        await directusRequest(createItem('event_signups', payload));

        revalidateTag(`event_signups_${eventId}`, 'default');
        revalidatePath(`/beheer/activiteiten/${eventId}/aanmeldingen`);
        revalidatePath('/beheer/activiteiten');
        return { success: true };
    } catch (error: any) {
        console.error("Failed to create manual signup:", error);
        const errMessage = error?.errors?.[0]?.message || "";
        if (errMessage.includes('UNIQUE') || errMessage.includes('duplicate')) {
            return { success: false, error: "Deze persoon is al ingeschreven." };
        }
        return { success: false, error: "Aanmelding opslaan mislukt." };
    }
}

export async function toggleCheckInAction(signupId: number, eventId: number, checkedIn: boolean) {
    const user = await checkAdminAccess();
    if (!user) return { success: false, error: "Unauthorized" };

    try {
        await directusRequest(
            updateItem('event_signups', signupId, {
                checked_in: checkedIn,
                checked_in_at: checkedIn ? new Date().toISOString() : null
            })
        );

        revalidateTag(`event_signups_${eventId}`, 'default');
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle check-in:", error);
        return { success: false, error: "Check-in bijwerken mislukt" };
    }
}

