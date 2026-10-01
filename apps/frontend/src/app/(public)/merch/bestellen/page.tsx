import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import BackButton from '@/components/ui/navigation/BackButton';
import WebshopCheckoutIsland from '@/components/islands/webshop/WebshopCheckoutIsland';
import { getProductBySlug } from '@/server/actions/public/webshop.actions';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { type MembershipUserData } from '@/components/islands/account/MembershipStatusIsland';
import { Lock, LogIn, ShieldAlert } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Bestellen | Webshop | Salve Mundi'
};

interface PageProps {
    searchParams: Promise<{ product?: string }>;
}

function BlockedCard({ icon: Icon, title, message }: { icon: typeof Lock; title: string; message: string }) {
    return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
            <div className="w-full max-w-md rounded-[1.75rem] border border-(--border-color) bg-(--bg-card) p-12 text-center shadow-xl">
                <Icon className="mx-auto mb-6 size-16 text-(--theme-purple)" />
                <h1 className="mb-4 text-2xl font-black text-(--theme-purple)">{title}</h1>
                <p className="mb-8 leading-relaxed text-(--text-muted)">{message}</p>
                <BackButton href="/merch" text="Terug naar merch" />
            </div>
        </div>
    );
}

export default async function WebshopBestellenPage({ searchParams }: PageProps) {
    await connection();
    const { product: slug } = await searchParams;

    if (!slug) notFound();

    const [product, session] = await Promise.all([
        getProductBySlug(slug),
        getEnrichedSession()
    ]);

    if (!product) notFound();

    const user = session?.user as MembershipUserData | undefined;
    const isLoggedIn = !!session?.user;
    const isMember = user?.membership_status === 'active';
    const isDropOpen = !product.drop_window || product.drop_window.status === 'open';
    const isSoldOut = product.stock_quantity === 0;

    return (
        <PublicPageShell>
            <div className="mx-auto max-w-3xl px-4 pt-8 pb-16 sm:px-6 sm:pb-24 lg:px-8">
                <div className="mb-6">
                    <BackButton href={`/merch/${product.slug}`} title="Terug naar product" />
                </div>

                {isSoldOut ? (
                    <BlockedCard icon={Lock} title="Uitverkocht" message="Dit product is helaas uitverkocht." />
                ) : !isDropOpen ? (
                    <BlockedCard icon={Lock} title="Drop gesloten" message="Deze drop is gesloten voor nieuwe bestellingen." />
                ) : !isLoggedIn ? (
                    <BlockedCard icon={LogIn} title="Log in om te bestellen" message="Je moet ingelogd zijn met je Salve Mundi account om een bestelling te plaatsen." />
                ) : !isMember ? (
                    <BlockedCard icon={ShieldAlert} title="Alleen voor leden" message="Bestellen in de webshop is op dit moment alleen mogelijk voor leden van Salve Mundi." />
                ) : (
                    <div className="rounded-[1.75rem] border border-(--border-color) bg-(--bg-card) p-6 shadow-sm sm:p-10">
                        <WebshopCheckoutIsland
                            product={product}
                            initialUser={{
                                first_name: user.first_name,
                                last_name: user.last_name,
                                email: session.user.email,
                                phone_number: user.phone_number
                            }}
                        />
                    </div>
                )}
            </div>
        </PublicPageShell>
    );
}
