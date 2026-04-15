import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { TransactionsIsland } from '@/components/islands/account/TransactionsIsland';
import { getUserTransactions } from '@/server/actions/profiel.actions';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';

export const metadata = {
    title: 'Transacties | SV Salve Mundi',
    description: 'Bekijk je eerdere betalingen bij Salve Mundi.',
};

export default async function TransactiesPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    const transactions = await getUserTransactions();

    return (
        <PublicPageShell title="Transacties">
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                <TransactionsIsland transactions={transactions} />
            </div>
        </PublicPageShell>
    );
}
