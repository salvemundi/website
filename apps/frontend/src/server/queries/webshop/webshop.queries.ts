import 'server-only';
import { fetchCatalogProductsDb, fetchProductBySlugDb } from '@/server/internal/webshop/webshop-product-db.utils';;
import { type WebshopCatalogProduct } from '@salvemundi/validations/schema/webshop.zod';

export async function getCatalogProductsInternal(category?: 'clothing' | 'item'): Promise<WebshopCatalogProduct[]> {
    return fetchCatalogProductsDb(category);
}

export async function getProductBySlugInternal(slug: string): Promise<WebshopCatalogProduct | null> {
    return fetchProductBySlugDb(slug);
}
