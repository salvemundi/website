'use server'

import { revalidatePath } from 'next/cache';
import { verifySignupAccess, verifyPaymentAccess } from '@/shared/lib/utils/security';
import { PaymentStatusResponse } from '@/shared/lib/api/payment-types';

export interface PaymentPageData {
    signup: any;
    trip: any;
    activities: any[];
    selectedActivities: any[];
    activityOptions: Record<number, string[]>;
}

export async function getPaymentPageData(signupId: number, token?: string): Promise<{ success: boolean; data?: PaymentPageData; error?: string; status?: number }> {
    try {
        const directusUrl = (process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://admin.salvemundi.nl').replace(/\/$/, '');
        const adminToken = process.env.DIRECTUS_ADMIN_TOKEN;

        if (!adminToken) {
            console.error('[getPaymentPageData] Missing Admin Token');
            return { success: false, error: 'Server configuratiefout', status: 500 };
        }

        // 1. Authentication Check
        let isAuthorized = false;

        // Check Session
        const { getUserClient } = await import('@/shared/lib/directus-clients');
        const { readMe } = await import('@directus/sdk');
        const userClient = await getUserClient();
        let currentUserEmail: string | null = null;

        if (userClient) {
            try {
                const currentUser = await userClient.request(readMe({ fields: ['email'] }));
                if (currentUser?.email) {
                    currentUserEmail = currentUser.email;
                }
            } catch (e) {
                // Session invalid or expired
            }
        }

        // Fetch Signup first to verify ownership (using admin token to peek)
        const signupResp = await fetch(`${directusUrl}/items/trip_signups/${signupId}?fields=*`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            next: { revalidate: 0 }
        });

        if (!signupResp.ok) {
            if (signupResp.status === 404 || signupResp.status === 403) {
                return { success: false, error: 'Aanmelding niet gevonden', status: 404 };
            }
            console.error('[getPaymentPageData] Signup fetch failed', signupResp.status);
            return { success: false, error: 'Fout bij ophalen aanmelding', status: 500 };
        }

        const { data: signup } = await signupResp.json();

        // 2. Authorization Logic
        // Strategy A: Session Match
        // Ensure both are strings for comparison
        if (currentUserEmail && String(signup.email) === String(currentUserEmail)) {
            isAuthorized = true;
        }

        // Strategy B: Token Match (Magic Link)
        if (!isAuthorized && token) {
            // Verify if token is valid signature for this ID
            const isValidToken = verifySignupAccess(signupId, token);
            if (isValidToken) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            // Differentiate between "Not Found" and "Unauthorized" to avoid leaking existence?
            // For now, consistent "Unauthorized"
            console.warn(`[getPaymentPageData] Unauthorized access attempt for signup ${signupId}. Email: ${currentUserEmail}, Token provided: ${!!token}`);
            return { success: false, error: 'Geen toegang tot deze aanmelding', status: 403 };
        }

        // 3. Data Fetching (Parallel)
        const [tripResp, activitiesResp, signupActivitiesResp] = await Promise.all([
            fetch(`${directusUrl}/items/trips/${signup.trip_id}?fields=*`, {
                headers: { 'Authorization': `Bearer ${adminToken}` },
                next: { revalidate: 3600 }
            }),
            fetch(`${directusUrl}/items/trip_activities?filter[trip_id][_eq]=${signup.trip_id}&filter[is_active][_eq]=true&sort=display_order,name&fields=*,options,max_selections`, {
                headers: { 'Authorization': `Bearer ${adminToken}` },
                next: { revalidate: 3600 }
            }),
            fetch(`${directusUrl}/items/trip_signup_activities?filter[trip_signup_id][_eq]=${signupId}&fields=id,selected_options,trip_activity_id.*`, {
                headers: { 'Authorization': `Bearer ${adminToken}` },
                next: { revalidate: 0 }
            })
        ]);

        const tripData = tripResp.ok ? (await tripResp.json()).data : null;
        const activitiesData = activitiesResp.ok ? (await activitiesResp.json()).data : [];
        const signupActivities = signupActivitiesResp.ok ? (await signupActivitiesResp.json()).data : [];

        // Transform signupActivities to easy format
        const selectedActivities: number[] = [];
        const activityOptions: Record<number, string[]> = {};

        signupActivities.forEach((sa: any) => {
            const actId = sa.trip_activity_id?.id || sa.trip_activity_id;
            selectedActivities.push(actId);
            if (sa.selected_options) {
                activityOptions[actId] = sa.selected_options;
            }
        });

        return {
            success: true,
            data: {
                signup,
                trip: tripData,
                activities: activitiesData,
                selectedActivities,
                activityOptions
            }
        };

    } catch (e: any) {
        console.error('[getPaymentPageData] Critical error:', e);
        return { success: false, error: 'Onverwachte serverfout', status: 500 };
    }
}

export async function generateMagicLink(signupId: number): Promise<string | null> {
    try {
        const { signSignupAccess } = await import('@/shared/lib/utils/security');
        const token = signSignupAccess(signupId);

        // Base URL logic - prefer configured public URL
        const baseUrl = process.env.NEXT_PUBLIC_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
        return `${baseUrl}/reis/aanbetaling/${signupId}?token=${token}`;
    } catch (error) {
        console.error('Error generating magic link:', error);
        return null;
    }
}

// ... imports

// ... existing code ...

const registerSchema = z.object({
    trip_id: z.number(),
    first_name: z.string().min(2, 'Voornaam is verplicht'),
    middle_name: z.string().optional(),
    last_name: z.string().min(2, 'Achternaam is verplicht'),
    email: z.string().email('Ongeldig e-mailadres'),
    phone_number: z.string().min(10, 'Geldig telefoonnummer is verplicht'),
    date_of_birth: z.string().optional(),
    terms_accepted: z.boolean().refine(val => val === true, { message: 'Je moet akkoord gaan met de voorwaarden' }),
});

import { z } from 'zod';

// ... existing code ...

export async function updateTripSignup(id: number, data: any, token?: string) {
    try {
        const directusUrl = (process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://admin.salvemundi.nl').replace(/\/$/, '');
        const adminToken = process.env.DIRECTUS_ADMIN_TOKEN; // Use Admin Token for updates if authorized

        if (!adminToken) {
            console.error('[updateTripSignup] Missing Admin Token');
            return { success: false, error: 'Server configuratiefout' };
        }

        // 1. Authentication & Authorization
        let isAuthorized = false;

        // Check Session
        const { getUserClient } = await import('@/shared/lib/directus-clients');
        const { readMe } = await import('@directus/sdk');
        const userClient = await getUserClient();
        let currentUserEmail: string | null = null;

        if (userClient) {
            try {
                const currentUser = await userClient.request(readMe({ fields: ['email'] }));
                if (currentUser?.email) {
                    currentUserEmail = currentUser.email;
                }
            } catch (e) { }
        }

        // Fetch existing signup to check ownership
        const existingSignupResp = await fetch(`${directusUrl}/items/trip_signups/${id}?fields=email`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!existingSignupResp.ok) {
            return { success: false, error: 'Kan aanmelding niet vinden' };
        }

        const existingSignup = (await existingSignupResp.json()).data;

        // Verify matches
        if (currentUserEmail && String(existingSignup.email) === String(currentUserEmail)) {
            isAuthorized = true;
        }

        // Token Match
        if (!isAuthorized && token) {
            if (verifySignupAccess(id, token)) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return { success: false, error: 'Je hebt geen rechten om deze aanmelding te wijzigen' };
        }

        // 2. Update Data
        const payload = {
            first_name: data.first_name,
            middle_name: data.middle_name,
            last_name: data.last_name,
            date_of_birth: data.date_of_birth,
            id_document_type: data.id_document_type,
            id_document: data.id_document_type,
            document_number: data.document_number,
            allergies: data.allergies,
            alergies: data.allergies,
            special_notes: data.special_notes,
            willing_to_drive: data.willing_to_drive,
            email: data.email,
            phone_number: data.phone_number
        };

        // Remove undefined values
        Object.keys(payload).forEach(key => (payload as any)[key] === undefined && delete (payload as any)[key]);

        const response = await fetch(`${directusUrl}/items/trip_signups/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('[updateTripSignup] Directus error:', response.status, text);
            return { success: false, error: `Opslaan mislukt: ${response.statusText}` };
        }

        revalidatePath(`/reis/aanbetaling/${id}`);
        revalidatePath(`/reis/restbetaling/${id}`);

        return { success: true };

    } catch (e: any) {
        console.error('[updateTripSignup] Unexpected error:', e);
        return { success: false, error: e.message || 'Onverwachte fout opgetreden' };
    }
}

export async function updateTripActivities(signupId: number, selectedActivities: number[], activityOptions: Record<number, string[]>, token?: string) {
    try {
        const directusUrl = (process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://admin.salvemundi.nl').replace(/\/$/, '');
        const adminToken = process.env.DIRECTUS_ADMIN_TOKEN;

        if (!adminToken) return { success: false, error: 'Server configuration error' };

        // 1. Authorization (Same logic as updateTripSignup)
        const { getUserClient } = await import('@/shared/lib/directus-clients');
        const { readMe } = await import('@directus/sdk');
        let isAuthorized = false;

        const userClient = await getUserClient();
        let currentUserEmail = null;
        if (userClient) {
            try {
                const u = await userClient.request(readMe({ fields: ['email'] }));
                currentUserEmail = u?.email;
            } catch (e) { }
        }

        const checkResp = await fetch(`${directusUrl}/items/trip_signups/${signupId}?fields=email`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (!checkResp.ok) return { success: false, error: 'Signup not found' };
        const signup = (await checkResp.json()).data;

        if (currentUserEmail && String(signup.email) === String(currentUserEmail)) isAuthorized = true;
        if (!isAuthorized && token && verifySignupAccess(signupId, token)) isAuthorized = true;

        if (!isAuthorized) return { success: false, error: 'Unauthorized' };

        // 2. Fetch existing activities
        const existingResp = await fetch(`${directusUrl}/items/trip_signup_activities?filter[trip_signup_id][_eq]=${signupId}&fields=id,trip_activity_id,selected_options`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const existing = (await existingResp.json()).data;
        const existingMap = new Map();
        // Note: trip_activity_id might be object or ID. Handle both.
        existing.forEach((e: any) => {
            const aId = typeof e.trip_activity_id === 'object' ? e.trip_activity_id.id : e.trip_activity_id;
            existingMap.set(aId, e);
        });

        // 3. Process Updates
        for (const actId of selectedActivities) {
            const newOptions = activityOptions[actId] || [];
            const existingEntry = existingMap.get(actId);

            if (existingEntry) {
                // Check if options changed
                const oldOptions = existingEntry.selected_options || [];
                const isSame = JSON.stringify(newOptions.slice().sort()) === JSON.stringify(oldOptions.slice().sort());

                if (!isSame) {
                    // Update (or delete+create if Directus is picky, but PATCH should work)
                    await fetch(`${directusUrl}/items/trip_signup_activities/${existingEntry.id}`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${adminToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ selected_options: newOptions })
                    });
                }
                existingMap.delete(actId); // Mark as handled
            } else {
                // Create new
                await fetch(`${directusUrl}/items/trip_signup_activities`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${adminToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        trip_signup_id: signupId,
                        trip_activity_id: actId,
                        selected_options: newOptions
                    })
                });
            }
        }

        // 4. Delete removed
        for (const [_, entry] of existingMap) {
            await fetch(`${directusUrl}/items/trip_signup_activities/${entry.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
        }

        revalidatePath(`/reis/aanbetaling/${signupId}`);
        revalidatePath(`/reis/restbetaling/${signupId}`);
        return { success: true };

    } catch (e: any) {
        console.error('[updateTripActivities] Error:', e);
        return { success: false, error: 'Update failed' };
    }
}

import { isUserInReisCommittee } from '@/shared/lib/committee-utils';

export async function registerForTrip(formData: z.infer<typeof registerSchema>) {
    try {
        const directusUrl = (process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://admin.salvemundi.nl').replace(/\/$/, '');
        const adminToken = process.env.DIRECTUS_ADMIN_TOKEN;

        if (!adminToken) {
            console.error('[registerForTrip] Server configuration error: Admin Token missing');
            return { success: false, error: 'Server configuratiefout. Neem contact op met het bestuur.' };
        }

        // 1. Validation
        const validatedFields = registerSchema.safeParse(formData);
        if (!validatedFields.success) {
            return { success: false, error: 'Ongeldige invoer: ' + validatedFields.error.issues.map(i => i.message).join(', ') };
        }
        const data = validatedFields.data;

        // 2. Duplicate Check (Server-side)
        const duplicateCheckQuery = new URLSearchParams({
            'filter[trip_id][_eq]': String(data.trip_id),
            'filter[email][_eq]': data.email,
            'filter[status][_neq]': 'cancelled',
            'fields': 'id'
        });

        const duplicateResp = await fetch(`${directusUrl}/items/trip_signups?${duplicateCheckQuery}`, {
            headers: { 'Authorization': `Bearer ${adminToken}` },
            cache: 'no-store'
        });

        if (!duplicateResp.ok) return { success: false, error: 'Kon controle op dubbele aanmeldingen niet uitvoeren.' };

        const duplicates = (await duplicateResp.json()).data;
        if (duplicates && duplicates.length > 0) {
            return { success: false, error: 'Er is al een actieve aanmelding gevonden voor dit e-mailadres.' };
        }

        // 3. User Association & Role Determination
        let userId = null;
        let role = 'participant';
        const { getUserClient } = await import('@/shared/lib/directus-clients');
        const { readMe } = await import('@directus/sdk');
        const userClient = await getUserClient();

        if (userClient) {
            try {
                const user = await userClient.request(readMe({
                    fields: ['id']
                }));
                if (user?.id) userId = user.id;

                if (userId) {
                    // Fetch committee members directly from the junction table to ensure accuracy
                    // The user.committees relation is sometimes empty/unreliable
                    const committeeMembers = await fetch(`${directusUrl}/items/committee_members?filter[user_id][_eq]=${userId}&fields=committee_id.commissie_token,committee_id.name,is_leader`, {
                        headers: { 'Authorization': `Bearer ${adminToken}` },
                        cache: 'no-store'
                    }).then(res => res.json()).then(res => res.data);

                    console.log('[registerForTrip] committeeMembers found:', committeeMembers?.length);

                    // Reconstruct a user-like object for the util
                    const shadowUser = {
                        committees: committeeMembers
                    };

                    // Check for crew role
                    const isReis = isUserInReisCommittee(shadowUser);
                    console.log('[registerForTrip] isUserInReisCommittee:', isReis);

                    if (isReis) {
                        role = 'crew';
                        console.log('[registerForTrip] Role set to CREW');
                    } else {
                        console.log('[registerForTrip] Role set to PARTICIPANT');
                    }
                }
            } catch (e: any) {
                console.error('[registerForTrip] Error fetching user for role check:', e);
            }
        }

        // 4. Waitlist Logic
        const tripResp = await fetch(`${directusUrl}/items/trips/${data.trip_id}?fields=max_participants,registration_open`, {
            headers: { 'Authorization': `Bearer ${adminToken}` },
            cache: 'no-store'
        });

        if (!tripResp.ok) return { success: false, error: 'Kon reisgegevens niet ophalen.' };
        const trip = (await tripResp.json()).data;

        if (!trip.registration_open) return { success: false, error: 'Inschrijvingen voor deze reis zijn gesloten.' };

        const countQuery = new URLSearchParams({
            'filter[trip_id][_eq]': String(data.trip_id),
            'filter[status][_in]': 'registered,confirmed',
            'aggregate[count]': '*'
        });

        const countResp = await fetch(`${directusUrl}/items/trip_signups?${countQuery}`, {
            headers: { 'Authorization': `Bearer ${adminToken}` },
            cache: 'no-store'
        });

        let currentCount = 0;
        if (countResp.ok) {
            const countData = (await countResp.json()).data;
            currentCount = Number(countData[0]?.count) || 0;
        }

        const maxParticipants = Number(trip.max_participants) || 0;
        const status = (currentCount >= maxParticipants) ? 'waitlist' : 'registered';

        // 5. Create Signup
        const payload = {
            trip_id: data.trip_id,
            first_name: data.first_name,
            middle_name: data.middle_name,
            last_name: data.last_name,
            email: data.email,
            phone_number: data.phone_number,
            date_of_birth: data.date_of_birth,
            terms_accepted: data.terms_accepted,
            status: status,
            role: role,
            // user_id: userId, // Field doesn't exist in schema
            deposit_paid: false,
            full_payment_paid: false
        };

        const createResp = await fetch(`${directusUrl}/items/trip_signups`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!createResp.ok) {
            const errText = await createResp.text();
            console.error('[registerForTrip] Creation failed:', errText);
            return { success: false, error: 'Kon aanmelding niet verwerken.' };
        }

        const newSignup = (await createResp.json()).data;
        revalidatePath('/reis');
        return { success: true, signupId: newSignup.id, status: status };

    } catch (error: any) {
        console.error('[registerForTrip] Unexpected error:', error);
        return { success: false, error: 'Er is een onverwachte fout opgetreden.' };
    }
}

export async function createTripPayment(signupId: number, type: 'deposit' | 'remainder', token?: string) {
    try {
        const directusUrl = (process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://admin.salvemundi.nl').replace(/\/$/, '');
        const adminToken = process.env.DIRECTUS_ADMIN_TOKEN;
        const baseUrl = process.env.NEXT_PUBLIC_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

        if (!adminToken) return { success: false, error: 'Server configuration error' };

        // 1. Authorization
        const { getUserClient } = await import('@/shared/lib/directus-clients');
        const { readMe } = await import('@directus/sdk');
        let isAuthorized = false;

        const userClient = await getUserClient();
        let currentUserEmail: string | null = null;
        if (userClient) {
            try {
                const u = await userClient.request(readMe({ fields: ['email'] }));
                currentUserEmail = u?.email;
            } catch (e) { }
        }

        const signupResp = await fetch(`${directusUrl}/items/trip_signups/${signupId}?fields=*`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (!signupResp.ok) return { success: false, error: 'Aanmelding niet gevonden' };
        const signupData = await signupResp.json();
        const signup = signupData.data;

        const { verifySignupAccess } = await import('@/shared/lib/utils/security');
        if (currentUserEmail && String(signup.email) === String(currentUserEmail)) isAuthorized = true;
        if (!isAuthorized && token && verifySignupAccess(signupId, token)) isAuthorized = true;

        if (!isAuthorized) return { success: false, error: 'Onbevoegde toegang' };

        // 2. Fetch Trip & Activities for calculation
        const tripResp = await fetch(`${directusUrl}/items/trips/${signup.trip_id}?fields=*`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const tripData = await tripResp.json();
        const trip = tripData.data;

        let amount = 0;
        const description = `${type === 'deposit' ? 'Aanbetaling' : 'Restbetaling'} ${trip.name} - ${signup.first_name}${signup.middle_name ? ' ' + signup.middle_name : ''} ${signup.last_name}`;

        if (type === 'deposit') {
            if (signup.deposit_paid) return { success: false, error: 'Aanbetaling is al voldaan' };
            amount = Number(trip.deposit_amount) || 0;
        } else {
            if (signup.full_payment_paid) return { success: false, error: 'Reis is al volledig betaald' };

            // Calculate Remainder
            const basePrice = Number(trip.base_price) || 0;
            const deposit = Number(trip.deposit_amount) || 0;
            const crewDiscount = signup.role === 'crew' ? (Number(trip.crew_discount) || 0) : 0;

            // Fetch Activities
            const activitiesResp = await fetch(`${directusUrl}/items/trip_signup_activities?filter[trip_signup_id][_eq]=${signupId}&fields=trip_activity_id.id,trip_activity_id.price,trip_activity_id.options,selected_options`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            const signupActivitiesData = await activitiesResp.json();
            const signupActivities = signupActivitiesData.data;

            let activitiesCost = 0;
            signupActivities.forEach((item: any) => {
                const act = item.trip_activity_id;
                // If trip_activity_id is expanded, it's an object. 
                // Note: The previous getPaymentPageData logic mapped it safely.
                // Here we requested fields=trip_activity_id.*, so it should be an object.
                // But let's be safe.
                if (!act || typeof act !== 'object') return;

                activitiesCost += Number(act.price) || 0;

                // Options
                if (item.selected_options && Array.isArray(item.selected_options) && act.options) {
                    item.selected_options.forEach((optName: string) => {
                        const opt = act.options.find((o: any) => o.name === optName);
                        if (opt) activitiesCost += Number(opt.price) || 0;
                    });
                }
            });

            const totalCost = basePrice + activitiesCost - crewDiscount;
            const remaining = Math.max(0, totalCost - deposit);

            // If remaining is 0, we can mark as paid directly.
            if (remaining <= 0) {
                console.log(`[createTripPayment] Remainder is 0 or less (${remaining}), marking as paid.`);
                const updateResp = await fetch(`${directusUrl}/items/trip_signups/${signupId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${adminToken}`
                    },
                    body: JSON.stringify({ full_payment_paid: true })
                });

                if (!updateResp.ok) return { success: false, error: 'Kon aanmelding niet bijwerken' };

                return {
                    success: true,
                    checkoutUrl: `${baseUrl}/reis/restbetaling/${signupId}/betaling${token ? `?token=${token}` : ''}`
                };
            }
            amount = remaining;
        }

        if (amount <= 0) {
            console.log(`[createTripPayment] Amount is 0 or less (${amount}), marking as paid without Mollie.`);

            const markAsPaidPayload = type === 'deposit' ? { deposit_paid: true } : { full_payment_paid: true };

            const updateResp = await fetch(`${directusUrl}/items/trip_signups/${signupId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify(markAsPaidPayload)
            });

            if (!updateResp.ok) {
                console.error('[createTripPayment] Failed to mark as paid for zero-amount:', await updateResp.text());
                return { success: false, error: 'Kon aanmelding niet bijwerken' };
            }

            return {
                success: true,
                checkoutUrl: `${baseUrl}/reis/${type === 'deposit' ? 'aanbetaling' : 'restbetaling'}/${signupId}/betaling${token ? `?token=${token}` : ''}`
            };
        }

        // 3. Create Payment via Finance Service Action
        const { createPaymentAction } = await import('@/shared/api/finance-actions');
        const { signSignupAccess } = await import('@/shared/lib/utils/security');

        // Ensure we have a valid token for the return URL to avoid "Unauthorized" flicker
        // Priority: 1. Passed token, 2. Signup's payment_access_token, 3. Generated HMAC token
        const effectiveToken = token || signup.payment_access_token || signSignupAccess(signupId);

        const paymentResult = await createPaymentAction({
            amount,
            description,
            // Redirect back to the dedicated payment status page
            redirectUrl: `${baseUrl}/reis/${type === 'deposit' ? 'aanbetaling' : 'restbetaling'}/${signupId}/betaling?token=${effectiveToken}`,
            registrationId: signupId,
            registrationType: 'trip_signup',
            email: signup.email || '',
            firstName: signup.first_name,
            lastName: signup.last_name
        });

        if (!paymentResult.success) {
            console.error('[createTripPayment] Payment Service Error:', paymentResult.error);
            return { success: false, error: paymentResult.error || 'Betaling aanmaken mislukt' };
        }

        return { success: true, checkoutUrl: paymentResult.checkoutUrl };

    } catch (e: any) {
        console.error('[createTripPayment] Error:', e);
        return { success: false, error: e.message || 'Kon betaling niet aanmaken' };
    }
}

export async function getPaymentStatusAction(signupId: number, token?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const isAuthorized = await verifyPaymentAccess(signupId, token, 'trip_signup');
        if (!isAuthorized) {
            console.warn(`[getPaymentStatusAction] Unauthorized access for signup ${signupId}`);
            return { success: false, error: 'Geen toegang tot deze betaling' };
        }

        const directusUrl = (process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://admin.salvemundi.nl').replace(/\/$/, '');
        const adminToken = process.env.DIRECTUS_ADMIN_TOKEN;

        const signupResp = await fetch(`${directusUrl}/items/trip_signups/${signupId}?fields=*`, {
            headers: { 'Authorization': `Bearer ${adminToken}` },
            next: { revalidate: 0 }
        });

        if (!signupResp.ok) return { success: false, error: 'Aanmelding niet gevonden' };
        const signup = (await signupResp.json()).data;

        const tripResp = await fetch(`${directusUrl}/items/trips/${signup.trip_id}?fields=*`, {
            headers: { 'Authorization': `Bearer ${adminToken}` },
            next: { revalidate: 3600 }
        });
        const trip = tripResp.ok ? (await tripResp.json()).data : null;

        return {
            success: true,
            data: { signup, trip }
        };
    } catch (error) {
        console.error('[getPaymentStatusAction] Error:', error);
        return { success: false, error: 'Interne serverfout' };
    }
}

export async function checkTripPaymentStatus(signupId: number, token?: string): Promise<PaymentStatusResponse> {
    try {
        const isAuthorized = await verifyPaymentAccess(signupId, token, 'trip_signup');
        if (!isAuthorized) {
            return { status: 'FAILED', error: 'Geen toegang' };
        }

        const directusUrl = (process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://admin.salvemundi.nl').replace(/\/$/, '');
        const adminToken = process.env.DIRECTUS_ADMIN_TOKEN;

        const resp = await fetch(`${directusUrl}/items/trip_signups/${signupId}?fields=deposit_paid`, {
            headers: { 'Authorization': `Bearer ${adminToken}` },
            next: { revalidate: 0 }
        });

        if (!resp.ok) return { status: 'PENDING' };
        const { data: signup } = await resp.json();

        if (signup.deposit_paid) {
            revalidatePath(`/reis/aanbetaling/${signupId}`);
            return { status: 'SUCCESS' };
        }

        return { status: 'PENDING' };
    } catch (error) {
        console.error('[checkTripPaymentStatus] Error:', error);
        return { status: 'PENDING' };
    }
}
