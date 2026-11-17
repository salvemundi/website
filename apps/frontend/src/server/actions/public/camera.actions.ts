'use server';

import { getEnrichedSession } from '@/server/auth/auth-utils';
import { revalidatePath } from 'next/cache';
import { db, schema } from '@salvemundi/db';
import { and, asc, desc, eq, gte, inArray, lte, ne } from 'drizzle-orm';
import { z } from 'zod';
import {
    createCameraRequestSchema,
    type CameraEventOption,
    type CameraPhotographerOption,
    type CameraRequestStatus,
    type CameraRequestSummary,
} from '@salvemundi/validations';
import { safeConsoleError } from '@/server/utils/logger';

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

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : null);

/** Zonder tijd geldt de hele dag: begin om 00:00, einde om 23:59. */
const startKey = (date: string, time: string | null) => `${date}T${hhmm(time) ?? '00:00'}`;
const endKey = (date: string, time: string | null) => `${date}T${hhmm(time) ?? '23:59'}`;

const fullName = (first?: string | null, last?: string | null) =>
    `${first ?? ''} ${last ?? ''}`.trim() || 'Onbekend';

interface Period {
    start_date: string;
    start_time: string | null;
    end_date: string;
    end_time: string | null;
}

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

    const s = startKey(period.start_date, period.start_time);
    const e = endKey(period.end_date, period.end_time);
    return rows.filter(
        (r) => startKey(r.start_date, r.start_time) < e && s < endKey(r.end_date, r.end_time),
    );
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
    photographers: CameraPhotographerOption[];
    mine: CameraRequestSummary[];
}> {
    const member = await requireActiveMember();
    if (!member.ok) return { events: [], photographers: [], mine: [] };

    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' });

    try {
        const [eventRows, photographerRows, requestRows] = await Promise.all([
            db
                .select({
                    id: schema.events.id,
                    name: schema.events.name,
                    event_date: schema.events.event_date,
                    event_time: schema.events.event_time,
                    event_date_end: schema.events.event_date_end,
                    event_time_end: schema.events.event_time_end,
                })
                .from(schema.events)
                .where(and(eq(schema.events.status, 'published'), gte(schema.events.event_date, today)))
                .orderBy(asc(schema.events.event_date), asc(schema.events.name))
                .limit(100),
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

        return {
            events: eventRows.map((e) => ({
                id: e.id,
                name: e.name,
                start_date: e.event_date,
                start_time: hhmm(e.event_time),
                end_date: e.event_date_end ?? e.event_date,
                end_time: hhmm(e.event_time_end),
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
        return { events: [], photographers: [], mine: [] };
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
                .where(and(eq(schema.events.id, data.event_id), eq(schema.events.status, 'published')))
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
