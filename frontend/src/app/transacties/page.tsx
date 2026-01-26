'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { useSalvemundiTransactions } from '@/shared/lib/hooks/useSalvemundiApi';
import { format } from 'date-fns';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { Transaction } from '@/shared/lib/api/salvemundi';

function TransactionsContent() {
    const router = useRouter();
    const { user, isLoading: authLoading, isLoggingOut } = useAuth();
    const { data: transactions = [], isLoading: transactionsLoading, error, refetch } = useSalvemundiTransactions(user?.id);

    useEffect(() => {
        if (!authLoading && !user && !isLoggingOut) {
            const returnTo = window.location.pathname + window.location.search;
            router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
        }
    }, [user, authLoading, router, isLoggingOut]);

    const getTransactionTypeColor = (type: string) => {
        switch (type) {
            case 'membership':
                return 'bg-theme-purple-lighter text-theme-purple-darker';
            case 'event':
                return 'bg-theme-purple/20 text-theme-purple';
            case 'payment':
                return 'bg-theme-purple/20 text-theme-purple';
            default:
                return 'bg-gray-200 text-theme-purple';
        }
    };

    const getStatusColor = (status: string | undefined) => {
        const s = status?.toLowerCase();
        switch (s) {
            case 'completed':
            case 'paid':
                return 'bg-green-500 text-theme-white';
            case 'pending':
            case 'open':
                return 'bg-yellow-500 text-theme-white';
            case 'failed':
            case 'canceled':
            case 'expired':
                return 'bg-theme-purple text-theme-white';
            default:
                return 'bg-gray-400 text-theme-white';
        }
    };

    const formatAmount = (amount: number | string | null | undefined): string => {
        const numAmount = amount == null
            ? 0
            : typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(numAmount);
    };

    if (authLoading) {
        return (
            <div className="">
                <PageHeader
                    title="TRANSACTIES"
                    backgroundImage="/img/backgrounds/transacties-banner.jpg"
                >
                    <p className="text-lg sm:text-xl text-beige/90 max-w-3xl mx-auto mt-4">
                        Overzicht van jouw betalingen en transacties
                    </p>
                </PageHeader>
                <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="text-paars text-xl font-semibold">Laden...</div>
                </div>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect via useEffect
    }

    return (
        <div className="">
            <PageHeader
                title="TRANSACTIES"
                backgroundImage="/img/backgrounds/transacties-banner.jpg"
            >
                <p className="text-lg sm:text-xl text-beige/90 max-w-3xl mx-auto mt-4">
                    Overzicht van jouw betalingen en transacties
                </p>
            </PageHeader>

            <div className="container mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="p-6 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-paars">Mijn Transacties</h2>
                        <button
                            onClick={() => refetch()}
                            className="text-sm text-oranje hover:text-oranje/80 font-medium"
                        >
                            Verversen
                        </button>
                    </div>

                    {transactionsLoading ? (
                        <div className="p-8 text-center text-gray-500">
                            Transacties laden...
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center text-red-500">
                            Er is een fout opgetreden bij het laden van de transacties.
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <p className="text-lg mb-2">Geen transacties gevonden</p>
                            <p className="text-sm">Je hebt nog geen betalingen gedaan.</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beschrijving</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Bedrag</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {transactions.map((transaction: Transaction) => (
                                            <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {format(new Date(transaction.created_at), 'd MMM yyyy HH:mm')}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {transaction.description}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransactionTypeColor(transaction.transaction_type)}`}>
                                                        {transaction.transaction_type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(transaction.payment_status || transaction.status)}`}>
                                                        {(transaction.payment_status === 'completed' || transaction.payment_status === 'paid' || transaction.status === 'completed' || transaction.status === 'paid') ? 'Betaald' :
                                                            (transaction.payment_status === 'pending' || transaction.status === 'pending') ? 'In afwachting' : 'Mislukt'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                                                    {formatAmount(transaction.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-4 p-4">
                                {transactions.map((transaction: Transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="p-4 rounded-xl transition-all hover:shadow-md"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-paars mb-1">
                                                    {transaction.description}
                                                </h3>
                                                <p className="text-sm text-paars/70">
                                                    {format(new Date(transaction.created_at), 'd MMMM yyyy')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-paars text-lg">
                                                    {formatAmount(transaction.amount)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTransactionTypeColor(transaction.transaction_type)}`}>
                                                {transaction.transaction_type}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(transaction.payment_status || transaction.status)}`}>
                                                {(transaction.payment_status === 'completed' || transaction.payment_status === 'paid' || transaction.status === 'completed' || transaction.status === 'paid') ? 'Betaald' :
                                                    (transaction.payment_status === 'pending' || transaction.status === 'pending') ? 'In afwachting' : 'Mislukt'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function TransactionsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-paars text-xl font-semibold">Laden...</div>
            </div>
        }>
            <TransactionsContent />
        </Suspense>
    );
}
