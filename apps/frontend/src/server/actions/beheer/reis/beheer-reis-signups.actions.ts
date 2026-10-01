'use server';

import 'server-only';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { tripSignupSchema, type TripSignup, type TripSignupActivity } from '@salvemundi/validations/schema/trip.zod';
import { requireBeheerFeature } from '@/server/auth/auth-utils';
import {
    fetchAllTripSignupsDb,
    fetchTripSignupByIdDb,
    fetchTripSignupActivitiesDb,
    updateTripSignupDb,
    deleteTripSignupDb,
    fetchSelectedSignupActivitiesDb,
    type EnrichedTripSignupActivity
} from '@/server/internal/reis/reis-signup-db.utils';
import { fetchTripByIdDb } from '@/server/internal/reis/reis-trip-db.utils';
import { db, schema } from '@salvemundi/db';
import { eq } from 'drizzle-orm';
import { normalizeDate } from '@/lib/utils/date-utils';
import { safeConsoleError } from '@/server/utils/logger';
import { logAuditAction } from '@/server/actions/infrastructure/audit.actions';

export async function getTripSignups(tripId: number): Promise<TripSignup[]> {
    await requireBeheerFeature('reis');
    return await fetchAllTripSignupsDb(tripId);
}

export async function getTripSignup(id: number): Promise<TripSignup | null> {
    await requireBeheerFeature('reis');
    return await fetchTripSignupByIdDb(id);
}

export async function updateSignupStatus(
    signupId: number,
    status: string
): Promise<{ success: true } | { success: false; error: string }> {
    await requireBeheerFeature('reis');

    try {
        const signup = await fetchTripSignupByIdDb(signupId);
        if (!signup) throw new Error('Aanmelding niet gevonden');

        const oldStatus = signup.status;

        const success = await updateTripSignupDb(signupId, { status: status as TripSignup['status'] });
        if (!success) throw new Error('Database update mislukt');

        await logAuditAction('admin_trip_signup_status_updated', 'SUCCESS', {
            context: 'reis',
            signup_id: signupId,
            old_status: oldStatus,
            new_status: status
        });

        if (status === 'confirmed' && oldStatus !== 'confirmed' && signup.email) {
            const mailUrl = process.env.MAIL_SERVICE_URL;
            const token = process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();

            if (mailUrl && token) {
                const trip = signup.trip_id ? await fetchTripByIdDb(signup.trip_id) : null;
                const tripName = trip?.name;

                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
                const isGuest = !signup.directus_relations;
                const dashboardUrl = isGuest
                    ? `${siteUrl}/reis/betalen/aanbetaling?id=${signupId}&t=${signup.access_token}`
                    : `${siteUrl}/reis`;

                fetch(`${mailUrl}/api/mail/send`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        to: signup.email,
                        templateId: 'trip_status_update',
                        data: {
                            firstName: signup.first_name,
                            tripName: tripName,
                            isWaitlistPromotion: oldStatus === 'waitlist',
                            dashboardUrl: dashboardUrl,
                            isGuest: isGuest
                        }
                    })
                }).catch((error) => {
                    safeConsoleError(`[trip-signups.actions.ts][updateSignupStatus] Failed to send status update email for trip ${signup.trip_id} signup ${signupId}:`, error);
                });
            }
        }

        const { revalidatePath, revalidateTag } = await import('next/cache');
        revalidateTag('reis-status', 'max');

        revalidatePath('/beheer/reis');
        revalidatePath('/reis');

        return { success: true };
    } catch (error) {
        safeConsoleError(`[trip-signups.actions.ts][updateSignupStatus] Failed to update trip signup ${signupId}:`, error);
        return { success: false, error: error instanceof Error ? error.message : 'Update mislukt' };
    }
}

export async function deleteTripSignup(
    signupId: number
): Promise<{ success: true } | { success: false; error: string }> {
    await requireBeheerFeature('reis');

    try {
        const success = await deleteTripSignupDb(signupId);
        if (!success) throw new Error('Database delete mislukt');

        await logAuditAction('admin_trip_signup_deleted', 'SUCCESS', {
            context: 'reis',
            signup_id: signupId
        });

        const { revalidatePath, revalidateTag } = await import('next/cache');
        revalidateTag('reis-status', 'max');

        revalidatePath('/beheer/reis');
        revalidatePath('/reis');

        return { success: true };
    } catch (error) {
        safeConsoleError(`[trip-signups.actions.ts][deleteTripSignup] Failed to delete trip signup ${signupId}:`, error);
        return { success: false, error: error instanceof Error ? error.message : 'Verwijderen mislukt' };
    }
}

export async function updateTripSignup(
    prevState: unknown,
    formData: FormData
): Promise<{ success: true } | { success: false; error: string; fieldErrors?: Record<string, string[]>; initialData?: Record<string, FormDataEntryValue> }> {
    await requireBeheerFeature('reis');

    const id = parseInt(formData.get('id') as string);
    if (!id) throw new Error('Geen ID gevonden voor update');

    const rawData = Object.fromEntries(formData.entries());

    const data = {
        first_name: rawData.first_name as string,
        last_name: rawData.last_name as string,
        email: rawData.email as string,
        phone_number: rawData.phone_number as string,
        willing_to_drive: rawData.willing_to_drive === 'on' || rawData.willing_to_drive === 'true',
        deposit_paid: rawData.deposit_paid === 'on' || rawData.deposit_paid === 'true',
        full_payment_paid: rawData.full_payment_paid === 'on' || rawData.full_payment_paid === 'true',
        date_of_birth: normalizeDate(rawData.date_of_birth as string),
        status: rawData.status as string,
        role: rawData.role as string,
        allergies: rawData.allergies as string,
        special_notes: rawData.special_notes as string
    };

    const validated = tripSignupSchema.partial().safeParse(data);
    if (!validated.success) {
        return { success: false, error: 'Sommige velden zijn niet correct ingevuld. Controleer het formulier.', fieldErrors: z.flattenError(validated.error).fieldErrors, initialData: rawData };
    }

    try {
        const success = await updateTripSignupDb(id, validated.data);
        if (!success) throw new Error('Database update mislukt');

        await logAuditAction('admin_trip_signup_updated', 'SUCCESS', {
            context: 'reis',
            signup_id: id,
            updates: validated.data
        });

        const { revalidatePath, revalidateTag } = await import('next/cache');
        revalidateTag('reis-status', 'max');

        revalidatePath('/beheer/reis');
        revalidatePath(`/beheer/reis/deelnemer/${id}`);
        revalidatePath('/reis');

        return { success: true };
    } catch (error) {
        safeConsoleError(`[trip-signups.actions.ts][updateTripSignup] Failed to update trip signup ${id}:`, error);
        return { success: false, error: error instanceof Error ? error.message : 'Update mislukt' };
    }
}

export async function getSignupActivities(signupId: number): Promise<TripSignupActivity[]> {
    await requireBeheerFeature('reis');
    return await fetchSelectedSignupActivitiesDb(signupId);
}

export async function updateSignupActivities(
    signupId: number,
    activityIds: number[]
): Promise<{ success: true } | { success: false; error: string }> {
    await requireBeheerFeature('reis');

    try {
        const current = await getSignupActivities(signupId);
        const currentActivityIds = current.map(a => Number(a.trip_activity_id)).filter(Boolean);
        const toDelete = current.filter(a => a.trip_activity_id && !activityIds.includes(Number(a.trip_activity_id)));

        for (const item of toDelete) {
            if (item.id) {
                await db.delete(schema.trip_signup_activities).where(eq(schema.trip_signup_activities.id, item.id));
            }
        }

        const toAdd = activityIds.filter(id => !currentActivityIds.includes(id));
        for (const activityId of toAdd) {
            await db.insert(schema.trip_signup_activities).values({
                trip_signup_id: signupId,
                trip_activity_id: activityId
            });
        }

        await logAuditAction('admin_trip_signup_activities_updated', 'SUCCESS', {
            context: 'reis',
            signup_id: signupId,
            activity_ids: activityIds
        });

        revalidatePath('/beheer/reis');
        revalidatePath(`/beheer/reis/deelnemer/${signupId}`);
        return { success: true };
    } catch (error) {
        safeConsoleError(`[trip-signups.actions.ts][updateSignupActivities] Failed to update activities for signup ${signupId}:`, error);
        return { success: false, error: error instanceof Error ? error.message : 'Interne serverfout' };
    }
}

export async function getTripSignupActivitiesAction(tripId: number): Promise<EnrichedTripSignupActivity[]> {
    await requireBeheerFeature('reis');
    try {
        return await fetchTripSignupActivitiesDb(tripId);
    } catch (error) {
        safeConsoleError(`[beheer-reis-signups.actions.ts][getTripSignupActivitiesAction] Failed to fetch activities for trip ${tripId}:`, error);
        throw new Error('Kon reisactiviteiten niet ophalen uit de database.');
    }
}

