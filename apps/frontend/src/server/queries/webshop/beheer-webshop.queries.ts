import 'server-only';
import { requireBeheerFeature } from '@/server/auth/auth-utils';
import { fetchAllDropWindowsDb, fetchDropWindowByIdDb, fetchAllProductsDb, fetchProductByIdDb, fetchProductVariantsDb, fetchProductMediaDb } from '@/server/internal/webshop/webshop-product-db.utils';
import { fetchAllPreordersDb, fetchPreorderWithLinesDb } from '@/server/internal/webshop/webshop-preorder-db.utils';;

export async function getBeheerDropWindows() {
    await requireBeheerFeature('webshop');
    return fetchAllDropWindowsDb();
}

export async function getBeheerDropWindowById(id: number) {
    await requireBeheerFeature('webshop');
    return fetchDropWindowByIdDb(id);
}

export async function getBeheerProducts() {
    await requireBeheerFeature('webshop');
    return fetchAllProductsDb();
}

export async function getBeheerProductById(id: number) {
    await requireBeheerFeature('webshop');
    return fetchProductByIdDb(id);
}

export async function getBeheerProductVariants(productId: number) {
    await requireBeheerFeature('webshop');
    return fetchProductVariantsDb(productId);
}

export async function getBeheerProductMedia(productId: number) {
    await requireBeheerFeature('webshop');
    return fetchProductMediaDb(productId);
}

export async function getBeheerPreorders() {
    await requireBeheerFeature('webshop');
    return fetchAllPreordersDb();
}

export async function getBeheerPreorderById(id: number) {
    await requireBeheerFeature('webshop');
    return fetchPreorderWithLinesDb(id);
}

export async function getBeheerPickupList() {
    await requireBeheerFeature('webshop_pickup');
    const preorders = await fetchAllPreordersDb();
    return preorders.filter(p => p.status === 'completed');
}
