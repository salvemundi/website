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
import { checkAdminAccess } from '@/server/actions/admin/admin-utils.actions';
import { COMMITTEES } from '@/shared/lib/permissions-config';
import { ClipboardList, ClipboardCheck } from 'lucide-react';

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
    const [{ dropWindows, products, settings }, accessData] = await Promise.all([
        loadWebshopAdminData(),
        checkAdminAccess()
    ]);
    const isBoardOrIct = Boolean(accessData.user?.committees.some(
        c => c.azure_group_id === COMMITTEES.BESTUUR || c.azure_group_id === COMMITTEES.ICT
    ));

    return (
        <AdminPageShell 
             title="Webshop Beheer" 
             backHref="/beheer"
             actions={
                 <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
                     <div className="flex items-center gap-2">
                         <Link
                             href="/beheer/webshop/bestellingen"
                             className="flex items-center justify-center gap-2 rounded-xl border border-border-color bg-bg-card px-4 py-2 text-xs font-semibold text-text-main shadow-sm transition-all hover:border-theme-purple hover:bg-theme-purple/5"
                         >
                             <ClipboardList className="size-3.5" />
                             <span>Bestellingen</span>
                         </Link>
                         {isBoardOrIct && (
                             <Link
                                 href="/beheer/webshop/afhalen"
                                 className="flex items-center justify-center gap-2 rounded-xl border border-border-color bg-bg-card px-4 py-2 text-xs font-semibold text-text-main shadow-sm transition-all hover:border-theme-purple hover:bg-theme-purple/5"
                             >
                                 <ClipboardCheck className="size-3.5" />
                                 <span>Afhaallijst</span>
                             </Link>
                         )}
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