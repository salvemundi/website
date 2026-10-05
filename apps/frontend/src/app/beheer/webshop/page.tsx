import type { Metadata } from 'next';
import Link from 'next/link';
import BeheerPageShell from '@/components/ui/beheer/BeheerPageShell';
import BeheerWebshopProductsIsland from '@/components/islands/beheer/webshop/BeheerWebshopProductsIsland';
import WebshopVisibilityIsland from '@/components/islands/beheer/webshop/WebshopVisibilityIsland';
import {
    getBeheerDropWindows,
    getBeheerProducts,
    getBeheerProductVariants,
    getBeheerProductMedia
} from '@/server/queries/webshop/beheer-webshop.queries';
import { getWebshopSettings } from '@/server/actions/public/webshop.actions';
import { checkBeheerAccess } from '@/server/actions/beheer/beheer-utils.actions';
import { COMMITTEES } from '@/shared/lib/permissions-config';
import { ClipboardList, ClipboardCheck } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Webshop Beheer | SV Salve Mundi'
};

async function loadWebshopAdminData() {
    const [dropWindows, products, settings] = await Promise.all([
        getBeheerDropWindows(),
        getBeheerProducts(),
        getWebshopSettings()
    ]);
    const productsWithDetails = await Promise.all(products.map(async (product) => {
        const [variants, media] = await Promise.all([
            getBeheerProductVariants(product.id),
            getBeheerProductMedia(product.id)
        ]);
        return { ...product, variants, media };
    }));
    return { dropWindows, products: productsWithDetails, settings };
}

export default async function AdminWebshopPage() {
    const [{ dropWindows, products, settings }, accessData] = await Promise.all([
        loadWebshopAdminData(),
        checkBeheerAccess()
    ]);
    const isBoardOrIct = Boolean(accessData.user?.committees.some(
        c => c.azure_group_id === COMMITTEES.BESTUUR || c.azure_group_id === COMMITTEES.ICT
    ));

    return (
        <BeheerPageShell 
             title="Webshop Beheer" 
             backHref="/beheer"
             actions={
                 <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
                     <div className="flex items-center gap-2">
                         <Link
                             href="/beheer/webshop/bestellingen"
                             className="beheer-button-secondary text-text-main"
                         >
                             <ClipboardList className="size-3.5" />
                             <span>Bestellingen</span>
                         </Link>
                         {isBoardOrIct && (
                             <Link
                                 href="/beheer/webshop/afhalen"
                                 className="beheer-button-secondary text-text-main"
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
            <BeheerWebshopProductsIsland 
                 initialDropWindows={dropWindows} 
                 initialProducts={products} 
             />
        </BeheerPageShell>
    );
}