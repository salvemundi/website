import type { Metadata } from 'next';
import Link from 'next/link';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import AdminWebshopProductsIsland from '@/components/islands/admin/webshop/AdminWebshopProductsIsland';
import WebshopVisibilityIsland from '@/components/islands/admin/webshop/WebshopVisibilityIsland';
import {
    getAdminDropWindows,
    getAdminProducts,
    getAdminProductVariants,
    getAdminProductMedia
} from '@/server/queries/webshop/admin-webshop.queries';
import { getWebshopSettings } from '@/server/actions/public/webshop.actions';
import { ClipboardList } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Webshop Beheer | SV Salve Mundi'
};

async function loadWebshopAdminData() {
    const [dropWindows, products, settings] = await Promise.all([
        getAdminDropWindows(),
        getAdminProducts(),
        getWebshopSettings()
    ]);
    const productsWithDetails = await Promise.all(products.map(async (product) => {
        const [variants, media] = await Promise.all([
            getAdminProductVariants(product.id),
            getAdminProductMedia(product.id)
        ]);
        return { ...product, variants, media };
    }));
    return { dropWindows, products: productsWithDetails, settings };
}

export default async function AdminWebshopPage() {
    const { dropWindows, products, settings } = await loadWebshopAdminData();

    return (
        <AdminPageShell 
             title="Webshop Beheer" 
             backHref="/beheer"
             actions={
                 <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                     <div className="flex items-center gap-2">
                         <Link
                             href="/beheer/webshop/bestellingen"
                             className="flex items-center justify-center gap-2 px-4 py-2 bg-bg-card border border-border-color text-text-main rounded-xl text-xs font-semibold hover:border-theme-purple hover:bg-theme-purple/5 transition-all shadow-sm"
                         >
                             <ClipboardList className="h-3.5 w-3.5" />
                             <span>Bestellingen</span>
                         </Link>
                         <WebshopVisibilityIsland initialVisible={settings.show} />
                     </div>
                 </div>
             }
        >
            <AdminWebshopProductsIsland 
                 initialDropWindows={dropWindows} 
                 initialProducts={products} 
             />
        </AdminPageShell>
    );
}