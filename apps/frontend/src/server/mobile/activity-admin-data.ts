import 'server-only';
import { MobileError } from './http';
import { pool } from '@/lib/database/db';
import { amsterdamToUTC } from '@/lib/utils/date-utils';
import { type ActivityAdminActor, type AdminEventRow, requireEventScope } from './activity-admin-auth';

export function adminISO(value: string | Date | null | undefined): string | null {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
    let text = value.replace(' ', 'T');
    if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:.]+$/.test(text)) text += 'Z';
    if (/[+-][0-9]{2}$/.test(text)) text += ':00';
    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
function eventStart(date: string | null, time: string | null): string | null {
    return date ? amsterdamToUTC(`${date.slice(0, 10)}T${time?.slice(0, 8) || '00:00:00'}`) : null;
}
export function adminActivitySummary(row: AdminEventRow, actor: ActivityAdminActor) {
    const publishAt = adminISO(row.publish_date);
    const scheduled = row.status === 'published' && publishAt !== null && Date.parse(publishAt) > Date.now();
    return {
        activity: {
            id: `event:${row.id}`, title: row.name, description: row.description || row.short_description || null,
            startsAt: eventStart(row.event_date, row.event_time), endsAt: eventStart(row.event_date_end, row.event_time_end),
            location: row.location, imageURL: row.image ? `https://acc.salvemundi.nl/api/assets/${row.image}` : null,
            memberPriceCents: Math.round(Number(row.price_members) * 100), guestPriceCents: Math.round(Number(row.price_non_members) * 100),
            membersOnly: row.only_members, registrationDeadline: adminISO(row.registration_deadline), capacity: row.max_sign_ups,
            signupCount: Number(row.confirmed_count || 0), kind: 'event', registrationViaWebsite: Boolean(row.custom_url),
            websiteURL: `https://acc.salvemundi.nl/activiteiten/${row.id}`
        },
        status: scheduled ? 'scheduled' : row.status || 'draft', committeeID: row.committee_id, committeeName: row.committee_name || null,
        confirmedCount: Number(row.confirmed_count || 0), pendingCount: Number(row.pending_count || 0), checkedInCount: Number(row.checked_in_count || 0),
        canEdit: actor.canCreate, canDelete: actor.canCreate, canManageSignups: actor.canCreate, canCheckIn: true
    };
}
export type AdminActivitySummary = ReturnType<typeof adminActivitySummary>;
export function adminActivityForm(row: AdminEventRow) {
    const publishAt = adminISO(row.publish_date);
    return {
        title: row.name, description: row.description || '', shortDescription: row.short_description, memberDescription: row.description_logged_in,
        startsOn: row.event_date.slice(0, 10), startTime: row.event_time?.slice(0, 5) || null,
        endsOn: row.event_date_end?.slice(0, 10) || null, endTime: row.event_time_end?.slice(0, 5) || null,
        location: row.location, capacity: row.max_sign_ups,
        memberPriceCents: Math.round(Number(row.price_members) * 100), guestPriceCents: Math.round(Number(row.price_non_members) * 100),
        membersOnly: row.only_members, committeeID: row.committee_id, contactEmail: row.contact,
        registrationDeadline: adminISO(row.registration_deadline), publishAt,
        status: row.status === 'published' && publishAt && Date.parse(publishAt) > Date.now() ? 'scheduled' : row.status || 'draft',
        externalSignupURL: row.custom_url, removeImage: false
    };
}
// The same scoped/count projection feeds admin screens and the counts-only widget.
// The caller must obtain a fresh actor for every HTTP request.
export async function listAdminActivitySummaries(actor: ActivityAdminActor) {
    const result = await pool.query<AdminEventRow>(`
        SELECT e.*,e.event_date::text AS event_date,e.event_date_end::text AS event_date_end,
               e.registration_deadline::text AS registration_deadline,e.publish_date::text AS publish_date,
               c.name AS committee_name,
               (SELECT COUNT(*) FROM event_signups es WHERE es.event_id=e.id AND es.payment_status='paid') AS confirmed_count,
               (SELECT COUNT(*) FROM event_signups es WHERE es.event_id=e.id AND es.payment_status='open' AND es.created_at >= NOW() - INTERVAL '15 minutes') AS pending_count,
               (SELECT COUNT(*) FROM event_signups es WHERE es.event_id=e.id AND es.payment_status='paid' AND es.checked_in=true) AS checked_in_count
        FROM events e LEFT JOIN committees c ON c.id=e.committee_id
        WHERE ($1::boolean OR e.committee_id=ANY($2::integer[]))
        ORDER BY e.event_date DESC,e.id DESC
    `, [actor.global, actor.committeeIDs]);
    return result.rows.map(row => adminActivitySummary(row, actor));
}
export async function adminActivityDetail(actor: ActivityAdminActor, id: number) {
    const event = await requireEventScope(actor, id);
    const all = await listAdminActivitySummaries(actor);
    const summary = all.find(item => item.activity.id === `event:${id}`);
    if (!summary) throw new MobileError('not_found', 'Activiteit niet gevonden.', 404);
    return { summary, form: adminActivityForm(event) };
}
export async function adminCommitteeChoices(actor: ActivityAdminActor) {
    const result = await pool.query<{ id: number; name: string; email: string | null }>(
        'SELECT id,name,email FROM committees WHERE ($1::boolean OR id=ANY($2::integer[])) ORDER BY name', [actor.global, actor.committeeIDs]
    );
    return result.rows;
}
