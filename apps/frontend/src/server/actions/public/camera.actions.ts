'use server';

import { getEnrichedSession } from '@/server/auth/auth-utils';
import { revalidatePath } from 'next/cache';
import { db, schema } from '@salvemundi/db';
import { and, asc, desc, eq, gte, inArray, lte, ne } from 'drizzle-orm';
import { z } from 'zod';
import {
    createCameraRequestSchema,
    type CameraCommitteeOption,
    type CameraEventOption,
    type CameraPhotographerOption,
    type CameraRequestStatus,
    type CameraRequestSummary,
} from '@salvemundi/validations';
import { safeConsoleError } from '@/server/utils/logger';
import { hhmm, periodsOverlap, type CameraPeriod } from '@/shared/lib/camera-period';

type Result = { success: true } | { success: false; error: string };

const GENERIC_ERROR = 'Er ging iets mis. Probeer het later opnieuw.';
const RATE_LIMIT_ERROR = 'Te veel acties. Probeer het over een minuut opnieuw.';
const uuidSchema = z.string().uuid();

export interface CameraAvailability {
    /** Goedgekeurde aanvragen die overlappen: de camera is dan niet beschikbaar. */
    approved: { event_name: string; start_date: string; end_date: string }[];
    /** Nog te beoordelen aanvragen die overlappen: alleen een waarschuwing. */
    requested: number;
}

async function requireActiveMember() {
    const session = await getEnrichedSession();
    if (!session?.user) {
        return { ok: false as const, error: 'Je moet ingelogd zijn om de camera aan te vragen.' };
    }
    if (session.user.membership_status !== 'active') {
        return { ok: false as const, error: 'De camera aanvragen is alleen voor actieve leden van Salve Mundi.' };
    }
    return { ok: true as const, userId: session.user.id };
}

async function limit(key: string, max: number): Promise<string | null> {
    try {
        const { enforceRateLimit } = await import('@/server/utils/ratelimit');
        await enforceRateLimit(key, max, 60, RATE_LIMIT_ERROR);
        return null;
    } catch (e) {
        return e instanceof Error && e.message === RATE_LIMIT_ERROR ? RATE_LIMIT_ERROR : GENERIC_ERROR;
    }
}

const fullName = (first?: string | null, last?: string | null) =>
    `${first ?? ''} ${last ?? ''}`.trim() || 'Onbekend';

type Period = CameraPeriod;

async function findOverlaps(period: Period, excludeRequestId?: string) {
    // Grof filteren op datum in SQL, daarna exact op tijd in JS (tijd is optioneel).
    const rows = await db
        .select({
            id: schema.camera_requests.id,
            event_name: schema.camera_requests.event_name,
            start_date: schema.camera_requests.start_date,
            start_time: schema.camera_requests.start_time,
            end_date: schema.camera_requests.end_date,
            end_time: schema.camera_requests.end_time,
            status: schema.camera_requests.status,
        })
        .from(schema.camera_requests)
        .where(
            and(
                inArray(schema.camera_requests.status, ['requested', 'approved']),
                lte(schema.camera_requests.start_date, period.end_date),
                gte(schema.camera_requests.end_date, period.start_date),
                excludeRequestId ? ne(schema.camera_requests.id, excludeRequestId) : undefined,
            ),
        );

    return rows.filter((r) => periodsOverlap(period, r));
}

export async function getCameraAvailability(input: Period): Promise<CameraAvailability> {
    const member = await requireActiveMember();
    const empty: CameraAvailability = { approved: [], requested: 0 };
    if (!member.ok) return empty;

    const parsed = createCameraRequestSchema.safeParse({ ...input, event_name: 'x' });
    if (!parsed.success) return empty;

    try {
        const overlaps = await findOverlaps(parsed.data);
        return {
            approved: overlaps
                .filter((r) => r.status === 'approved')
                .map((r) => ({ event_name: r.event_name, start_date: r.start_date, end_date: r.end_date })),
            requested: overlaps.filter((r) => r.status === 'requested').length,
        };
    } catch (error) {
        safeConsoleError('[camera.actions.ts][getCameraAvailability] Error:', error);
        return empty;
    }
}

export async function getCameraPageData(): Promise<{
    events: CameraEventOption[];
    committees: CameraCommitteeOption[];
    myCommitteeIds: number[];
    photographers: CameraPhotographerOption[];
    mine: CameraRequestSummary[];
}> {
    const empty = { events: [], committees: [], myCommitteeIds: [], photographers: [], mine: [] };
    const member = await requireActiveMember();
    if (!member.ok) return empty;

    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' });

    try {
        const [eventRows, committeeRows, memberRows, photographerRows, requestRows] = await Promise.all([
            db
                .select({
                    id: schema.events.id,
                    name: schema.events.name,
                    event_date: schema.events.event_date,
                    event_time: schema.events.event_time,
                    event_date_end: schema.events.event_date_end,
                    event_time_end: schema.events.event_time_end,
                    committee_id: schema.events.committee_id,
                    status: schema.events.status,
                })
                .from(schema.events)
                // Ook concept-activiteiten: de aanvraag kan al voor publicatie nodig zijn.
                .where(gte(schema.events.event_date, today))
                .orderBy(asc(schema.events.event_date), asc(schema.events.name))
                .limit(200),
            db.select({ id: schema.committees.id, name: schema.committees.name }).from(schema.committees),
            db
                .select({ committee_id: schema.committee_members.committee_id })
                .from(schema.committee_members)
                .where(eq(schema.committee_members.user_id, member.userId)),
            db
                .select({
                    id: schema.camera_photographers.id,
                    first_name: schema.directus_users.first_name,
                    last_name: schema.directus_users.last_name,
                })
                .from(schema.camera_photographers)
                .leftJoin(schema.directus_users, eq(schema.camera_photographers.user_id, schema.directus_users.id))
                .orderBy(asc(schema.directus_users.first_name)),
            db
                .select()
                .from(schema.camera_requests)
                .where(eq(schema.camera_requests.requester_id, member.userId))
                .orderBy(desc(schema.camera_requests.start_date))
                .limit(50),
        ]);

        const photographers = photographerRows.map((p) => ({
            id: p.id,
            name: fullName(p.first_name, p.last_name),
        }));
        const nameById = new Map(photographers.map((p) => [p.id, p.name]));

        const usedCommitteeIds = new Set(eventRows.map((e) => e.committee_id));

        return {
            committees: committeeRows
                .filter((c) => usedCommitteeIds.has(c.id))
                .map((c) => ({ id: c.id, name: c.name }))
                .sort((a, b) => a.name.localeCompare(b.name, 'nl')),
            myCommitteeIds: memberRows.map((m) => m.committee_id),
            events: eventRows.map((e) => ({
                id: e.id,
                name: e.name,
                start_date: e.event_date,
                start_time: hhmm(e.event_time),
                end_date: e.event_date_end ?? e.event_date,
                end_time: hhmm(e.event_time_end),
                committee_id: e.committee_id,
                status: e.status,
            })),
            photographers,
            mine: requestRows.map((r) => ({
                id: r.id,
                event_name: r.event_name,
                start_date: r.start_date,
                start_time: hhmm(r.start_time),
                end_date: r.end_date,
                end_time: hhmm(r.end_time),
                status: r.status as CameraRequestStatus,
                proposed_photographer_name: r.proposed_photographer_id
                    ? (nameById.get(r.proposed_photographer_id) ?? null)
                    : null,
                assigned_photographer_name: r.assigned_photographer_id
                    ? (nameById.get(r.assigned_photographer_id) ?? null)
                    : null,
                note_admin: r.note_admin,
            })),
        };
    } catch (error) {
        safeConsoleError('[camera.actions.ts][getCameraPageData] Error:', error);
        return empty;
    }
}

export async function createCameraRequest(input: unknown): Promise<Result> {
    const member = await requireActiveMember();
    if (!member.ok) return { success: false, error: member.error };

    const limited = await limit(`camera-request:${member.userId}`, 5);
    if (limited) return { success: false, error: limited };

    const parsed = createCameraRequestSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message ?? 'Ongeldige invoer' };
    }
    const data = parsed.data;

    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' });
    if (data.start_date < today) {
        return { success: false, error: 'De startdatum mag niet in het verleden liggen.' };
    }

    try {
        if (data.proposed_photographer_id) {
            const found = await db
                .select({ id: schema.camera_photographers.id })
                .from(schema.camera_photographers)
                .where(eq(schema.camera_photographers.id, data.proposed_photographer_id))
                .limit(1);
            if (found.length === 0) return { success: false, error: 'Deze fotograaf is niet toegelaten.' };
        }

        let eventId: number | null = null;
        if (data.event_id) {
            const evRows = await db
                .select({ id: schema.events.id })
                .from(schema.events)
                .where(eq(schema.events.id, data.event_id))
                .limit(1);
            eventId = evRows.length > 0 ? evRows[0].id : null;
        }

        const overlaps = await findOverlaps(data);
        if (overlaps.some((r) => r.status === 'approved')) {
            return { success: false, error: 'De camera is in deze periode al gereserveerd. Kies een andere periode.' };
        }

        await db.insert(schema.camera_requests).values({
            requester_id: member.userId,
            event_id: eventId,
            event_name: data.event_name,
            start_date: data.start_date,
            start_time: data.start_time,
            end_date: data.end_date,
            end_time: data.end_time,
            proposed_photographer_id: data.proposed_photographer_id,
            note: data.note,
        });

        revalidatePath('/camera');
        return { success: true };
    } catch (error) {
        safeConsoleError('[camera.actions.ts][createCameraRequest] Error:', error);
        return { success: false, error: GENERIC_ERROR };
    }
}

export async function cancelCameraRequest(id: string): Promise<Result> {
    const member = await requireActiveMember();
    if (!member.ok) return { success: false, error: member.error };

    if (!uuidSchema.safeParse(id).success) return { success: false, error: 'Ongeldige aanvraag.' };

    try {
        const updated = await db
            .update(schema.camera_requests)
            .set({ status: 'cancelled', updated_at: new Date().toISOString() })
            .where(
                and(
                    eq(schema.camera_requests.id, id),
                    eq(schema.camera_requests.requester_id, member.userId),
                    inArray(schema.camera_requests.status, ['requested', 'approved']),
                ),
            )
            .returning({ id: schema.camera_requests.id });

        if (updated.length === 0) return { success: false, error: 'Deze aanvraag kan niet worden geannuleerd.' };

        revalidatePath('/camera');
        return { success: true };
    } catch (error) {
        safeConsoleError('[camera.actions.ts][cancelCameraRequest] Error:', error);
        return { success: false, error: GENERIC_ERROR };
    }
}
