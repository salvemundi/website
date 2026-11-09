import { redirect } from 'next/navigation';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { getPizzaOverview } from '@/server/actions/public/pizza.actions';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import BackButton from '@/components/ui/navigation/BackButton';
import { PizzaOverviewIsland } from '@/components/islands/pizza/PizzaOverviewIsland';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Pizza-rondes | SV Salve Mundi',
    description: 'Start een pizza-ronde of bestel mee met andere leden.' };

export default async function PizzaPage() {
    const session = await getEnrichedSession();
    if (!session) {
        redirect('/');
    }

    const overview = await getPizzaOverview();

    return (
        <PublicPageShell title="Pizza-rondes">
            <div className="container mx-auto max-w-7xl px-4 pt-8">
                <BackButton href="/profiel" />
            </div>
            <div className="container mx-auto max-w-7xl px-4 py-8">
                <PizzaOverviewIsland open={overview.open} mine={overview.mine} />
            </div>
        </PublicPageShell>
    );
}
