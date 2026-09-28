import type { Metadata } from 'next';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import WebshopCatalogIsland from '@/components/islands/webshop/WebshopCatalogIsland';
import { getCatalogProducts } from '@/server/actions/public/webshop.actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Webshop | Salve Mundi',
    description: 'Bekijk de huidige preorder drop van Salve Mundi: kleding en items om vast te bestellen.'
};

export default async function WebshopPage() {
    const products = await getCatalogProducts();

    return (
        <PublicPageShell>
            <div className="mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6 sm:pt-12 sm:pb-24 lg:px-8">
                <div className="mb-8 space-y-2">
                    <h1 className="text-3xl font-bold text-(--theme-purple)/90">Webshop</h1>
                    <p className="max-w-2xl text-(--text-muted)">
                        Bestel je favoriete Salve Mundi kleding en items. Dit zijn preorders: je betaalt nu de
                        volledige prijs en je haalt je bestelling op tijdens een afgesproken afhaalmoment.
                    </p>
                </div>

                <WebshopCatalogIsland products={products} />
            </div>
        </PublicPageShell>
    );
}
