import 'server-only';
import { pool } from '@/lib/database/db';
import { getActivities, getActivityById, signupForActivityForUser, checkUserSignupStatus } from '@/server/services/activity-registration';
import { getTicketsForEmail } from '@/server/services/member-tickets';
import { updateUserProfileForUser } from '@/server/services/member-profile';
import { amsterdamToUTC } from '@/lib/utils/date-utils';
import { MobileError, mobileResponse, readMobileJSON } from './http';
import { requireMobileUser, type MobileUser } from './session';
import type { Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { z } from 'zod';
import { limitMobileUser } from './limits';
import { getFinanceServiceUrl, getInternalHeaders, fetchWithTimeout } from '@/server/internal/activiteiten/activiteiten.utils';

function origin(): string { return 'https://acc.salvemundi.nl'; }
function eventISO(date?: string | null, time?: string | null): string | null {
    if (!date) return null;
    if (time) return amsterdamToUTC(`${date.slice(0, 10)}T${time.slice(0, 8)}`);
    return amsterdamToUTC(date.includes('T') ? date : `${date.slice(0,10)}T00:00:00`);
}
function activityDTO(activity: Activiteit) {
    const image = typeof activity.image === 'string' ? activity.image : activity.image?.id;
    return {
        id: `event:${activity.id}`, title: activity.name,
        description: activity.description || activity.short_description || null,
        startsAt: eventISO(activity.event_date, activity.event_time), endsAt: eventISO(activity.event_date_end, activity.event_time_end),
        location: activity.location || null, imageURL: image ? `${origin()}/api/assets/${image}` : null,
        memberPriceCents: Math.round(Number(activity.price_members || 0) * 100), guestPriceCents: Math.round(Number(activity.price_non_members || 0) * 100),
        membersOnly: Boolean(activity.only_members), registrationDeadline: activity.registration_deadline ? amsterdamToUTC(activity.registration_deadline) : null,
        capacity: activity.max_sign_ups ?? null, signupCount: activity.signup_count ?? null,
        kind: 'event', registrationViaWebsite: Boolean(activity.custom_url), websiteURL: `${origin()}/activiteiten/${activity.id}`
    };
}
export async function mobileActivities() {
    const activities = await getActivities();
    // Never leak scheduled/unpublished events, even if queries change later.
    const published = activities.filter(a => a.status === 'published' && (!a.publish_date || new Date(amsterdamToUTC(a.publish_date) || a.publish_date).getTime() <= Date.now()));
    return mobileResponse(published.map(activityDTO).sort((a,b) => (a.startsAt || '').localeCompare(b.startsAt || '')));
}
export async function publishedActivity(id: string) {
    const match = id.match(/^event:([1-9]\d*)$/);
    if (!match) throw new MobileError('not_found', 'Activiteit niet gevonden.', 404);
    const activity = await getActivityById(match[1]);
    if (!activity || activity.status !== 'published' || (activity.publish_date && new Date(amsterdamToUTC(activity.publish_date) || activity.publish_date).getTime() > Date.now())) {
        throw new MobileError('not_found', 'Activiteit niet gevonden.', 404);
    }
    return activity;
}
export async function mobileActivity(id: string) { return mobileResponse(activityDTO(await publishedActivity(id))); }
export async function registerMobileActivity(request: Request, id: string) {
    const user = await requireMobileUser(request);
    await limitMobileUser(user.id, 'registration');
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json') || Object.keys(await readMobileJSON(request)).length !== 0) throw new MobileError('invalid_request', 'Ongeldig inschrijfverzoek.');
    const activity = await publishedActivity(id);
    if (activity.custom_url) throw new MobileError('website_required', 'Schrijf je voor deze activiteit in via de website.', 409);
    const existing = await checkUserSignupStatus(Number(activity.id), user.email, user.id);
    // A retry after an interrupted response must not create another booking/payment.
    if (existing.isSignedUp && existing.id) {
        const payment = await pool.query<{ access_token: string | null }>(
            `SELECT access_token FROM transactions WHERE registration=$1 AND user_id=$2 ORDER BY id DESC LIMIT 1`, [existing.id, user.id]
        );
        let checkoutURL: string | null = null;
        let status = existing.paymentStatus;
        if (existing.paymentStatus === 'open' && !payment.rows.at(0)?.access_token) throw new MobileError('payment_pending', 'Je betaling wordt voorbereid. Wacht even en probeer opnieuw.', 503);
        if (existing.paymentStatus === 'open' && payment.rows[0]?.access_token) {
            const response = await fetchWithTimeout(`${getFinanceServiceUrl()}/api/finance/status/${payment.rows[0].access_token}`, { headers: getInternalHeaders(), cache: 'no-store' });
            if (!response.ok) throw new MobileError('payment_unavailable', 'Betaling is tijdelijk niet beschikbaar. Probeer opnieuw.', 503);
            const current = await response.json() as { checkout_url?: string | null; payment_status?: string };
            checkoutURL = current.checkout_url || null; status = current.payment_status || status;
            if (status === 'open' && !checkoutURL) throw new MobileError('payment_pending', 'Je betaling wordt voorbereid. Wacht even en probeer opnieuw.', 503);
        }
        return mobileResponse({ registrationID: String(existing.id), checkoutURL, status });
    }
    const result = await signupForActivityForUser({
        event_id: Number(activity.id), name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Lid',
        email: user.email, phoneNumber: /^\+[1-9][0-9\s\-()]{6,14}$/.test(user.phone_number || '') ? String(user.phone_number) : ''
    }, { user }, `${origin()}/api/mobile/v1/payment-return`);
    if (!result.success) {
        const fieldErrors = 'errors' in result && result.errors ? Object.values(result.errors as Record<string, string[] | undefined>).flat().filter(Boolean) : [];
        throw new MobileError('registration_failed', 'error' in result && result.error ? result.error : fieldErrors[0] || 'Inschrijving niet gelukt.', 409);
    }
    return mobileResponse({ registrationID: String(result.signupId), checkoutURL: 'checkoutUrl' in result ? result.checkoutUrl : null, status: 'checkoutUrl' in result ? 'open' : 'paid' }, 201);
}
export async function mobileTickets(request: Request) {
    const user = await requireMobileUser(request);
    const tickets = await getTicketsForEmail(user.email);
    const pubCrawlIDs = tickets.filter(t => t.type === 'pub_crawl').map(t => 'pub_crawl_event_id' in t ? t.pub_crawl_event_id.id : 0);
    let pubCrawls: { rows: { id: number; date: string | null }[] } = { rows: [] };
    if (pubCrawlIDs.length) pubCrawls = await pool.query<{ id: number; date: string | null }>('SELECT id,date::text FROM pub_crawl_events WHERE id=ANY($1::int[])', [pubCrawlIDs]);
    const pubCrawlDates = new Map(pubCrawls.rows.map(row => [row.id, row.date] as const));
    return mobileResponse(tickets.map(ticket => {
        const status = 'payment_status' in ticket ? String(ticket.payment_status || 'open') : String('status' in ticket ? ticket.status : 'open');
        return {
            id: `${ticket.type}:${ticket.id}`, title: ticket.event_id.name || 'Activiteit',
            startsAt: ticket.type === 'event' && 'event' in ticket
                ? eventISO(ticket.event?.event_date, ticket.event?.event_time)
                : ticket.type === 'pub_crawl' && 'pub_crawl_event_id' in ticket
                    ? eventISO(pubCrawlDates.get(Number(ticket.pub_crawl_event_id.id)))
                    : eventISO(ticket.event_id.event_date ? String(ticket.event_id.event_date) : null), location: ticket.event_id.location || null,
            // Pending/failed tickets must never present a valid admission QR code.
            qrToken: ['paid', 'confirmed', 'completed'].includes(status) ? ticket.qr_token || null : null,
            status, kind: ticket.type,
            activityID: ticket.type === 'event' && 'event' in ticket ? `event:${ticket.event?.id}` : null
        };
    }));
}
export function profileDTO(user: MobileUser) {
    return { id: user.id, name: user.name, email: user.email, firstName: user.first_name || '', lastName: user.last_name || '', phoneNumber: user.phone_number,
        membershipStatus: user.membership_status, membershipExpiry: user.membership_expiry ? (user.membership_expiry.includes('T') ? user.membership_expiry : `${user.membership_expiry}T00:00:00Z`) : null };
}
export async function mobileProfile(request: Request) { return mobileResponse(profileDTO(await requireMobileUser(request))); }
const profilePatch = z.object({ phoneNumber: z.string().max(40) }).strict();
export async function updateMobileProfile(request: Request) {
    const user = await requireMobileUser(request);
    await limitMobileUser(user.id, 'profile');
    const parsed = profilePatch.safeParse(await readMobileJSON(request));
    if (!parsed.success) throw new MobileError('invalid_request', 'Controleer je gegevens.');
    const result = await updateUserProfileForUser({ phone_number: parsed.data.phoneNumber }, user);
    if (!result.success) throw new MobileError('profile_failed', result.error || 'Bijwerken mislukt.', 409);
    return mobileProfile(request);
}
