'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
    tripSignupSchema,
    tripSignupActivitySchema,
    type TripSignup
} from '@salvemundi/validations/schema/admin-reis.zod';
import { requireAdminResource } from '@/server/auth/auth-utils';
import { AdminResource } from '@/shared/lib/permissions-config';
import {
    fetchAllTripSignupsDb,
    fetchTripSignupByIdDb,
    fetchTripSignupActivitiesDb,
    updateTripSignupDb,
    deleteTripSignupDb,
    fetchSelectedSignupActivitiesDb,
    fetchTripByIdDb
} from '@/server/internal/reis-db.utils';
import { getSystemDirectus } from '@/lib/directus';
import {
    updateItem,
    deleteItem,
    createItem
} from '@directus/sdk';
import { normalizeDate } from '@/lib/utils/date-utils';

export async function getTripSignups(tripId: number) {
    await requireAdminResource(AdminResource.Reis);
    try {
        return await fetchAllTripSignupsDb(tripId);
    } catch (_error) {

        return [];
    }
}

export async function getTripSignup(id: number): Promise<TripSignup | null> {
    await requireAdminResource(AdminResource.Reis);
    try {
        return await fetchTripSignupByIdDb(id);
    } catch (_error) {

        return null;
    }
}

export async function updateSignupStatus(signupId: number, status: string) {
    await requireAdminResource(AdminResource.Reis);

    try {
        const signup = await fetchTripSignupByIdDb(signupId);
        if (!signup) throw new Error('Aanmelding niet gevonden');

        const oldStatus = signup.status;

        const success = await updateTripSignupDb(signupId, { status });
        if (!success) throw new Error('Database update mislukt');

        // Shadow Write (Directus)
        getSystemDirectus().request(updateItem('trip_signups', signupId, { status })).catch(() => {

        });

        // 4. Trigger Email if status changed TO confirmed
        if (status === 'confirmed' && oldStatus !== 'confirmed' && signup?.email) {
            const mailUrl = process.env.MAIL_SERVICE_URL;
            const token = process.env.INTERNAL_SERVICE_TOKEN;

            if (mailUrl && token) {
                // Fetch trip name for a better email experience
                let tripName = 'de reis';
                try {
                    const trip = await fetchTripByIdDb(signup.trip_id);
                    if (trip?.name) {
                        tripName = trip.name;
                    }
                } catch (_error) {
                    // Fallback to default
                }

                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://salvemundi.nl';
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
                }).catch(() => { });
            }
        }

        const { revalidatePath, revalidateTag } = await import('next/cache');
        revalidateTag('reis-status', 'max');

        revalidatePath('/beheer/reis');
        revalidatePath('/reis');

        return { success: true };
    } catch {

        return { success: false, error: 'Update mislukt' };
    }
}

export async function deleteTripSignup(signupId: number) {
    await requireAdminResource(AdminResource.Reis);

    try {
        const success = await deleteTripSignupDb(signupId);
        if (!success) throw new Error('Database delete mislukt');

        getSystemDirectus().request(deleteItem('trip_signups', signupId)).catch(() => {

        });

        const { revalidatePath, revalidateTag } = await import('next/cache');
        revalidateTag('reis-status', 'max');

        revalidatePath('/beheer/reis');
        revalidatePath('/reis');

        return { success: true };
    } catch {

        return { success: false, error: 'Verwijderen mislukt' };
    }
}

export async function updateTripSignup(prevState: unknown, formData: FormData) {
    await requireAdminResource(AdminResource.Reis);

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
        return { success: false, error: 'Sommige velden zijn niet correct ingevuld. Controleer het formulier.', fieldErrors: validated.error.flatten().fieldErrors, initialData: rawData };
    }

    try {
        const success = await updateTripSignupDb(id, validated.data);
        if (!success) throw new Error('Database update mislukt');

        getSystemDirectus().request(updateItem('trip_signups', id, validated.data)).catch(() => {

        });

        const { revalidatePath, revalidateTag } = await import('next/cache');
        revalidateTag('reis-status', 'max');

        revalidatePath('/beheer/reis');
        revalidatePath(`/beheer/reis/deelnemer/${id}`);
        revalidatePath('/reis');

        return { success: true };
    } catch {

        return { success: false, error: 'Update mislukt' };
    }
}

export async function getSignupActivities(signupId: number) {
    await requireAdminResource(AdminResource.Reis);
    try {
        const activities = await fetchSelectedSignupActivitiesDb(signupId);
        const parsed = z.array(tripSignupActivitySchema).safeParse(activities);

        if (!parsed.success) {

            return [];
        }

        return parsed.data;
    } catch (_error) {

        return [];
    }
}



export async function updateSignupActivities(signupId: number, activityIds: number[]) {
    await requireAdminResource(AdminResource.Reis);

    try {
        const client = getSystemDirectus();

        const current = await getSignupActivities(signupId);
        const currentIds = current.map(a => typeof a.trip_activity_id === 'object' ? Number(a.trip_activity_id.id) : Number(a.trip_activity_id));

        const toDelete = current.filter(a => {
            const activityId = typeof a.trip_activity_id === 'object' ? a.trip_activity_id.id : a.trip_activity_id;
            return !activityIds.includes(Number(activityId));
        });

        for (const item of toDelete) {
            if (item.id) {
                await client.request(deleteItem('trip_signup_activities', item.id));
            }
        }

        const toAdd = activityIds.filter(id => !currentIds.includes(id));
        for (const activityId of toAdd) {
            await client.request(createItem('trip_signup_activities', {
                trip_signup_id: signupId,
                trip_activity_id: activityId
            }));
        }

        revalidatePath('/beheer/reis');
        revalidatePath(`/beheer/reis/deelnemer/${signupId}`);
        return { success: true };
    } catch {

        return { success: false, error: 'Internal server error' };
    }
}


/**
 * Fetches all activity selections for a specific trip directly from the database.
 */
export async function getTripSignupActivitiesAction(tripId: number) {
    await requireAdminResource(AdminResource.Reis);
    try {
        return await fetchTripSignupActivitiesDb(tripId);
    } catch (_error) {

        return [];
    }
}
