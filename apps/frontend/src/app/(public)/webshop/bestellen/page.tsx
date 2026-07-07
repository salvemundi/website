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
        <div className="min-h-[60vh] flex items-center justify-center p-6">
            <div className="max-w-md w-full p-12 bg-(--bg-card) border border-(--border-color) rounded-[1.75rem] text-center shadow-xl">
                <Icon className="w-16 h-16 text-(--theme-purple) mx-auto mb-6" />
                <h1 className="text-2xl font-black text-(--theme-purple) mb-4">{title}</h1>
                <p className="text-(--text-muted) mb-8 leading-relaxed">{message}</p>
                <BackButton href="/webshop" text="Terug naar webshop" />
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
    const isDropOpen = product.drop_window?.status === 'open';

    return (
        <PublicPageShell>
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-8 pb-16 sm:pb-24">
                <div className="mb-6">
                    <BackButton href={`/webshop/${product.slug}`} title="Terug naar product" />
                </div>

                {!isDropOpen ? (
                    <BlockedCard icon={Lock} title="Drop gesloten" message="Deze drop is gesloten voor nieuwe bestellingen." />
                ) : !isLoggedIn ? (
                    <BlockedCard icon={LogIn} title="Log in om te bestellen" message="Je moet ingelogd zijn met je Salve Mundi account om een bestelling te plaatsen." />
                ) : !isMember ? (
                    <BlockedCard icon={ShieldAlert} title="Alleen voor leden" message="Bestellen in de webshop is op dit moment alleen mogelijk voor leden van Salve Mundi." />
                ) : (
                    <div className="p-6 sm:p-10 bg-(--bg-card) border border-(--border-color) rounded-[1.75rem] shadow-sm">
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
