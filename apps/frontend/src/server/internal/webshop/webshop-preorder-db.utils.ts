import 'server-only';
import { db, schema } from '@salvemundi/db';
import { eq, desc, inArray, and, or, isNull, gte, sql } from 'drizzle-orm';

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
        if (!preorder) throw new Error('Bestelling aanmaken mislukt.');

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

export async function fetchPreorderByIdDb(id: number): Promise<PreorderRow | null> {
    const rows = await db.select().from(schema.webshop_preorders).where(eq(schema.webshop_preorders.id, id)).limit(1);
    return rows[0] ?? null;
}

export async function fetchPreorderWithLinesDb(id: number): Promise<PreorderWithLines | null> {
    const preorder = await fetchPreorderByIdDb(id);
    if (!preorder) return null;

    const lines = await db.select().from(schema.webshop_preorder_lines).where(eq(schema.webshop_preorder_lines.preorder_id, id));
    return { ...preorder, lines };
}

export async function fetchUserPreordersDb(userId: string): Promise<PreorderWithLines[]> {
    const preorders = await db.select().from(schema.webshop_preorders).where(eq(schema.webshop_preorders.user_id, userId)).orderBy(desc(schema.webshop_preorders.created_at));
    if (preorders.length === 0) return [];

    const lines = await db.select().from(schema.webshop_preorder_lines).where(inArray(schema.webshop_preorder_lines.preorder_id, preorders.map(p => p.id)));
    return preorders.map(p => ({ ...p, lines: lines.filter(l => l.preorder_id === p.id) }));
}

export async function fetchAllPreordersDb(): Promise<PreorderWithLines[]> {
    const preorders = await db.select().from(schema.webshop_preorders).orderBy(desc(schema.webshop_preorders.created_at));
    if (preorders.length === 0) return [];

    const lines = await db.select().from(schema.webshop_preorder_lines).where(inArray(schema.webshop_preorder_lines.preorder_id, preorders.map(p => p.id)));
    return preorders.map(p => ({ ...p, lines: lines.filter(l => l.preorder_id === p.id) }));
}

export async function updatePreorderDb(id: number, data: Partial<PreorderRow>): Promise<boolean> {
    if (Object.keys(data).length === 0) return true;
    const result = await db.update(schema.webshop_preorders).set(data as NonNullable<unknown>).where(eq(schema.webshop_preorders.id, id));
    return result.count > 0;
}
