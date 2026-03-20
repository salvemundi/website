'use server';

import { activiteitenSchema, type Activiteit, eventSignupFormSchema, type EventSignupForm } from '@salvemundi/validations';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { revalidateTag } from 'next/cache';

import { directus } from '@/lib/directus';
import { readItems, createItem, updateItem } from '@directus/sdk';

const getFinanceServiceUrl = () =>
    process.env.INTERNAL_FINANCE_URL;

const getMailServiceUrl = () =>
    process.env.INTERNAL_MAIL_URL;

const getInternalHeaders = () => {
    const token = process.env.INTERNAL_SERVICE_TOKEN;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
};

/**
 * Helper voor Fetch met timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number } = {}) {
    const { timeout = 10000, ...fetchOptions } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal,
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

/**
 * Fetch all upcoming and past activities
 */
export async function getActivities(): Promise<Activiteit[]> {
    try {
        const events: any = await directus.request(readItems('events' as any, {
            fields: ['*', { committee_id: ['name'] }] as any,
            filter: { status: { _eq: 'published' } },
            limit: -1
        }));

        const mappedData = events.map((item: any) => ({
            id: String(item.id ?? ''),
            titel: item.name ?? '',
            beschrijving: item.description ?? null,
            locatie: item.location ?? null,
            datum_start: item.event_date ? new Date(item.event_date).toISOString() : new Date().toISOString(),
            datum_eind: item.event_date_end ? new Date(item.event_date_end).toISOString() : null,
            afbeelding_id: item.image ?? null,
            status: item.status ?? undefined,
            price_members: item.price_members != null ? Number(item.price_members) : 0,
            price_non_members: item.price_non_members != null ? Number(item.price_non_members) : 0,
            only_members: item.only_members ?? false,
            inschrijf_deadline: item.inschrijf_deadline ?? null,
            contact: item.contact ?? null,
            event_time: item.event_time ?? null,
            event_time_end: item.event_time_end ?? null,
            committee_name: item.committee_id?.name || null,
        }));

        const parsed = activiteitenSchema.safeParse(mappedData);
        if (!parsed.success) {
            console.error('[Activities] Zod validation failed:', parsed.error.flatten().fieldErrors);
            return [];
        }

        return parsed.data;
    } catch (error) {
        console.error('[Activities] Error fetching activities:', error);
        return [];
    }
}

/**
 * Fetch a single activity by ID
 */
export async function getActivityById(id: string): Promise<Activiteit | null> {
    try {
        const items: any = await directus.request(readItems('events' as any, {
            fields: ['*', { committee_id: ['*'] }] as any,
            filter: { id: { _eq: id } },
            limit: 1
        }));
        
        const item = items?.[0];
        if (!item) return null;

        const mapped = {
            id: String(item.id ?? ''),
            titel: item.name ?? '',
            beschrijving: item.description ?? null,
            locatie: item.location ?? null,
            datum_start: item.event_date ? new Date(item.event_date).toISOString() : new Date().toISOString(),
            datum_eind: item.event_date_end ? new Date(item.event_date_end).toISOString() : null,
            afbeelding_id: item.image ?? null,
            status: item.status ?? undefined,
            price_members: item.price_members != null ? Number(item.price_members) : 0,
            price_non_members: item.price_non_members != null ? Number(item.price_non_members) : 0,
            only_members: item.only_members ?? false,
            inschrijf_deadline: item.inschrijf_deadline ?? null,
            contact: item.contact ?? null,
            event_time: item.event_time ?? null,
            event_time_end: item.event_time_end ?? null,
            committee_name: item.committee_id?.name || null,
        };

        const parsed = activiteitenSchema.element.safeParse(mapped);
        return parsed.success ? parsed.data : null;
    } catch (error) {
        console.error(`[Activities] Error fetching activity ${id}:`, error);
        return null;
    }
}

/**
 * Handle signup for an activity
 */
export async function signupForActivity(data: EventSignupForm) {
    // 1. Validation
    const parsed = eventSignupFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, errors: parsed.error.flatten().fieldErrors };
    }

    // 2. Honeypot check
    if (parsed.data.website) {
        return { success: false, error: 'Spam gedetecteerd' };
    }

    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        const userId = session?.user?.id;

        // 3. Fetch activity to check price and membership
        const activity = await getActivityById(String(parsed.data.event_id));
        if (!activity) return { success: false, error: 'Activiteit niet gevonden' };

        if (activity.only_members && !userId) {
            return { success: false, error: 'Deze activiteit is alleen voor leden.' };
        }

        const user = session?.user as any;
        const isMember = user?.membership_status === 'active';
        const price = (isMember ? activity.price_members : activity.price_non_members) ?? 0;

        // 4. Create signup in Directus
        const qrToken = `r-${parsed.data.event_id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const signup: any = await directus.request(createItem('event_signups' as any, {
            event_id: parsed.data.event_id,
            participant_name: parsed.data.name,
            participant_email: parsed.data.email,
            participant_phone: parsed.data.phoneNumber,
            user_id: userId || null,
            payment_status: (price ?? 0) > 0 ? 'open' : 'paid',
            qr_token: qrToken
        }));

        const signupId = signup.id;

        // 5. Trigger service (Finance or Mail)
        if ((price ?? 0) > 0) {
            const financeUrl = `${getFinanceServiceUrl()}/api/payments/create`;
            const paymentRes = await fetchWithTimeout(financeUrl, {
                method: 'POST',
                headers: getInternalHeaders(),
                body: JSON.stringify({
                    amount: price,
                    description: `Inschrijving: ${activity.titel}`,
                    registrationId: signupId,
                    registrationType: 'event_signup',
                    email: parsed.data.email,
                    firstName: parsed.data.name,
                    isContribution: false,
                    redirectUrl: `${process.env.PUBLIC_URL}/activiteiten/bevestiging?id=${signupId}`
                })
            });
            const paymentData = await paymentRes.json();
            if (paymentRes.ok && paymentData.checkoutUrl) {
                return { success: true, checkoutUrl: paymentData.checkoutUrl };
            }
            return { success: false, error: paymentData.error || 'Betaalservice fout' };
        } else {
            // Free event, trigger mail service directly
            const mailUrl = `${getMailServiceUrl()}/api/mail/send`;
            await fetchWithTimeout(mailUrl, {
                method: 'POST',
                headers: getInternalHeaders(),
                body: JSON.stringify({
                    to: parsed.data.email,
                    template: 'event-ticket',
                    data: {
                        name: parsed.data.name,
                        eventName: activity.titel,
                        eventDate: activity.datum_start,
                        signupId: signupId
                    }
                })
            }).catch(e => console.error('[Activities] Mail trigger failed:', e));
            
            return { success: true, message: 'Inschrijving geslaagd!' };
        }

    } catch (error) {
        console.error('[Activities] Signup error:', error);
        return { success: false, error: 'Er is een fout opgetreden bij de inschrijving.' };
    }
}

/**
 * Get all signups for an activity (Admin only)
 */
export async function getActivitySignups(eventId: string) {
    try {
        return await directus.request(readItems('event_signups' as any, {
            filter: { event_id: { _eq: eventId } },
            fields: ['*', { user_id: ['display_name'] }] as any
        }));
    } catch (error) {
        console.error(`[Activities] Error fetching signups for ${eventId}:`, error);
        return [];
    }
}

/**
 * Toggle check-in status
 */
export async function toggleCheckIn(signupId: number, status: boolean) {
    try {
        const signup: any = await directus.request(updateItem('event_signups' as any, signupId, { 
            checked_in: status,
            checked_in_at: status ? new Date().toISOString() : null
        }));

        if (signup) {
            revalidateTag(`signups-${signup.event_id}`, 'default');
        }
        return { success: true };
    } catch (error) {
        console.error(`[Activities] Error toggling check-in for ${signupId}:`, error);
        return { success: false };
    }
}

/**
 * Fetches the current payment and registration status for a given signup.
 */
export async function getSignupStatus(id?: string, transactionId?: string) {
    if (transactionId) {
        try {
            const transactions: any = await directus.request(readItems('transactions' as any, {
                fields: ['id', 'payment_status', 'registration_id', 'registration_type'] as any,
                filter: { id: { _eq: transactionId } },
                limit: 1
            }));
            const trans = transactions?.[0];

            if (!trans) return { status: 'error' };

            if (trans.registration_type === 'event_signup') {
                const signups: any = await directus.request(readItems('event_signups' as any, {
                    fields: ['*', { event_id: ['*'] }] as any,
                    filter: { id: { _eq: trans.registration_id } },
                    limit: 1
                }));
                const signup = signups?.[0];
                return { status: trans.payment_status, signup, transaction: trans };
            } else if (trans.registration_type === 'pub_crawl_signup') {
                const signups: any = await directus.request(readItems('pub_crawl_signups' as any, {
                    fields: ['*', { pub_crawl_event_id: ['*'] }, { tickets: ['*'] }] as any,
                    filter: { id: { _eq: trans.registration_id } },
                    limit: 1
                }));
                const signup = signups?.[0];
                if (signup) {
                    signup.amount_tickets = signup.tickets?.length || 1;
                }
                return { status: trans.payment_status, signup, transaction: trans };
            } else if (trans.registration_type === 'membership') {
                return { status: trans.payment_status, transaction: trans, isMembership: true };
            }
            return { status: trans.payment_status, transaction: trans };
        } catch (e) {
            console.error('[Activities] Error resolving transaction:', e);
            return { status: 'error' };
        }
    } else if (id) {
        try {
            const signups: any = await directus.request(readItems('event_signups' as any, {
                fields: ['*', { event_id: ['*'] }] as any,
                filter: { id: { _eq: id } },
                limit: 1
            }));
            const signup = signups?.[0];
            if (!signup) return { status: 'error' };
            return { status: signup.payment_status || 'open', signup };
        } catch (e) {
            console.error('[Activities] Error fetching signup status:', e);
            return { status: 'error' };
        }
    }

    return { status: 'error' };
}

/**
 * Retrieves all valid (paid) tickets for the authenticated user.
 */
export async function getMyTickets() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return [];

    try {
        return await directus.request(readItems('event_signups' as any, {
            filter: { 
                user_id: { _eq: session.user.id },
                payment_status: { _eq: 'paid' }
            },
            fields: ['*', { event_id: ['*'] }] as any,
            sort: ['-date_created'] as any
        }));
    } catch (error) {
        console.error('[Activities] Error fetching user tickets:', error);
        return [];
    }
}
