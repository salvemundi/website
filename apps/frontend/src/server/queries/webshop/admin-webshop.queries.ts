import 'server-only';
import { requireAdminResource } from '@/server/auth/auth-utils';
import { AdminResource } from '@/shared/lib/permissions-config';
import { fetchAllDropWindowsDb, fetchDropWindowByIdDb, fetchAllProductsDb, fetchProductByIdDb, fetchProductVariantsDb, fetchProductMediaDb } from '@/server/internal/webshop/webshop-product-db.utils';
import { fetchAllPreordersDb, fetchPreorderWithLinesDb } from '@/server/internal/webshop/webshop-preorder-db.utils';;

export async function getAdminDropWindows() {
    await requireAdminResource(AdminResource.Webshop);
    return fetchAllDropWindowsDb();
}

export async function getAdminDropWindowById(id: number) {
    await requireAdminResource(AdminResource.Webshop);
    return fetchDropWindowByIdDb(id);
}

export async function getAdminProducts() {
    await requireAdminResource(AdminResource.Webshop);
    return fetchAllProductsDb();
}

export async function getAdminProductById(id: number) {
    await requireAdminResource(AdminResource.Webshop);
    return fetchProductByIdDb(id);
}

export async function getAdminProductVariants(productId: number) {
    await requireAdminResource(AdminResource.Webshop);
    return fetchProductVariantsDb(productId);
}

export async function getAdminProductMedia(productId: number) {
    await requireAdminResource(AdminResource.Webshop);
    return fetchProductMediaDb(productId);
}

export async function getAdminPreorders() {
    await requireAdminResource(AdminResource.Webshop);
    return fetchAllPreordersDb();
}

export async function getAdminPreorderById(id: number) {
    await requireAdminResource(AdminResource.Webshop);
    return fetchPreorderWithLinesDb(id);
}
