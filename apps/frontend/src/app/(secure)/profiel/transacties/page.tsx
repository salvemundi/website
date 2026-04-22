import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { TransactionsIsland } from '@/components/islands/account/TransactionsIsland';
import { getUserTransactions } from '@/server/actions/profiel.actions';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import BackButton from '@/components/ui/navigation/BackButton';

export const metadata = {
    title: 'Transacties | SV Salve Mundi',
    description: 'Bekijk je eerdere betalingen bij Salve Mundi.',
};

import { redirect } from 'next/navigation';

export default async function TransactiesPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || !session.user) {
        redirect('/');
    }

    const transactions = await getUserTransactions();

    return (
        <PublicPageShell title="Transacties">
            <div className="container mx-auto px-4 max-w-7xl pt-8">
                <BackButton href="/profiel" />
            </div>
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <TransactionsIsland transactions={transactions} />
            </div>
        </PublicPageShell>
    );
}
