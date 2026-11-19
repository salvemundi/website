import 'server-only';
import type { PoolClient } from 'pg';
import { pool } from '@/lib/database/db';
import { fetchUserCommitteesDb } from '@/server/internal/leden/leden-db.utils';
import { canAccess, checkFeatureAccess, type Committee } from '@/shared/lib/permissions';
import type { EventDbRow } from '@/server/internal/activiteiten/activiteiten-db.utils';
import { MobileError } from './http';
import { requireMobileUser, type MobileUser } from './session';

export interface ActivityAdminActor {
    user: MobileUser;
    committees: Committee[];
    committeeIDs: number[];
    global: boolean;
    canCreate: boolean;
}
export type AdminEventRow = EventDbRow & {
    committee_name?: string | null;
    confirmed_count?: number | string;
    pending_count?: number | string;
    checked_in_count?: number | string;
};
export type AdminQueryClient = Pick<PoolClient, 'query'>;

// This helper is server-internal, never a Server Action. The caller must have
// verified the native session (or a widget's parent session) before passing user.
export async function activityAdminForUser(user: MobileUser): Promise<ActivityAdminActor> {
    const committees = await fetchUserCommitteesDb(user.id);
    if (!canAccess(committees, 'activiteiten')) throw new MobileError('forbidden', 'Je hebt geen toegang tot activiteitenbeheer.', 403);
    return {
        user, committees,
        committeeIDs: committees.map(c => Number(c.id)).filter(id => Number.isSafeInteger(id) && id > 0),
        global: canAccess(committees, 'commissies'),
        canCreate: checkFeatureAccess(committees, 'activiteiten').isLeader
    };
}
export async function requireActivityAdmin(request: Request): Promise<ActivityAdminActor> {
    return activityAdminForUser(await requireMobileUser(request));
}
export function requireActivityEdit(actor: ActivityAdminActor) {
    if (!actor.canCreate) throw new MobileError('forbidden', 'Alleen commissieleiders en beheer mogen dit wijzigen.', 403);
}
export function parseAdminEventID(value: string): number {
    const match = /^event:([1-9]\d*)$/.exec(value);
    const id = match ? Number(match[1]) : NaN;
    if (!Number.isSafeInteger(id) || id > 2147483647) throw new MobileError('not_found', 'Activiteit niet gevonden.', 404);
    return id;
}
export function parseAdminSignupID(value: string): number {
    const id = /^[1-9]\d*$/.test(value) ? Number(value) : NaN;
    if (!Number.isSafeInteger(id) || id > 2147483647) throw new MobileError('not_found', 'Aanmelding niet gevonden.', 404);
    return id;
}
export async function requireEventScope(actor: ActivityAdminActor, eventID: number, mode: 'read' | 'edit' = 'read', client: AdminQueryClient = pool, lock = false): Promise<AdminEventRow> {
    if (mode === 'edit') requireActivityEdit(actor);
    const result = await client.query<AdminEventRow>(`
        SELECT e.*,e.event_date::text AS event_date,e.event_date_end::text AS event_date_end,
               e.registration_deadline::text AS registration_deadline,e.publish_date::text AS publish_date
        FROM events e WHERE e.id=$1 AND ($2::boolean OR e.committee_id=ANY($3::integer[]))
        ${lock ? 'FOR UPDATE' : ''}
    `, [eventID, actor.global, actor.committeeIDs]);
    const event = result.rows.at(0);
    if (!event) throw new MobileError('not_found', 'Activiteit niet gevonden.', 404);
    return event;
}
export async function authorizeCommitteeAssignment(actor: ActivityAdminActor, committeeID: number | null) {
    if (!actor.global && (committeeID === null || !actor.committeeIDs.includes(committeeID))) throw new MobileError('forbidden', 'Kies een eigen commissie.', 403);
    if (committeeID !== null) {
        const committee = await pool.query('SELECT id FROM committees WHERE id=$1', [committeeID]);
        if (!committee.rowCount) throw new MobileError('invalid_request', 'Commissie niet gevonden.');
    }
}
