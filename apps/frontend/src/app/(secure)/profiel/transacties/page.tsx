import { Suspense } from 'react';
import type { Metadata } from 'next';
import { TransactionsIsland } from '@/components/islands/account/TransactionsIsland';
import { getUserTransactions } from '@/server/actions/profiel.actions';

export const metadata: Metadata = {
    title: 'Transacties | SV Salve Mundi',
    description: 'Bekijk je eerdere betalingen bij Salve Mundi.',
};

export default function TransactiesPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            <header className="bg-[var(--bg-soft)] py-12">
                <div className="mx-auto max-w-app px-4">
                    <h1 className="text-4xl font-extrabold text-[var(--text-main)]">Transacties</h1>
                    <p className="text-lg text-[var(--text-muted)] mt-2">
                        Overzicht van jouw afgeronde betalingen bij Salve Mundi
                    </p>
                </div>
            </header>

            <main className="mx-auto max-w-app px-4 py-8">
                {/* Granular PPR: Wrapping the transaction fetching in a suspense boundary */}
                <Suspense fallback={<TransactionsIsland isLoading />}>
                    <TransactionsFetcher />
                </Suspense>
            </main>
        </div>
    );
}

// Server Component Fetcher
async function TransactionsFetcher() {
    const transactions = await getUserTransactions();

    return <TransactionsIsland transactions={transactions} />;
}
