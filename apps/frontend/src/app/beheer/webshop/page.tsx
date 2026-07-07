import type { Metadata } from 'next';
import Link from 'next/link';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { getPermissions } from '@/shared/lib/permissions';
import { redirect } from 'next/navigation';
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
import { type AdminDropWindow, type AdminProduct } from '@/components/islands/admin/webshop/webshop-admin-types';
import { ClipboardList } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Webshop Beheer | SV Salve Mundi'
};

async function loadWebshopAdminData(): Promise<
    | { success: true; dropWindows: AdminDropWindow[]; products: AdminProduct[]; settings: { show: boolean } }
    | { success: false; error: string }
> {
    try {
        const session = await getEnrichedSession();
        if (!session?.user) redirect('/?needLogin=true');
        const permissions = getPermissions(session.user.committees);
        if (!permissions.includes('webshop')) {
            return { success: false as const, error: 'unauthorized' };
        }

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
        return { success: true, dropWindows, products: productsWithDetails, settings };
    } catch (error: unknown) {
        return { success: false, error: (error instanceof Error) ? error.message : 'Niet geautoriseerd' };
    }
}

export default async function AdminWebshopPage() {
    const result = await loadWebshopAdminData();

    if (!result.success) {
        if (result.error === 'unauthorized') return <AdminUnauthorized title="Webshop Beheer" backHref="/beheer" />;
        return <AdminUnauthorized title="Geen Toegang" description={result.error} />;
    }
    return (
        <AdminPageShell 
             title="Webshop Beheer" 
             subtitle="Beheer drops, producten en varianten" 
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
                         <WebshopVisibilityIsland initialVisible={result.settings.show} />
                     </div>
                 </div>
             }
        >
            <AdminWebshopProductsIsland 
                 initialDropWindows={result.dropWindows} 
                 initialProducts={result.products} 
             />
        </AdminPageShell>
    );
}