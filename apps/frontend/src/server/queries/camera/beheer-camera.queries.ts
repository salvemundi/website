import 'server-only';

import { db, schema } from '@salvemundi/db';
import { asc, desc, eq } from 'drizzle-orm';
import { safeConsoleError } from '@/server/utils/logger';
import { hhmm, periodsOverlap } from '@/shared/lib/camera-period';
import type {
    CameraAdminLoan,
    CameraChecklist,
    CameraPhotoStatus,
    CameraAdminPhotographer,
    CameraAdminRequest,
    CameraRequestStatus,
} from '@salvemundi/validations';

const fullName = (first?: string | null, last?: string | null) =>
    `${first ?? ''} ${last ?? ''}`.trim() || 'Onbekend';

export async function getCameraPhotographersDb(): Promise<CameraAdminPhotographer[]> {
    try {
        const rows = await db
            .select({
                p: schema.camera_photographers,
                first_name: schema.directus_users.first_name,
                last_name: schema.directus_users.last_name,
            })
            .from(schema.camera_photographers)
            .leftJoin(schema.directus_users, eq(schema.camera_photographers.user_id, schema.directus_users.id))
            .orderBy(asc(schema.directus_users.first_name));
        return rows.map(({ p, first_name, last_name }) => ({
            id: p.id,
            user_id: p.user_id,
            name: fullName(first_name, last_name),
            admitted_on: p.admitted_on,
            route: p.route,
            experienced: p.experienced,
            note: p.note,
        }));
    } catch (error) {
        safeConsoleError('[beheer-camera.queries.ts][getCameraPhotographersDb] Error:', error);
        return [];
    }
}

export async function getCameraRequestsDb(): Promise<CameraAdminRequest[]> {
    try {
        const [rows, photographers] = await Promise.all([
            db
                .select({
                    r: schema.camera_requests,
                    first_name: schema.directus_users.first_name,
                    last_name: schema.directus_users.last_name,
                    email: schema.directus_users.email,
                })
                .from(schema.camera_requests)
                .leftJoin(schema.directus_users, eq(schema.camera_requests.requester_id, schema.directus_users.id))
                .orderBy(desc(schema.camera_requests.start_date), desc(schema.camera_requests.start_time))
                .limit(500),
            getCameraPhotographersDb(),
        ]);
        const nameById = new Map(photographers.map((p) => [p.id, p.name]));

        const mapped = rows.map(({ r, first_name, last_name, email }) => ({
            id: r.id,
            event_name: r.event_name,
            start_date: r.start_date,
            start_time: hhmm(r.start_time),
            end_date: r.end_date,
            end_time: hhmm(r.end_time),
            status: r.status as CameraRequestStatus,
            photo_status: r.photo_status as CameraPhotoStatus,
            proposed_photographer_id: r.proposed_photographer_id,
            assigned_photographer_id: r.assigned_photographer_id,
            proposed_photographer_name: r.proposed_photographer_id
                ? (nameById.get(r.proposed_photographer_id) ?? null)
                : null,
            assigned_photographer_name: r.assigned_photographer_id
                ? (nameById.get(r.assigned_photographer_id) ?? null)
                : null,
            note: r.note,
            note_admin: r.note_admin,
            requester_name: fullName(first_name, last_name),
            requester_email: email,
            created_at: r.created_at,
            overlap: false,
        }));

        const active = mapped.filter((r) => r.status === 'requested' || r.status === 'approved');
        for (const r of active) {
            r.overlap = active.some((o) => o.id !== r.id && periodsOverlap(r, o));
        }
        return mapped;
    } catch (error) {
        safeConsoleError('[beheer-camera.queries.ts][getCameraRequestsDb] Error:', error);
        return [];
    }
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Aantal hele dagen dat `date` na `agreed` ligt (0 als op tijd). Datums als YYYY-MM-DD. */
function daysAfter(date: string, agreed: string): number {
    const diff = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${agreed}T00:00:00Z`)) / DAY_MS);
    return Math.max(0, diff);
}

export async function getCameraLoansDb(): Promise<CameraAdminLoan[]> {
    try {
        const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' });
        const [rows, photographers] = await Promise.all([
            db
                .select({
                    l: schema.camera_loans,
                    r: schema.camera_requests,
                    first_name: schema.directus_users.first_name,
                    last_name: schema.directus_users.last_name,
                })
                .from(schema.camera_loans)
                .innerJoin(schema.camera_requests, eq(schema.camera_loans.request_id, schema.camera_requests.id))
                .leftJoin(schema.directus_users, eq(schema.camera_requests.requester_id, schema.directus_users.id))
                .orderBy(desc(schema.camera_loans.handed_out_at))
                .limit(500),
            getCameraPhotographersDb(),
        ]);
        const nameById = new Map(photographers.map((p) => [p.id, p.name]));

        return rows.map(({ l, r, first_name, last_name }) => {
            const checklist = l.checklist as CameraChecklist;
            return {
                id: l.id,
                request_id: l.request_id,
                borrower_name: fullName(first_name, last_name),
                event_name: r.event_name,
                photographer_name: r.assigned_photographer_id ? (nameById.get(r.assigned_photographer_id) ?? null) : null,
                start_date: r.start_date,
                agreed_end_date: r.end_date,
                handed_out_at: l.handed_out_at,
                returned_on: l.returned_on,
                checklist,
                complete: Object.values(checklist).every(Boolean),
                handout_note: l.handout_note,
                condition_on_return: l.condition_on_return,
                days_late: daysAfter(l.returned_on ?? today, r.end_date),
            };
        });
    } catch (error) {
        safeConsoleError('[beheer-camera.queries.ts][getCameraLoansDb] Error:', error);
        return [];
    }
}
