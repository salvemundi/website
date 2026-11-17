'use server';

import { enforceFeatureAccess } from '@/server/actions/beheer/beheer-utils.actions';
import { db, schema } from '@salvemundi/db';
import { and, eq, ilike, isNull, lte, gte, ne, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
    addCameraPhotographerSchema,
    handoutCameraSchema,
    returnCameraSchema,
    updateCameraPhotographerSchema,
    saveCameraRequestSchema,
    type CameraMemberOption,
} from '@salvemundi/validations';
import { periodsOverlap } from '@/shared/lib/camera-period';
import { formatMailPeriod, getUserMailInfo, sendCameraMail } from '@/server/utils/camera-mail';
import { safeConsoleError } from '@/server/utils/logger';

type Result = { success: true } | { success: false; error: string };

const GENERIC_ERROR = 'Er ging iets mis. Probeer het later opnieuw.';
const uuidSchema = z.string().uuid();

function revalidate() {
    revalidatePath('/beheer/camera');
    revalidatePath('/camera');
}

const DECISION_LABEL = { approved: 'goedgekeurd', rejected: 'afgewezen', cancelled: 'geannuleerd' } as const;

async function notifyDecision(
    request: typeof schema.camera_requests.$inferSelect,
    status: 'approved' | 'rejected' | 'cancelled',
    photographerId: string | null,
    note: string | null,
) {
    try {
        const requester = await getUserMailInfo(request.requester_id);
        if (!requester?.email) return;

        let photographer: string | null = null;
        if (photographerId) {
            const rows = await db
                .select({ first_name: schema.directus_users.first_name, last_name: schema.directus_users.last_name })
                .from(schema.camera_photographers)
                .leftJoin(schema.directus_users, eq(schema.camera_photographers.user_id, schema.directus_users.id))
                .where(eq(schema.camera_photographers.id, photographerId))
                .limit(1);
            if (rows.length > 0) photographer = `${rows[0].first_name ?? ''} ${rows[0].last_name ?? ''}`.trim() || null;
        }

        await sendCameraMail(requester.email, 'camera-request-decision', {
            name: requester.name,
            approved: status === 'approved',
            statusLabel: DECISION_LABEL[status],
            eventName: request.event_name,
            period: formatMailPeriod(request),
            photographer,
            note,
        });
    } catch (error) {
        safeConsoleError('[beheer-camera.actions.ts][notifyDecision] Error:', error);
    }
}

/** Beslissing, toegewezen fotograaf en opmerking van het beheer opslaan. */
export async function saveCameraRequestAction(input: unknown): Promise<Result> {
    await enforceFeatureAccess('camera');

    const parsed = saveCameraRequestSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Ongeldige invoer' };
    const data = parsed.data;

    try {
        const found = await db
            .select()
            .from(schema.camera_requests)
            .where(eq(schema.camera_requests.id, data.id))
            .limit(1);
        if (found.length === 0) return { success: false, error: 'Aanvraag niet gevonden.' };
        const request = found[0];

        if (data.assigned_photographer_id) {
            const p = await db
                .select({ id: schema.camera_photographers.id })
                .from(schema.camera_photographers)
                .where(eq(schema.camera_photographers.id, data.assigned_photographer_id))
                .limit(1);
            if (p.length === 0) return { success: false, error: 'Deze fotograaf is niet toegelaten.' };
        }

        // De camera kan niet aan twee aanvragen tegelijk worden goedgekeurd.
        if (data.status === 'approved') {
            const others = await db
                .select()
                .from(schema.camera_requests)
                .where(
                    and(
                        eq(schema.camera_requests.status, 'approved'),
                        ne(schema.camera_requests.id, data.id),
                        lte(schema.camera_requests.start_date, request.end_date),
                        gte(schema.camera_requests.end_date, request.start_date),
                    ),
                );
            const clash = others.find((o) => periodsOverlap(request, o));
            if (clash) {
                return {
                    success: false,
                    error: `Overlap met een al goedgekeurde aanvraag (${clash.event_name}). Pas eerst die aanvraag aan.`,
                };
            }
        }

        await db
            .update(schema.camera_requests)
            .set({
                status: data.status,
                photo_status: data.photo_status,
                assigned_photographer_id: data.assigned_photographer_id,
                note_admin: data.note_admin,
                updated_at: new Date().toISOString(),
            })
            .where(eq(schema.camera_requests.id, data.id));

        revalidate();

        // Aanvrager mailen als de beslissing is veranderd (niet bij alleen een foto-status of opmerking).
        if (data.status !== 'requested' && data.status !== request.status) {
            await notifyDecision(request, data.status, data.assigned_photographer_id, data.note_admin);
        }
        return { success: true };
    } catch (error) {
        safeConsoleError('[beheer-camera.actions.ts][saveCameraRequestAction] Error:', error);
        return { success: false, error: GENERIC_ERROR };
    }
}

export async function addCameraPhotographerAction(input: unknown): Promise<Result> {
    await enforceFeatureAccess('camera');

    const parsed = addCameraPhotographerSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Ongeldige invoer' };
    const data = parsed.data;

    try {
        const existing = await db
            .select({ id: schema.camera_photographers.id })
            .from(schema.camera_photographers)
            .where(eq(schema.camera_photographers.user_id, data.user_id))
            .limit(1);
        if (existing.length > 0) return { success: false, error: 'Dit lid is al toegelaten als fotograaf.' };

        await db.insert(schema.camera_photographers).values({
            user_id: data.user_id,
            route: data.route,
            experienced: data.experienced,
            note: data.note,
        });

        revalidate();
        return { success: true };
    } catch (error) {
        safeConsoleError('[beheer-camera.actions.ts][addCameraPhotographerAction] Error:', error);
        return { success: false, error: GENERIC_ERROR };
    }
}

export async function removeCameraPhotographerAction(id: string): Promise<Result> {
    await enforceFeatureAccess('camera');
    if (!uuidSchema.safeParse(id).success) return { success: false, error: 'Ongeldige fotograaf.' };

    try {
        await db.delete(schema.camera_photographers).where(eq(schema.camera_photographers.id, id));
        revalidate();
        return { success: true };
    } catch (error) {
        safeConsoleError('[beheer-camera.actions.ts][removeCameraPhotographerAction] Error:', error);
        return { success: false, error: GENERIC_ERROR };
    }
}

/** Actieve leden zoeken om als fotograaf toe te voegen. */
export async function searchCameraMembersAction(query: string): Promise<CameraMemberOption[]> {
    await enforceFeatureAccess('camera');

    const q = query.trim();
    if (q.length < 2 || q.length > 50) return [];
    const like = `%${q.replace(/[%_\\]/g, '\\$&')}%`;

    try {
        const rows = await db
            .select({
                id: schema.directus_users.id,
                first_name: schema.directus_users.first_name,
                last_name: schema.directus_users.last_name,
            })
            .from(schema.directus_users)
            .where(
                and(
                    eq(schema.directus_users.membership_status, 'active'),
                    or(ilike(schema.directus_users.first_name, like), ilike(schema.directus_users.last_name, like)),
                ),
            )
            .limit(10);
        return rows.map((r) => ({
            id: r.id,
            name: `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() || 'Onbekend',
        }));
    } catch (error) {
        safeConsoleError('[beheer-camera.actions.ts][searchCameraMembersAction] Error:', error);
        return [];
    }
}

/** Camera meegeven aan de aanvrager van een goedgekeurde aanvraag. */
export async function handoutCameraAction(input: unknown): Promise<Result> {
    await enforceFeatureAccess('camera');

    const parsed = handoutCameraSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Ongeldige invoer' };
    const data = parsed.data;

    try {
        const found = await db
            .select({ status: schema.camera_requests.status })
            .from(schema.camera_requests)
            .where(eq(schema.camera_requests.id, data.request_id))
            .limit(1);
        if (found.length === 0) return { success: false, error: 'Aanvraag niet gevonden.' };
        if (found[0].status !== 'approved') {
            return { success: false, error: 'Alleen goedgekeurde aanvragen kunnen worden meegegeven.' };
        }

        // De camera kan maar aan één persoon tegelijk zijn meegegeven.
        const open = await db
            .select({ event_name: schema.camera_requests.event_name })
            .from(schema.camera_loans)
            .innerJoin(schema.camera_requests, eq(schema.camera_loans.request_id, schema.camera_requests.id))
            .where(isNull(schema.camera_loans.returned_on))
            .limit(1);
        if (open.length > 0) {
            return {
                success: false,
                error: `De camera is nog uitgeleend (${open[0].event_name}). Registreer eerst het terugbrengen.`,
            };
        }

        const existing = await db
            .select({ id: schema.camera_loans.id })
            .from(schema.camera_loans)
            .where(eq(schema.camera_loans.request_id, data.request_id))
            .limit(1);
        if (existing.length > 0) return { success: false, error: 'Deze aanvraag is al meegegeven.' };

        await db.insert(schema.camera_loans).values({
            request_id: data.request_id,
            checklist: data.checklist,
            handout_note: data.note,
        });

        revalidate();
        return { success: true };
    } catch (error) {
        safeConsoleError('[beheer-camera.actions.ts][handoutCameraAction] Error:', error);
        return { success: false, error: GENERIC_ERROR };
    }
}

/** Terugbrengen van de camera registreren. */
export async function returnCameraAction(input: unknown): Promise<Result> {
    await enforceFeatureAccess('camera');

    const parsed = returnCameraSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Ongeldige invoer' };
    const data = parsed.data;

    try {
        const updated = await db
            .update(schema.camera_loans)
            .set({ returned_on: data.returned_on, condition_on_return: data.condition })
            .where(and(eq(schema.camera_loans.id, data.id), isNull(schema.camera_loans.returned_on)))
            .returning({ id: schema.camera_loans.id });
        if (updated.length === 0) return { success: false, error: 'Deze uitleen is al afgerond of bestaat niet.' };

        revalidate();
        return { success: true };
    } catch (error) {
        safeConsoleError('[beheer-camera.actions.ts][returnCameraAction] Error:', error);
        return { success: false, error: GENERIC_ERROR };
    }
}

export async function updateCameraPhotographerAction(input: unknown): Promise<Result> {
    await enforceFeatureAccess('camera');

    const parsed = updateCameraPhotographerSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Ongeldige invoer' };
    const data = parsed.data;

    try {
        const updated = await db
            .update(schema.camera_photographers)
            .set({ admitted_on: data.admitted_on, route: data.route, experienced: data.experienced, note: data.note })
            .where(eq(schema.camera_photographers.id, data.id))
            .returning({ id: schema.camera_photographers.id });
        if (updated.length === 0) return { success: false, error: 'Fotograaf niet gevonden.' };

        revalidate();
        return { success: true };
    } catch (error) {
        safeConsoleError('[beheer-camera.actions.ts][updateCameraPhotographerAction] Error:', error);
        return { success: false, error: GENERIC_ERROR };
    }
}
