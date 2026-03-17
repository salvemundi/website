'use server';

import { activiteitenSchema, type Activiteit, eventSignupFormSchema, type EventSignupForm, attendanceSchema, activitiesResponseSchema } from '@salvemundi/validations';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { revalidateTag } from 'next/cache';

const getFinanceServiceUrl = () =>
    process.env.INTERNAL_FINANCE_URL || 'http://v7-acc-finance-service:3001';

const getMailServiceUrl = () =>
    process.env.INTERNAL_MAIL_URL || 'http://v7-acc-mail-service:3002';

// Intern Directus adres — nooit hardcoded, altijd via env
const getDirectusUrl = () =>
    process.env.INTERNAL_DIRECTUS_URL || 'http://v7-core-directus:8055';

// Service token voor interne Directus API-aanroepen.
const getDirectusHeaders = (): HeadersInit => {
    const token = process.env.DIRECTUS_STATIC_TOKEN;
    if (!token) {
        console.warn('[Activities] DIRECTUS_STATIC_TOKEN missing.');
    }
    return {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
    };
};

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
 * Features 'use cache' to ensure static rendering & caching
 */
export async function getActivities(): Promise<Activiteit[]> {
    // 'use cache'; // Temporarily disabled if causing issues with fetch

    try {
        const directusUrl = getDirectusUrl();
        const headers = getDirectusHeaders();
        if (!headers) return [];

        // Collectie heet 'events' op de VPS.
        const fields = '*,committee_id.name';
        const url = `${directusUrl}/items/events?fields=${fields}&limit=-1&filter[status][_eq]=published`;

        const response = await fetch(url, {
            headers,
        });

        if (!response.ok) {
            console.error(`[Activities] Fetch failed with status: ${response.status} for ${url}`);
            await response.text(); // Consume body to prevent hanging promises
            return [];
        }

        const json = await response.json();
        type RawEvent = {
            id?: string | number;
            name?: string | null;
            description?: string | null;
            location?: string | null;
            event_date?: string | null;
            event_date_end?: string | null;
            image?: string | null;
            status?: string | null;
            price_members?: number | string | null;
            price_non_members?: number | string | null;
            only_members?: boolean | null;
            inschrijf_deadline?: string | null;
            contact?: string | null;
            event_time?: string | null;
            event_time_end?: string | null;
            committee_id?: { name?: string | null } | any;
        };
        const rawData: RawEvent[] = json?.data ?? [];

        // Mapping van DB velden ('events') naar Zod Schema velden ('Activiteit')
        const mappedData = rawData.map((item) => ({
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
    const directusUrl = getDirectusUrl();
    const fields = '*,committee_id.*';
    const url = `${directusUrl}/items/events/${id}?fields=${fields}`;

    try {
        const response = await fetchWithTimeout(url, {
            headers: getDirectusHeaders(),
            next: { tags: [`activity-${id}`] }
        });

        if (!response.ok) return null;

        const json = await response.json();
        const item = json?.data;
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

        const directusUrl = getDirectusUrl();
        
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
        const signupUrl = `${directusUrl}/items/event_signups`;
        const qrToken = `r-${parsed.data.event_id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const signupRes = await fetchWithTimeout(signupUrl, {
            method: 'POST',
            headers: getDirectusHeaders(),
            body: JSON.stringify({
                event_id: parsed.data.event_id,
                participant_name: parsed.data.name,
                participant_email: parsed.data.email,
                participant_phone: parsed.data.phoneNumber,
                user_id: userId || null,
                payment_status: (price ?? 0) > 0 ? 'open' : 'paid',
                qr_token: qrToken
            })
        });

        if (!signupRes.ok) throw new Error('Kon inschrijving niet opslaan');
        const signupJson = await signupRes.json();
        const signupId = signupJson.data.id;

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
                    redirectUrl: `${process.env.PUBLIC_URL || 'http://localhost:3000'}/activiteiten/bevestiging?id=${signupId}`
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
    // Auth check should ideally be done here too
    const directusUrl = getDirectusUrl();
    const url = `${directusUrl}/items/event_signups?filter[event_id][_eq]=${eventId}&fields=*,user_id.display_name`;

    try {
        const response = await fetchWithTimeout(url, {
            headers: getDirectusHeaders(),
            next: { tags: [`signups-${eventId}`] }
        });

        if (!response.ok) return [];
        const json = await response.json();
        return json.data || [];
    } catch (error) {
        console.error(`[Activities] Error fetching signups for ${eventId}:`, error);
        return [];
    }
}

/**
 * Toggle check-in status
 */
export async function toggleCheckIn(signupId: number, status: boolean) {
    const directusUrl = getDirectusUrl();
    const url = `${directusUrl}/items/event_signups/${signupId}`;

    try {
        const response = await fetchWithTimeout(url, {
            method: 'PATCH',
            headers: getDirectusHeaders(),
            body: JSON.stringify({ 
                checked_in: status,
                checked_in_at: status ? new Date().toISOString() : null
            })
        });

        if (response.ok) {
            const json = await response.json();
            const signup = json.data;
            if (signup) {
                revalidateTag(`signups-${signup.event_id}`, 'default');
            }
            return { success: true };
        }
        return { success: false };
    } catch (error) {
        console.error(`[Activities] Error toggling check-in for ${signupId}:`, error);
        return { success: false };
    }
}
