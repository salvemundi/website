import { redirect } from 'next/navigation';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { getPizzaStats } from '@/server/actions/public/pizza.actions';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import BackButton from '@/components/ui/navigation/BackButton';
import { PizzaStatsIsland } from '@/components/islands/pizza/PizzaStatsIsland';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Pizza-statistieken | SV Salve Mundi',
    description: 'Jouw persoonlijke pizza-statistieken.' };

export default async function PizzaStatsPage() {
    const session = await getEnrichedSession();
    if (!session) {
        redirect('/');
    }

    const stats = await getPizzaStats();

    return (
        <PublicPageShell title="Pizza-statistieken">
            <div className="container mx-auto max-w-7xl px-4 pt-8">
                <BackButton href="/pizza" />
            </div>
            <div className="container mx-auto max-w-7xl px-4 py-8">
                <PizzaStatsIsland stats={stats} />
            </div>
        </PublicPageShell>
    );
}
