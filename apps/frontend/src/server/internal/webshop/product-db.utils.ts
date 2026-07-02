import 'server-only';
import { db, schema } from '@salvemundi/db';
import { eq, and, asc, inArray } from 'drizzle-orm';
import {
    webshopCatalogProductSchema,
    type WebshopCatalogProduct,
} from '@salvemundi/validations/schema/webshop.zod';

type ProductRow = typeof schema.webshop_products.$inferSelect;
type VariantRow = typeof schema.webshop_product_variants.$inferSelect;
type MediaRow = typeof schema.webshop_product_media.$inferSelect;
type DropWindowRow = typeof schema.webshop_drop_windows.$inferSelect;

type ProductInsert = typeof schema.webshop_products.$inferInsert;
type VariantInsert = typeof schema.webshop_product_variants.$inferInsert;
type MediaInsert = typeof schema.webshop_product_media.$inferInsert;
type DropWindowInsert = typeof schema.webshop_drop_windows.$inferInsert;

async function hydrateProducts(products: ProductRow[]): Promise<WebshopCatalogProduct[]> {
    if (products.length === 0) return [];

    const productIds = products.map(p => p.id);
    const dropWindowIds = [...new Set(products.map(p => p.drop_window_id).filter((id): id is number => id !== null))];

    const [mediaRows, variantRows, dropWindowRows] = await Promise.all([
        db.select({
            id: schema.webshop_product_media.id,
            product_id: schema.webshop_product_media.product_id,
            asset: schema.webshop_product_media.asset,
            display_order: schema.webshop_product_media.display_order,
            created_at: schema.webshop_product_media.created_at,
            asset_type: schema.directus_files.type,
        })
            .from(schema.webshop_product_media)
            .leftJoin(schema.directus_files, eq(schema.webshop_product_media.asset, schema.directus_files.id))
            .where(inArray(schema.webshop_product_media.product_id, productIds))
            .orderBy(asc(schema.webshop_product_media.display_order)),
        db.select().from(schema.webshop_product_variants).where(inArray(schema.webshop_product_variants.product_id, productIds)).orderBy(asc(schema.webshop_product_variants.display_order)),
        dropWindowIds.length > 0
            ? db.select().from(schema.webshop_drop_windows).where(inArray(schema.webshop_drop_windows.id, dropWindowIds))
            : Promise.resolve([] as DropWindowRow[]),
    ]);

    const dropWindowsById = new Map(dropWindowRows.map(dw => [dw.id, dw]));

    return products.map((product) => {
        const candidate = {
            ...product,
            media: mediaRows.filter(m => m.product_id === product.id),
            variants: variantRows.filter(v => v.product_id === product.id),
            drop_window: product.drop_window_id ? dropWindowsById.get(product.drop_window_id) ?? null : null,
        };

        const parsed = webshopCatalogProductSchema.safeParse(candidate);
        return parsed.success ? parsed.data : (candidate as unknown as WebshopCatalogProduct);
    });
}

export async function fetchCatalogProductsDb(category?: 'clothing' | 'item'): Promise<WebshopCatalogProduct[]> {
    const conditions = [eq(schema.webshop_products.is_active, true)];
    if (category) conditions.push(eq(schema.webshop_products.type, category));

    const products = await db.select().from(schema.webshop_products)
        .where(and(...conditions))
        .orderBy(asc(schema.webshop_products.display_order));

    const hydrated = await hydrateProducts(products);
    return hydrated.filter(p => p.drop_window?.status === 'open');
}

export async function fetchProductBySlugDb(slug: string): Promise<WebshopCatalogProduct | null> {
    const rows = await db.select().from(schema.webshop_products).where(eq(schema.webshop_products.slug, slug)).limit(1);
    if (rows.length === 0 || !rows[0].is_active) return null;

    const [hydrated] = await hydrateProducts(rows);
    return hydrated;
}

export async function fetchProductByIdDb(id: number): Promise<WebshopCatalogProduct | null> {
    const rows = await db.select().from(schema.webshop_products).where(eq(schema.webshop_products.id, id)).limit(1);
    if (rows.length === 0) return null;

    const [hydrated] = await hydrateProducts(rows);
    return hydrated;
}

// --- Admin: drop windows ---

export async function fetchAllDropWindowsDb(): Promise<DropWindowRow[]> {
    return db.select().from(schema.webshop_drop_windows).orderBy(asc(schema.webshop_drop_windows.closes_at));
}

export async function fetchDropWindowByIdDb(id: number): Promise<DropWindowRow | null> {
    const rows = await db.select().from(schema.webshop_drop_windows).where(eq(schema.webshop_drop_windows.id, id)).limit(1);
    return rows[0] ?? null;
}

export async function createDropWindowDb(data: DropWindowInsert): Promise<number | null> {
    const result = await db.insert(schema.webshop_drop_windows).values(data).returning({ id: schema.webshop_drop_windows.id });
    return result[0]?.id ?? null;
}

export async function updateDropWindowDb(id: number, data: Partial<DropWindowRow>): Promise<boolean> {
    if (Object.keys(data).length === 0) return true;
    const result = await db.update(schema.webshop_drop_windows).set(data as NonNullable<unknown>).where(eq(schema.webshop_drop_windows.id, id));
    return result.count > 0;
}

export async function deleteDropWindowDb(id: number): Promise<boolean> {
    const result = await db.delete(schema.webshop_drop_windows).where(eq(schema.webshop_drop_windows.id, id));
    return result.count > 0;
}

// --- Admin: products ---

export async function fetchAllProductsDb(): Promise<ProductRow[]> {
    return db.select().from(schema.webshop_products).orderBy(asc(schema.webshop_products.display_order));
}

export async function createProductDb(data: ProductInsert): Promise<number | null> {
    const result = await db.insert(schema.webshop_products).values(data).returning({ id: schema.webshop_products.id });
    return result[0]?.id ?? null;
}

export async function updateProductDb(id: number, data: Partial<ProductRow>): Promise<boolean> {
    if (Object.keys(data).length === 0) return true;
    const result = await db.update(schema.webshop_products).set(data as NonNullable<unknown>).where(eq(schema.webshop_products.id, id));
    return result.count > 0;
}

export async function deleteProductDb(id: number): Promise<boolean> {
    const result = await db.delete(schema.webshop_products).where(eq(schema.webshop_products.id, id));
    return result.count > 0;
}

// --- Admin: variants ---

export async function fetchProductVariantsDb(productId: number): Promise<VariantRow[]> {
    return db.select().from(schema.webshop_product_variants).where(eq(schema.webshop_product_variants.product_id, productId)).orderBy(asc(schema.webshop_product_variants.display_order));
}

export async function createProductVariantDb(data: VariantInsert): Promise<number | null> {
    const result = await db.insert(schema.webshop_product_variants).values(data).returning({ id: schema.webshop_product_variants.id });
    return result[0]?.id ?? null;
}

export async function updateProductVariantDb(id: number, data: Partial<VariantRow>): Promise<boolean> {
    if (Object.keys(data).length === 0) return true;
    const result = await db.update(schema.webshop_product_variants).set(data as NonNullable<unknown>).where(eq(schema.webshop_product_variants.id, id));
    return result.count > 0;
}

export async function deleteProductVariantDb(id: number): Promise<boolean> {
    const result = await db.delete(schema.webshop_product_variants).where(eq(schema.webshop_product_variants.id, id));
    return result.count > 0;
}

// --- Admin: media ---

export async function fetchProductMediaDb(productId: number): Promise<MediaRow[]> {
    return db.select().from(schema.webshop_product_media).where(eq(schema.webshop_product_media.product_id, productId)).orderBy(asc(schema.webshop_product_media.display_order));
}

export async function createProductMediaDb(data: MediaInsert): Promise<number | null> {
    const result = await db.insert(schema.webshop_product_media).values(data).returning({ id: schema.webshop_product_media.id });
    return result[0]?.id ?? null;
}

export async function deleteProductMediaDb(id: number): Promise<boolean> {
    const result = await db.delete(schema.webshop_product_media).where(eq(schema.webshop_product_media.id, id));
    return result.count > 0;
}
