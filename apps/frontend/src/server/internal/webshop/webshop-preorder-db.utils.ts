import 'server-only';
import { db, schema } from '@salvemundi/db';
import { eq, desc, inArray, and, or, isNull, gte, sql } from 'drizzle-orm';
import { safeConsoleError } from '@/server/utils/logger';

type PreorderRow = typeof schema.webshop_preorders.$inferSelect;
type PreorderLineRow = typeof schema.webshop_preorder_lines.$inferSelect;
type PreorderInsert = typeof schema.webshop_preorders.$inferInsert;
type PreorderLineInsert = typeof schema.webshop_preorder_lines.$inferInsert;

export interface PreorderWithLines extends PreorderRow {
    lines: PreorderLineRow[];
}

export class InsufficientStockError extends Error {
    constructor() {
        super('Niet genoeg voorraad meer beschikbaar.');
        this.name = 'InsufficientStockError';
    }
}

export async function insertPreorderDb(data: PreorderInsert): Promise<number | null> {
    const result = await db.insert(schema.webshop_preorders).values(data).returning({ id: schema.webshop_preorders.id });
    return result[0]?.id ?? null;
}

export async function insertPreorderLinesDb(lines: PreorderLineInsert[]): Promise<void> {
    if (lines.length === 0) return;
    await db.insert(schema.webshop_preorder_lines).values(lines);
}

// Reserves the product's stock (when tracked - NULL stock_quantity means unlimited) and
// creates the preorder + line atomically, so concurrent checkouts can never oversell a
// limited drop.
export async function insertPreorderWithStockDb(
    preorderData: PreorderInsert,
    line: Omit<PreorderLineInsert, 'preorder_id'>
): Promise<number> {
    const quantity = line.quantity ?? 1;

    return db.transaction(async (tx) => {
        if (line.product_id) {
            const updated = await tx.update(schema.webshop_products)
                .set({ stock_quantity: sql`${schema.webshop_products.stock_quantity} - ${quantity}` })
                .where(and(
                    eq(schema.webshop_products.id, line.product_id),
                    or(isNull(schema.webshop_products.stock_quantity), gte(schema.webshop_products.stock_quantity, quantity))
                ))
                .returning({ id: schema.webshop_products.id });
            if (updated.length === 0) throw new InsufficientStockError();
        }

        const [preorder] = await tx.insert(schema.webshop_preorders).values(preorderData).returning({ id: schema.webshop_preorders.id });

        await tx.insert(schema.webshop_preorder_lines).values({ ...line, preorder_id: preorder.id });

        return preorder.id;
    });
}

// Restores stock for a cancelled preorder's lines. Safe to call even when stock isn't
// tracked (NULL + qty stays NULL).
export async function restoreStockForLinesDb(lines: Pick<PreorderLineRow, 'product_id' | 'quantity'>[]): Promise<void> {
    await db.transaction(async (tx) => {
        for (const line of lines) {
            if (line.product_id) {
                await tx.update(schema.webshop_products)
                    .set({ stock_quantity: sql`${schema.webshop_products.stock_quantity} + ${line.quantity}` })
                    .where(eq(schema.webshop_products.id, line.product_id));
            }
        }
    });
}

const LINE_COLUMNS_WITHOUT_CUSTOM_FIELDS = {
    id: schema.webshop_preorder_lines.id,
    preorder_id: schema.webshop_preorder_lines.preorder_id,
    product_id: schema.webshop_preorder_lines.product_id,
    variant_id: schema.webshop_preorder_lines.variant_id,
    quantity: schema.webshop_preorder_lines.quantity,
    unit_price: schema.webshop_preorder_lines.unit_price,
    product_name_snapshot: schema.webshop_preorder_lines.product_name_snapshot,
    variant_label_snapshot: schema.webshop_preorder_lines.variant_label_snapshot,
};

// Fetches the lines of the given preorders. `custom_field_values` was added later
// (packages/db/drizzle/webshop_custom_fields.sql); when that migration has not been applied
// to the database yet, `select *` throws and takes every order page down with it. Fall back to
// the columns that always exist so orders stay readable (custom field answers are then empty).
async function fetchLinesForPreordersDb(preorderIds: number[]): Promise<PreorderLineRow[]> {
    if (preorderIds.length === 0) return [];
    const where = inArray(schema.webshop_preorder_lines.preorder_id, preorderIds);
    try {
        return await db.select().from(schema.webshop_preorder_lines).where(where);
    } catch (error) {
        safeConsoleError('[webshop-preorder-db.utils.ts][fetchLinesForPreordersDb] custom_field_values niet beschikbaar, fallback zonder die kolom (migratie webshop_custom_fields.sql toegepast?)', error);
        const rows = await db.select(LINE_COLUMNS_WITHOUT_CUSTOM_FIELDS).from(schema.webshop_preorder_lines).where(where);
        return rows.map(row => ({ ...row, custom_field_values: null }));
    }
}

export async function fetchPreorderByIdDb(id: number): Promise<PreorderRow | null> {
    const rows = await db.select().from(schema.webshop_preorders).where(eq(schema.webshop_preorders.id, id)).limit(1);
    return rows[0] ?? null;
}

export async function fetchPreorderWithLinesDb(id: number): Promise<PreorderWithLines | null> {
    const preorder = await fetchPreorderByIdDb(id);
    if (!preorder) return null;

    const lines = await fetchLinesForPreordersDb([id]);
    return { ...preorder, lines };
}

export async function fetchUserPreordersDb(userId: string): Promise<PreorderWithLines[]> {
    const preorders = await db.select().from(schema.webshop_preorders).where(eq(schema.webshop_preorders.user_id, userId)).orderBy(desc(schema.webshop_preorders.created_at));
    if (preorders.length === 0) return [];

    const lines = await fetchLinesForPreordersDb(preorders.map(p => p.id));
    return preorders.map(p => ({ ...p, lines: lines.filter(l => l.preorder_id === p.id) }));
}

export async function fetchAllPreordersDb(): Promise<PreorderWithLines[]> {
    const preorders = await db.select().from(schema.webshop_preorders).orderBy(desc(schema.webshop_preorders.created_at));
    if (preorders.length === 0) return [];

    const lines = await fetchLinesForPreordersDb(preorders.map(p => p.id));
    return preorders.map(p => ({ ...p, lines: lines.filter(l => l.preorder_id === p.id) }));
}

export async function updatePreorderDb(id: number, data: Partial<PreorderRow>): Promise<boolean> {
    if (Object.keys(data).length === 0) return true;
    const result = await db.update(schema.webshop_preorders).set(data as NonNullable<unknown>).where(eq(schema.webshop_preorders.id, id));
    return result.count > 0;
}
