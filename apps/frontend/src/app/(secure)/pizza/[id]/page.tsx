import { notFound, redirect } from 'next/navigation';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { getPizzaRound, getPizzaFavorites } from '@/server/actions/public/pizza.actions';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import BackButton from '@/components/ui/navigation/BackButton';
import { PizzaRoundIsland } from '@/components/islands/pizza/PizzaRoundIsland';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Pizza-ronde | SV Salve Mundi',
    description: 'Bestel mee met een pizza-ronde van Salve Mundi.' };

export default async function PizzaRoundPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getEnrichedSession();
    if (!session) {
        redirect('/');
    }

    const { id } = await params;
    const detail = await getPizzaRound(id);
    if (!detail) {
        notFound();
    }

    const favorites = detail.round.isOpen ? await getPizzaFavorites() : undefined;

    return (
        <PublicPageShell title={detail.round.title}>
            <div className="container mx-auto max-w-7xl px-4 pt-8">
                <BackButton href="/pizza" />
            </div>
            <div className="container mx-auto max-w-7xl px-4 py-8">
                <PizzaRoundIsland detail={detail} favorites={favorites} />
            </div>
        </PublicPageShell>
    );
}
