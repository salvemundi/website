import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import BackButton from '@/components/ui/navigation/BackButton';
import WebshopGalleryIsland from '@/components/islands/webshop/WebshopGalleryIsland';
import WebshopProductDetailIsland from '@/components/islands/webshop/WebshopProductDetailIsland';
import { getProductBySlug } from '@/server/actions/public/webshop.actions';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { type MembershipUserData } from '@/components/islands/account/MembershipStatusIsland';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const product = await getProductBySlug(slug);

    if (!product) {
        return { title: 'Product niet gevonden | Salve Mundi' };
    }

    return {
        title: `${product.name} | Webshop | Salve Mundi`,
        description: product.description?.slice(0, 160) || 'Bekijk dit product in de Salve Mundi webshop.'
    };
}

export default async function WebshopProductPage({ params }: PageProps) {
    await connection();
    const { slug } = await params;

    const [product, session] = await Promise.all([
        getProductBySlug(slug),
        getEnrichedSession()
    ]);

    if (!product) notFound();

    const user = session?.user as MembershipUserData | undefined;
    const isLoggedIn = !!session?.user;
    const isMember = user?.membership_status === 'active';

    return (
        <PublicPageShell>
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-8 pb-16 sm:pb-24">
                <div className="mb-6">
                    <BackButton href="/webshop" title="Terug naar webshop" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    <WebshopGalleryIsland media={product.media} productName={product.name} />
                    <WebshopProductDetailIsland product={product} isLoggedIn={isLoggedIn} isMember={isMember} />
                </div>
            </div>
        </PublicPageShell>
    );
}
