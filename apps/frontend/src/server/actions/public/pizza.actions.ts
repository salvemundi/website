'use server';

import { getEnrichedSession } from '@/server/auth/auth-utils';
import { revalidatePath } from 'next/cache';
import { db, schema } from '@salvemundi/db';
import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import {
    createPizzaRoundSchema,
    placePizzaOrderSchema,
    type PizzaRoundDetail,
    type PizzaRoundStatus,
    type PizzaRoundSummary,
} from '@salvemundi/validations';
import { safeConsoleError } from '@/server/utils/logger';

type Result = { success: true } | { success: false; error: string };
type IdResult = { success: true; id: string } | { success: false; error: string };

const uuidSchema = z.string().uuid();
const GENERIC_ERROR = 'Er ging iets mis. Probeer het later opnieuw.';
const RATE_LIMIT_ERROR = 'Te veel acties. Probeer het over een minuut opnieuw.';
const ORDER_PROCESSED_ERROR = 'De aanmaker heeft deze bestelling al verwerkt';
const MAX_ORDERS_PER_ROUND = 5;

const fullName = (first?: string | null, last?: string | null) =>
    `${first ?? ''} ${last ?? ''}`.trim() || 'Onbekend';

const toIso = (v: string) => new Date(v).toISOString();

async function limit(key: string, max: number): Promise<string | null> {
    try {
        const { enforceRateLimit } = await import('@/server/utils/ratelimit');
        await enforceRateLimit(key, max, 60, RATE_LIMIT_ERROR);
        return null;
    } catch (e) {
        return e instanceof Error && e.message === RATE_LIMIT_ERROR ? RATE_LIMIT_ERROR : GENERIC_ERROR;
    }
}

function revalidate(roundId?: string) {
    revalidatePath('/pizza');
    if (roundId) revalidatePath(`/pizza/${roundId}`);
}

async function summaries(whereClause: ReturnType<typeof eq> | ReturnType<typeof and> | ReturnType<typeof or>): Promise<PizzaRoundSummary[]> {
    const rows = await db
        .select({
            r: schema.pizza_rounds,
            first_name: schema.directus_users.first_name,
            last_name: schema.directus_users.last_name,
        })
        .from(schema.pizza_rounds)
        .leftJoin(schema.directus_users, eq(schema.pizza_rounds.creator_id, schema.directus_users.id))
        .where(whereClause)
        .orderBy(desc(schema.pizza_rounds.closes_at));
    if (rows.length === 0) return [];

    const totals = await db
        .select({
            round_id: schema.pizza_orders.round_id,
            count: sql<number>`count(*)::int`,
            total: sql<string>`coalesce(sum(${schema.pizza_orders.price}), 0)`,
        })
        .from(schema.pizza_orders)
        .where(inArray(schema.pizza_orders.round_id, rows.map((x) => x.r.id)))
        .groupBy(schema.pizza_orders.round_id);
    const byRound = new Map(totals.map((t) => [t.round_id, t]));
    const now = Date.now();

    return rows.map(({ r, first_name, last_name }) => {
        const t = byRound.get(r.id);
        const status = r.status as PizzaRoundStatus;
        return {
            id: r.id,
            title: r.title,
            creatorName: fullName(first_name, last_name),
            creatorId: r.creator_id,
            closesAt: toIso(r.closes_at),
            status,
            orderCount: t ? Number(t.count) : 0,
            totalAmount: t ? Number(t.total) : 0,
            isOpen: status === 'open' && new Date(r.closes_at).getTime() > now,
        };
    });
}

export async function getPizzaOverview(): Promise<{ open: PizzaRoundSummary[]; mine: PizzaRoundSummary[] }> {
    try {
        const session = await getEnrichedSession();
        const userId = session?.user.id;
        if (!userId) return { open: [], mine: [] };

        const [open, mine] = await Promise.all([
            summaries(and(eq(schema.pizza_rounds.status, 'open'), sql`${schema.pizza_rounds.closes_at} > now()`)),
            summaries(
                or(
                    eq(schema.pizza_rounds.creator_id, userId),
                    inArray(
                        schema.pizza_rounds.id,
                        db
                            .select({ id: schema.pizza_orders.round_id })
                            .from(schema.pizza_orders)
                            .where(eq(schema.pizza_orders.user_id, userId)),
                    ),
                ),
            ),
        ]);
        return { open, mine };
    } catch (error) {
        safeConsoleError('[pizza] getPizzaOverview failed', error);
        return { open: [], mine: [] };
    }
}

export async function getPizzaRound(id: string): Promise<PizzaRoundDetail | null> {
    try {
        const session = await getEnrichedSession();
        const userId = session?.user.id;
        if (!userId || !uuidSchema.safeParse(id).success) return null;

        const round = (await summaries(eq(schema.pizza_rounds.id, id))).at(0);
        if (!round) return null;
        const raw = (await db
            .select({ note: schema.pizza_rounds.note })
            .from(schema.pizza_rounds)
            .where(eq(schema.pizza_rounds.id, id))).at(0);

        const rows = await db
            .select({
                o: schema.pizza_orders,
                first_name: schema.directus_users.first_name,
                last_name: schema.directus_users.last_name,
            })
            .from(schema.pizza_orders)
            .leftJoin(schema.directus_users, eq(schema.pizza_orders.user_id, schema.directus_users.id))
            .where(eq(schema.pizza_orders.round_id, id))
            .orderBy(schema.pizza_orders.created_at);

        return {
            round: { ...round, note: raw?.note ?? null },
            orders: rows.map(({ o, first_name, last_name }) => ({
                id: o.id,
                userId: o.user_id,
                userName: fullName(first_name, last_name),
                itemName: o.item_name,
                size: o.size,
                note: o.note,
                price: Number(o.price),
                addedToOrderAt: o.added_to_order_at ? toIso(o.added_to_order_at) : null,
                paidAt: o.paid_at ? toIso(o.paid_at) : null,
                isMine: o.user_id === userId,
            })),
            isCreator: round.creatorId === userId,
            currentUserId: userId,
        };
    } catch (error) {
        safeConsoleError('[pizza] getPizzaRound failed', error);
        return null;
    }
}

async function requireUser(key: string, max: number): Promise<{ userId: string } | { error: string }> {
    const session = await getEnrichedSession();
    const userId = session?.user.id;
    if (!userId) return { error: 'Je moet ingelogd zijn.' };
    const rl = await limit(`${key}:${userId}`, max);
    if (rl) return { error: rl };
    return { userId };
}

const isRoundOpen = (r: { status: string; closes_at: string }) =>
    r.status === 'open' && new Date(r.closes_at).getTime() > Date.now();

export async function createPizzaRound(data: unknown): Promise<IdResult> {
    try {
        const auth = await requireUser('pizza-create-round', 5);
        if ('error' in auth) return { success: false, error: auth.error };
        const parsed = createPizzaRoundSchema.safeParse(data);
        if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Ongeldige gegevens.' };

        const row = (await db
            .insert(schema.pizza_rounds)
            .values({
                creator_id: auth.userId,
                title: parsed.data.title,
                note: parsed.data.note || null,
                closes_at: parsed.data.closes_at.toISOString(),
            })
            .returning({ id: schema.pizza_rounds.id })).at(0);
        if (!row) return { success: false, error: GENERIC_ERROR };
        revalidate(row.id);
        return { success: true, id: row.id };
    } catch (error) {
        safeConsoleError('[pizza] createPizzaRound failed', error);
        return { success: false, error: GENERIC_ERROR };
    }
}

export async function placePizzaOrder(roundId: string, data: unknown): Promise<IdResult> {
    try {
        const auth = await requireUser('pizza-order', 20);
        if ('error' in auth) return { success: false, error: auth.error };
        if (!uuidSchema.safeParse(roundId).success) return { success: false, error: 'Ongeldige ronde.' };
        const parsed = placePizzaOrderSchema.safeParse(data);
        if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Ongeldige gegevens.' };

        const round = (await db.select().from(schema.pizza_rounds).where(eq(schema.pizza_rounds.id, roundId))).at(0);
        if (!round) return { success: false, error: 'Ronde niet gevonden.' };
        if (!isRoundOpen(round)) return { success: false, error: 'Deze ronde is gesloten.' };

        const existing = (await db
            .select({ count: sql<number>`count(*)::int` })
            .from(schema.pizza_orders)
            .where(and(eq(schema.pizza_orders.round_id, roundId), eq(schema.pizza_orders.user_id, auth.userId)))).at(0);
        if ((existing?.count ?? 0) >= MAX_ORDERS_PER_ROUND) {
            return { success: false, error: `Je kunt maximaal ${MAX_ORDERS_PER_ROUND} bestellingen per ronde plaatsen.` };
        }

        const row = (await db
            .insert(schema.pizza_orders)
            .values({
                round_id: roundId,
                user_id: auth.userId,
                item_name: parsed.data.item_name,
                size: parsed.data.size || null,
                note: parsed.data.note || null,
                price: parsed.data.price.toFixed(2),
                pay_confirmed_at: new Date().toISOString(),
            })
            .returning({ id: schema.pizza_orders.id })).at(0);
        if (!row) return { success: false, error: GENERIC_ERROR };
        revalidate(roundId);
        return { success: true, id: row.id };
    } catch (error) {
        safeConsoleError('[pizza] placePizzaOrder failed', error);
        return { success: false, error: GENERIC_ERROR };
    }
}

async function loadOrder(orderId: string) {
    if (!uuidSchema.safeParse(orderId).success) return null;
    const row = (await db
        .select({ o: schema.pizza_orders, r: schema.pizza_rounds })
        .from(schema.pizza_orders)
        .innerJoin(schema.pizza_rounds, eq(schema.pizza_orders.round_id, schema.pizza_rounds.id))
        .where(eq(schema.pizza_orders.id, orderId))).at(0);
    return row;
}

export async function updatePizzaOrder(orderId: string, data: unknown): Promise<Result> {
    try {
        const auth = await requireUser('pizza-order-update', 20);
        if ('error' in auth) return { success: false, error: auth.error };
        const parsed = placePizzaOrderSchema.safeParse(data);
        if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Ongeldige gegevens.' };

        const row = await loadOrder(orderId);
        if (!row) return { success: false, error: 'Bestelling niet gevonden.' };
        if (row.o.user_id !== auth.userId) return { success: false, error: 'Je mag alleen je eigen bestelling wijzigen.' };
        if (!isRoundOpen(row.r)) return { success: false, error: 'Deze ronde is gesloten.' };
        if (row.o.added_to_order_at || row.o.paid_at) return { success: false, error: ORDER_PROCESSED_ERROR };

        await db
            .update(schema.pizza_orders)
            .set({
                item_name: parsed.data.item_name,
                size: parsed.data.size || null,
                note: parsed.data.note || null,
                price: parsed.data.price.toFixed(2),
            })
            .where(eq(schema.pizza_orders.id, orderId));
        revalidate(row.r.id);
        return { success: true };
    } catch (error) {
        safeConsoleError('[pizza] updatePizzaOrder failed', error);
        return { success: false, error: GENERIC_ERROR };
    }
}

export async function deletePizzaOrder(orderId: string): Promise<Result> {
    try {
        const auth = await requireUser('pizza-order-delete', 20);
        if ('error' in auth) return { success: false, error: auth.error };

        const row = await loadOrder(orderId);
        if (!row) return { success: false, error: 'Bestelling niet gevonden.' };
        const isCreator = row.r.creator_id === auth.userId;
        if (row.o.user_id !== auth.userId && !isCreator) {
            return { success: false, error: 'Je mag deze bestelling niet verwijderen.' };
        }
        if (isCreator) {
            if (row.r.status === 'paid' || row.o.paid_at) {
                return { success: false, error: 'Deze bestelling is al betaald.' };
            }
        } else {
            if (!isRoundOpen(row.r)) return { success: false, error: 'Deze ronde is gesloten.' };
            if (row.o.added_to_order_at || row.o.paid_at) return { success: false, error: ORDER_PROCESSED_ERROR };
        }

        await db.delete(schema.pizza_orders).where(eq(schema.pizza_orders.id, orderId));
        revalidate(row.r.id);
        return { success: true };
    } catch (error) {
        safeConsoleError('[pizza] deletePizzaOrder failed', error);
        return { success: false, error: GENERIC_ERROR };
    }
}

async function setOrderTimestamp(
    key: string,
    orderId: string,
    field: 'added_to_order_at' | 'paid_at',
    value: boolean,
): Promise<Result> {
    try {
        const auth = await requireUser(key, 60);
        if ('error' in auth) return { success: false, error: auth.error };

        const row = await loadOrder(orderId);
        if (!row) return { success: false, error: 'Bestelling niet gevonden.' };
        if (row.r.creator_id !== auth.userId) return { success: false, error: 'Alleen de aanmaker van de ronde mag dit.' };

        await db
            .update(schema.pizza_orders)
            .set({ [field]: value ? new Date().toISOString() : null })
            .where(eq(schema.pizza_orders.id, orderId));
        revalidate(row.r.id);
        return { success: true };
    } catch (error) {
        safeConsoleError(`[pizza] ${key} failed`, error);
        return { success: false, error: GENERIC_ERROR };
    }
}

export async function setOrderAdded(orderId: string, added: boolean): Promise<Result> {
    return setOrderTimestamp('pizza-order-added', orderId, 'added_to_order_at', added);
}

export async function setOrderPaid(orderId: string, paid: boolean): Promise<Result> {
    return setOrderTimestamp('pizza-order-paid', orderId, 'paid_at', paid);
}

async function setRoundStatus(key: string, roundId: string, status: 'closed' | 'paid'): Promise<Result> {
    try {
        const auth = await requireUser(key, 20);
        if ('error' in auth) return { success: false, error: auth.error };
        if (!uuidSchema.safeParse(roundId).success) return { success: false, error: 'Ongeldige ronde.' };

        const round = (await db.select().from(schema.pizza_rounds).where(eq(schema.pizza_rounds.id, roundId))).at(0);
        if (!round) return { success: false, error: 'Ronde niet gevonden.' };
        if (round.creator_id !== auth.userId) return { success: false, error: 'Alleen de aanmaker van de ronde mag dit.' };

        const fromOk =
            status === 'closed'
                ? eq(schema.pizza_rounds.status, 'open')
                : or(
                      eq(schema.pizza_rounds.status, 'closed'),
                      and(eq(schema.pizza_rounds.status, 'open'), sql`${schema.pizza_rounds.closes_at} <= now()`),
                  );
        const updated = await db
            .update(schema.pizza_rounds)
            .set({ status })
            .where(and(eq(schema.pizza_rounds.id, roundId), fromOk))
            .returning({ id: schema.pizza_rounds.id });
        if (updated.length === 0) {
            return {
                success: false,
                error: status === 'closed' ? 'Deze ronde kan niet meer gesloten worden.' : 'Deze ronde kan nog niet als betaald worden gemarkeerd.',
            };
        }
        revalidate(roundId);
        return { success: true };
    } catch (error) {
        safeConsoleError(`[pizza] ${key} failed`, error);
        return { success: false, error: GENERIC_ERROR };
    }
}

export async function closePizzaRound(roundId: string): Promise<Result> {
    return setRoundStatus('pizza-round-close', roundId, 'closed');
}

export async function markPizzaRoundPaid(roundId: string): Promise<Result> {
    return setRoundStatus('pizza-round-paid', roundId, 'paid');
}
