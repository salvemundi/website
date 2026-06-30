import 'server-only';
import { db, schema } from '@salvemundi/db';
import { eq, desc, inArray } from 'drizzle-orm';

type PreorderRow = typeof schema.webshop_preorders.$inferSelect;
type PreorderLineRow = typeof schema.webshop_preorder_lines.$inferSelect;
type PreorderInsert = typeof schema.webshop_preorders.$inferInsert;
type PreorderLineInsert = typeof schema.webshop_preorder_lines.$inferInsert;

export interface PreorderWithLines extends PreorderRow {
    lines: PreorderLineRow[];
}

export async function insertPreorderDb(data: PreorderInsert): Promise<number | null> {
    const result = await db.insert(schema.webshop_preorders).values(data).returning({ id: schema.webshop_preorders.id });
    return result[0]?.id ?? null;
}

export async function insertPreorderLinesDb(lines: PreorderLineInsert[]): Promise<void> {
    if (lines.length === 0) return;
    await db.insert(schema.webshop_preorder_lines).values(lines);
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
