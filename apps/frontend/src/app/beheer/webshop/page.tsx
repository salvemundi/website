import type { Metadata } from 'next';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import AdminWebshopProductsIsland from '@/components/islands/admin/webshop/AdminWebshopProductsIsland';
import {
    getAdminDropWindows,
    getAdminProducts,
    getAdminProductVariants,
    getAdminProductMedia
} from '@/server/queries/admin-webshop.queries';
import { type AdminDropWindow, type AdminProduct } from '@/components/islands/admin/webshop/webshop-admin-types';

export const metadata: Metadata = {
    title: 'Webshop Beheer | SV Salve Mundi'
};

async function loadWebshopAdminData(): Promise<
    | { success: true; dropWindows: AdminDropWindow[]; products: AdminProduct[] }
    | { success: false; error: string }
> {
    try {
        const [dropWindows, products] = await Promise.all([
            getAdminDropWindows(),
            getAdminProducts()
        ]);

        const productsWithDetails = await Promise.all(products.map(async (product) => {
            const [variants, media] = await Promise.all([
                getAdminProductVariants(product.id),
                getAdminProductMedia(product.id)
            ]);
            return { ...product, variants, media };
        }));

        return { success: true, dropWindows, products: productsWithDetails };
    } catch (e: unknown) {
        return { success: false, error: (e instanceof Error) ? e.message : 'Niet geautoriseerd' };
    }
}

export default async function AdminWebshopPage() {
    const result = await loadWebshopAdminData();

    if (!result.success) {
        return <AdminUnauthorized title="Geen Toegang" description={result.error} />;
    }

    return (
        <AdminPageShell title="Webshop Beheer" subtitle="Beheer drops, producten en varianten" backHref="/beheer" hideToolbar={true}>
            <AdminWebshopProductsIsland initialDropWindows={result.dropWindows} initialProducts={result.products} />
        </AdminPageShell>
    );
}
