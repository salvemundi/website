import 'server-only';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { pool } from '@/lib/database/db';
import { getRedis } from '@/server/auth/redis-client';
import { revalidatePath, revalidateTag } from 'next/cache';
import { insertSystemLogInternal } from '@/server/queries/audit/audit.queries';
import { uploadToDirectus } from '@/server/utils/media';
import { buildCommitteeEmail } from '@/shared/lib/activity-utils';
import { getInternalHeaders, fetchWithTimeout } from '@/server/internal/activiteiten/activiteiten.utils';
import { safeConsoleError } from '@/server/utils/logger';
import { MobileError } from './http';
import { type ActivityAdminActor, type AdminEventRow, type AdminQueryClient, requireActivityEdit, requireEventScope, authorizeCommitteeAssignment } from './activity-admin-auth';
import { adminISO } from './activity-admin-data';
import { validateAdminActivityForm, activityWriteValues } from './activity-admin-validation';

interface SignupRow {
    id: number; event_id: number; participant_name: string | null; participant_email: string | null; participant_phone: string | null;
    payment_status: string | null; created_at: string | Date | null; checked_in: boolean; checked_in_at: string | null;
    is_member: boolean; directus_relations: string | null; qr_token: string | null; amount_paid?: string | number | null;
}
export function adminRegistration(row: SignupRow) {
    return { id: String(row.id), name: row.participant_name || 'Onbekend', email: row.participant_email || '', phone: row.participant_phone,
        status: row.payment_status || 'open', amountPaidCents: (row.amount_paid === null || row.amount_paid === undefined) ? null : Math.round(Number(row.amount_paid) * 100),
        createdAt: adminISO(row.created_at), checkedIn: Boolean(row.checked_in), isMember: Boolean(row.is_member) };
}
export async function limitAdminOperation(actor: ActivityAdminActor, operation: 'write' | 'manual' | 'mail' | 'scan' | 'image') {
    const redis = await getRedis();
    const limit = operation === 'scan' ? 300 : operation === 'mail' ? 5 : operation === 'image' ? 10 : 60;
    const count = await redis.eval(`local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n`, 1, `mobile:admin:${operation}:${actor.user.id}`, operation === 'mail' ? 300 : 60);
    if (Number(count) > limit) throw new MobileError('rate_limited', 'Te veel wijzigingen. Probeer het later opnieuw.', 429);
}
async function audit(actor: ActivityAdminActor, type: string, eventID: number, signupID?: number) {
    await insertSystemLogInternal({ type, status: 'SUCCESS', payload: {
        context: 'activiteit', event_id: eventID, ...(signupID === undefined ? {} : { id: signupID }),
        admin_id: actor.user.id, admin_name: actor.user.name, source: 'ios', timestamp: new Date().toISOString()
    } });
}
function invalidate(eventID: number) {
    revalidateTag('events', 'max'); revalidateTag(`event_${eventID}`, 'max'); revalidateTag(`event_signups_${eventID}`, 'max');
    revalidatePath('/beheer/activiteiten'); revalidatePath(`/beheer/activiteiten/${eventID}/aanmeldingen`); revalidatePath(`/activiteiten/${eventID}`);
}
async function eventTransaction<T>(actor: ActivityAdminActor, eventID: number, mode: 'read' | 'edit', work: (client: AdminQueryClient, event: AdminEventRow) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const event = await requireEventScope(actor, eventID, mode, client, true);
        const result = await work(client, event);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK'); throw error;
    } finally { client.release(); }
}
async function checkUniqueTitle(client: AdminQueryClient, title: string, exceptID: number | null) {
    await client.query("SELECT pg_advisory_xact_lock(hashtext('mobile-event-title:' || LOWER($1)))", [title]);
    const existing = await client.query('SELECT id FROM events WHERE LOWER(name)=LOWER($1) AND ($2::integer IS NULL OR id<>$2) LIMIT 1', [title, exceptID]);
    if (existing.rowCount) throw new MobileError('conflict', 'Er bestaat al een activiteit met deze naam.', 409);
}
export async function createAdminActivity(actor: ActivityAdminActor, input: unknown) {
    requireActivityEdit(actor); const form = validateAdminActivityForm(input);
    await authorizeCommitteeAssignment(actor, form.committeeID ?? null);
    const client = await pool.connect();
    let eventID: number;
    try {
        await client.query('BEGIN'); await checkUniqueTitle(client, form.title, null);
        const created = await client.query<{ id: number }>(`INSERT INTO events
            (name,description,short_description,description_logged_in,event_date,event_time,event_date_end,event_time_end,location,max_sign_ups,
             price_members,price_non_members,only_members,committee_id,contact,registration_deadline,custom_url,status,publish_date)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING id`, activityWriteValues(form));
        const row = created.rows.at(0);
        if (!row) throw new MobileError('server_error', 'Activiteit is niet aangemaakt.', 503);
        eventID = row.id; await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
    await audit(actor, 'admin_activity_created', eventID); invalidate(eventID); return eventID;
}
export async function updateAdminActivity(actor: ActivityAdminActor, eventID: number, input: unknown) {
    requireActivityEdit(actor); const form = validateAdminActivityForm(input);
    await authorizeCommitteeAssignment(actor, form.committeeID ?? null);
    await eventTransaction(actor, eventID, 'edit', async client => {
        await checkUniqueTitle(client, form.title, eventID);
        await client.query(`UPDATE events SET name=$1,description=$2,short_description=$3,description_logged_in=$4,event_date=$5,event_time=$6,
            event_date_end=$7,event_time_end=$8,location=$9,max_sign_ups=$10,price_members=$11,price_non_members=$12,only_members=$13,
            committee_id=$14,contact=$15,registration_deadline=$16,custom_url=$17,status=$18,publish_date=$19,updated_at=NOW(),
            image=CASE WHEN $20::boolean THEN NULL ELSE image END WHERE id=$21`, [...activityWriteValues(form), form.removeImage || false, eventID]);
    });
    await audit(actor, 'admin_activity_updated', eventID); invalidate(eventID);
}
export async function deleteAdminActivity(actor: ActivityAdminActor, eventID: number) {
    await eventTransaction(actor, eventID, 'edit', async client => { await client.query('DELETE FROM events WHERE id=$1', [eventID]); });
    await audit(actor, 'admin_activity_deleted', eventID); invalidate(eventID);
}
export async function uploadAdminActivityImage(actor: ActivityAdminActor, eventID: number, file: File) {
    await requireEventScope(actor, eventID, 'edit');
    if (file.size === 0) throw new MobileError('invalid_request', 'Kies een bestand.');
    const uploaded = await uploadToDirectus(file);
    if (!uploaded.success || !uploaded.id) throw new MobileError('upload_failed', uploaded.success ? 'Uploaden mislukt.' : uploaded.error, 409);
    await eventTransaction(actor, eventID, 'edit', async client => { await client.query('UPDATE events SET image=$1,updated_at=NOW() WHERE id=$2', [uploaded.id, eventID]); });
    await audit(actor, 'admin_activity_image_updated', eventID); invalidate(eventID);
}
export async function listAdminRegistrations(actor: ActivityAdminActor, eventID: number) {
    await requireEventScope(actor, eventID);
    const result = await pool.query<SignupRow>(`SELECT es.*,
        (SELECT t.amount FROM transactions t WHERE t.registration=es.id AND t.payment_status='paid' ORDER BY t.created_at DESC LIMIT 1) AS amount_paid
        FROM event_signups es JOIN events e ON e.id=es.event_id
        WHERE es.event_id=$1 AND ($2::boolean OR e.committee_id=ANY($3::integer[]))
        ORDER BY es.created_at DESC,es.id DESC`, [eventID,actor.global,actor.committeeIDs]);
    return result.rows.map(adminRegistration);
}
async function requireSignup(client: AdminQueryClient, eventID: number, signupID: number) {
    const result = await client.query<SignupRow>('SELECT * FROM event_signups WHERE event_id=$1 AND id=$2 FOR UPDATE', [eventID, signupID]);
    const signup = result.rows.at(0);
    if (!signup) throw new MobileError('not_found', 'Aanmelding niet gevonden.', 404);
    return signup;
}
const manualSignup = z.discriminatedUnion('type', [
    z.object({ type: z.literal('member'), memberID: z.uuid() }).strict(),
    z.object({ type: z.literal('guest'), name: z.string().trim().min(1).max(255), email: z.email().max(128), phone: z.string().max(40).nullable().optional() }).strict()
]);
export async function addAdminRegistration(actor: ActivityAdminActor, eventID: number, input: unknown) {
    requireActivityEdit(actor);
    const parsed = manualSignup.safeParse(input);
    if (!parsed.success) throw new MobileError('invalid_request', 'Controleer de deelnemergegevens.');
    const data = parsed.data;
    const added = await eventTransaction(actor, eventID, 'edit', async client => {
        let name: string; let email: string; let phone: string | null; let memberID: string | null = null;
        if (data.type === 'member') {
            const member = await client.query<{ id: string; first_name: string | null; last_name: string | null; email: string | null }>('SELECT id,first_name,last_name,email FROM directus_users WHERE id=$1', [data.memberID]);
            const row = member.rows.at(0);
            if (!row?.email) throw new MobileError('not_found', 'Lid niet gevonden.', 404);
            name = `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.email; email = row.email; phone = null; memberID = row.id;
        } else { name = data.name; email = data.email; phone = data.phone || null; }
        const duplicate = await client.query(`SELECT id FROM event_signups WHERE event_id=$1 AND LOWER(participant_email)=LOWER($2)
            AND COALESCE(payment_status,'open') NOT IN ('failed','canceled','expired') LIMIT 1`, [eventID,email]);
        if (duplicate.rowCount) throw new MobileError('conflict', 'Deze persoon is al aangemeld.', 409);
        const result = await client.query<SignupRow>(`INSERT INTO event_signups
            (event_id,participant_name,participant_email,participant_phone,payment_status,directus_relations,is_member,qr_token)
            VALUES ($1,$2,$3,$4,'paid',$5,$6,$7) RETURNING *`, [eventID,name,email,phone,memberID,data.type === 'member',`r-${eventID}-${randomUUID()}`]);
        const row = result.rows.at(0);
        if (!row) throw new MobileError('server_error', 'Aanmelding niet opgeslagen.', 503);
        return row;
    });
    await audit(actor, 'admin_event_signup_manual_created', eventID, added.id); invalidate(eventID); return adminRegistration(added);
}
export async function checkInAdminRegistration(actor: ActivityAdminActor, eventID: number, signupID: number, checkedIn: boolean) {
    const changed = await eventTransaction(actor, eventID, 'read', async client => {
        const row = await requireSignup(client, eventID, signupID);
        if (checkedIn && row.payment_status !== 'paid') throw new MobileError('unpaid_registration', 'Deze aanmelding is nog niet betaald.', 409);
        const result = await client.query<SignupRow>('UPDATE event_signups SET checked_in=$1,checked_in_at=$2 WHERE event_id=$3 AND id=$4 RETURNING *', [checkedIn,checkedIn ? new Date().toISOString() : null,eventID,signupID]);
        return result.rows[0];
    });
    await audit(actor, checkedIn ? 'admin_event_signup_checked_in' : 'admin_event_signup_checked_out', eventID, signupID); invalidate(eventID); return adminRegistration(changed);
}
export async function scanAdminRegistration(actor: ActivityAdminActor, eventID: number, token: string) {
    const result = await eventTransaction(actor, eventID, 'read', async client => {
        const found = await client.query<SignupRow>('SELECT * FROM event_signups WHERE event_id=$1 AND qr_token=$2 FOR UPDATE', [eventID,token]);
        const row = found.rows.at(0);
        if (!row) throw new MobileError('not_found', 'QR-code hoort niet bij deze activiteit.', 404);
        if (row.payment_status !== 'paid') throw new MobileError('unpaid_registration', 'Deze aanmelding is nog niet betaald.', 409);
        const alreadyCheckedIn = Boolean(row.checked_in);
        if (!alreadyCheckedIn) await client.query('UPDATE event_signups SET checked_in=true,checked_in_at=$1 WHERE event_id=$2 AND id=$3', [new Date().toISOString(),eventID,row.id]);
        return { registration: adminRegistration({ ...row, checked_in: true }), alreadyCheckedIn };
    });
    await audit(actor, 'admin_event_signup_scanned', eventID, Number(result.registration.id)); invalidate(eventID); return result;
}
async function organizerEmail(event: AdminEventRow) {
    if (event.contact?.includes('@')) return event.contact;
    const committee = event.committee_id ? await pool.query<{ name: string }>('SELECT name FROM committees WHERE id=$1', [event.committee_id]) : null;
    return buildCommitteeEmail(committee?.rows.at(0)?.name) || 'info@salvemundi.nl';
}
async function cancellationEmail(event: AdminEventRow, row: SignupRow) {
    if (!row.participant_email || !process.env.MAIL_SERVICE_URL || !process.env.INTERNAL_SERVICE_TOKEN) return;
    try {
        await fetchWithTimeout(`${process.env.MAIL_SERVICE_URL}/api/mail/send`, { method: 'POST', headers: getInternalHeaders(),
            body: JSON.stringify({ to: row.participant_email, templateId: 'event_cancellation', data: { eventName: event.name, organizerEmail: await organizerEmail(event) } }) });
    } catch { safeConsoleError('[mobile-admin] cancellation delivery failed', { eventID: event.id }); }
}
export async function deleteAdminRegistration(actor: ActivityAdminActor, eventID: number, signupID: number) {
    const deleted = await eventTransaction(actor, eventID, 'edit', async (client,event) => {
        const row = await requireSignup(client,eventID,signupID);
        await client.query('DELETE FROM event_signups WHERE event_id=$1 AND id=$2', [eventID,signupID]);
        return { event, row };
    });
    await cancellationEmail(deleted.event,deleted.row);
    await audit(actor, 'admin_event_signup_deleted', eventID, signupID); invalidate(eventID);
}
const messageSchema = z.object({ subject: z.string().trim().min(1).max(255), message: z.string().trim().min(1).max(30000), paidOnly: z.boolean() }).strict();
export async function messageAdminRegistrations(actor: ActivityAdminActor, eventID: number, input: unknown) {
    requireActivityEdit(actor);
    const parsed = messageSchema.safeParse(input);
    if (!parsed.success) throw new MobileError('invalid_request', 'Vul een onderwerp en bericht in.');
    const event = await requireEventScope(actor,eventID,'edit');
    const rows = await pool.query<{ participant_name: string | null; participant_email: string | null }>(
        "SELECT participant_name,participant_email FROM event_signups WHERE event_id=$1 AND (NOT $2::boolean OR payment_status='paid')", [eventID,parsed.data.paidOnly]);
    const recipients = new Map<string,{email:string;name:string}>();
    for (const row of rows.rows) {
        const email = row.participant_email?.trim();
        if (!email || !z.email().safeParse(email).success) continue;
        if (!recipients.has(email.toLowerCase())) recipients.set(email.toLowerCase(),{email,name:row.participant_name || email});
    }
    if (!recipients.size) throw new MobileError('invalid_request', 'Geen ontvangers geselecteerd.');
    if (!process.env.MAIL_SERVICE_URL || !process.env.INTERNAL_SERVICE_TOKEN) throw new MobileError('mail_unavailable', 'E-mail verzenden is tijdelijk niet beschikbaar.', 503);
    const response = await fetchWithTimeout(`${process.env.MAIL_SERVICE_URL}/api/mail/send-bulk`, { method:'POST',headers:getInternalHeaders(),
        body:JSON.stringify({to:Array.from(recipients.values()),subject:parsed.data.subject,template:'event-announcement',data:{message:parsed.data.message,eventName:event.name,eventId:eventID,organizerEmail:await organizerEmail(event)}}) });
    if (!response.ok) throw new MobileError('mail_failed','E-mail verzenden is mislukt.',503);
    await audit(actor,'admin_event_bulk_mail_sent',eventID); return {success:true,recipientCount:recipients.size};
}
export async function searchAdminMembers(actor: ActivityAdminActor, query: string) {
    requireActivityEdit(actor);
    const text = query.trim();
    if (text.length < 2) return [];
    if (text.length > 100) throw new MobileError('invalid_request','Zoekterm is te lang.');
    const result = await pool.query<{id:string;first_name:string|null;last_name:string|null;email:string|null;membership_status:string|null}>(
        "SELECT id,first_name,last_name,email,membership_status FROM directus_users WHERE STRPOS(LOWER(COALESCE(first_name,'')),LOWER($1))>0 OR STRPOS(LOWER(COALESCE(last_name,'')),LOWER($1))>0 OR STRPOS(LOWER(COALESCE(email,'')),LOWER($1))>0 ORDER BY first_name,last_name LIMIT 10", [text]);
    return result.rows.map(row=>({id:row.id,firstName:row.first_name||'',lastName:row.last_name||'',email:row.email||'',membershipStatus:row.membership_status}));
}
