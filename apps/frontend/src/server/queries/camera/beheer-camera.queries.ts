import 'server-only';

import { db, schema } from '@salvemundi/db';
import { asc, desc, eq } from 'drizzle-orm';
import { safeConsoleError } from '@/server/utils/logger';
import { hhmm, periodsOverlap } from '@/shared/lib/camera-period';
import type {
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
