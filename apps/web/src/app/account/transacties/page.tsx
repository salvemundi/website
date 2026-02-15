'use client';

import { Suspense } from 'react';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { useSalvemundiTransactions } from '@/shared/lib/hooks/useSalvemundiApi';
import { format } from 'date-fns';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { Transaction } from '@/shared/lib/api/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import { CreditCard, Clock, Tag, CheckCircle } from 'lucide-react';

/**
 * Tile Component - Matches the aesthetic of admin/logging
 */
function Tile({
    title,
    icon,
    children,
    className = '',
    actions,
}: {
    title?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    actions?: React.ReactNode;
}) {
    return (
        <section
            className={[
                'relative overflow-hidden rounded-3xl bg-gradient-to-br from-theme-gradient-start to-theme-gradient-end shadow-lg',
                className,
            ].join(' ')}
        >
            <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

            <div className="relative p-6 sm:p-7">
                {(title || actions) && (
                    <header className="mb-5 flex items-center justify-between gap-4 border-b border-white/5 pb-4">
                        <div className="flex min-w-0 items-center gap-3">
                            {icon ? (
                                <div className="shrink-0 rounded-xl bg-theme-purple/10 p-2 text-theme-purple-lighter">
                                    {icon}
                                </div>
                            ) : null}
                            {title ? (
                                <h2 className="truncate text-lg font-bold text-theme-purple-lighter">
                                    {title}
                                </h2>
                            ) : null}
                        </div>

                        {actions ? <div className="shrink-0">{actions}</div> : null}
                    </header>
                )}

                {children}
            </div>
        </section>
    );
}

function TransactionsContent() {
    const { user, isLoading: authLoading } = useAuth();
    const {
        data: transactions = [],
        isLoading: transactionsLoading,
        error,
        refetch
    } = useSalvemundiTransactions(user?.id);

    // Filter for ONLY paid/completed transactions as requested
    const paidTransactions = transactions.filter((t: Transaction) => {
        const status = (t.payment_status || t.status || '').toLowerCase();
        return status === 'paid' || status === 'completed';
    });

    const getInferredTransactionType = (t: Transaction) => {
        if (t.transaction_type) return t.transaction_type;
        const desc = (t.product_name || t.description || '').toLowerCase();
        if (t.registration || t.pub_crawl_signup || desc.includes('event') || desc.includes('activiteit') || desc.includes('inschrijving')) return 'event';
        if (t.trip_signup || desc.includes('reis')) return 'event';
        if (desc.includes('lidmaatschap') || desc.includes('contributie') || desc.includes('membership')) return 'membership';
        return 'payment';
    };

    const formatAmount = (amount: number | string | null | undefined): string => {
        const numAmount = amount == null
            ? 0
            : typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(numAmount);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[var(--bg-main)]">
                <PageHeader title="Transacties" />
                <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-theme-purple/20 border-t-theme-purple" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-main)] pb-20">
            <PageHeader
                title="Transacties"
                description="Overzicht van jouw afgeronde betalingen bij Salve Mundi"
            />

            <main className="mx-auto max-w-app px-4 py-8">
                <Tile
                    title="Mijn Betalingen"
                    icon={<CreditCard className="h-5 w-5" />}
                    actions={
                        <button
                            onClick={() => refetch()}
                            disabled={transactionsLoading}
                            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-theme-purple-lighter hover:bg-white/15 border border-white/10 transition disabled:opacity-50"
                        >
                            <CreditCard className={`h-4 w-4 ${transactionsLoading ? 'animate-spin' : ''}`} />
                            Ververs
                        </button>
                    }
                >
                    {transactionsLoading && transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-theme-purple/20 border-t-theme-purple" />
                            <p className="mt-4 text-theme-purple-lighter/60">Betalingen ophalen...</p>
                        </div>
                    ) : error ? (
                        <div className="rounded-2xl border-2 border-dashed border-red-500/10 bg-red-500/5 p-8 text-center text-red-400">
                            <p className="font-bold">Kon transacties niet laden.</p>
                            <button onClick={() => refetch()} className="text-sm underline mt-2">Probeer opnieuw</button>
                        </div>
                    ) : paidTransactions.length === 0 ? (
                        <div className="rounded-2xl border-2 border-dashed border-theme-purple/10 bg-white/5 p-8 text-center">
                            <p className="text-theme-purple-lighter font-medium">Geen betaalde transacties gevonden.</p>
                            <p className="mt-2 text-sm text-theme-purple-lighter/60">Zodra je een betaling afrondt, verschijnt deze hier.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/5">
                                        <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-theme-purple-lighter/50">Datum</th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-theme-purple-lighter/50">Product</th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-theme-purple-lighter/50">Type</th>
                                        <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-theme-purple-lighter/50">Betaalstatus</th>
                                        <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-theme-purple-lighter/50">Bedrag</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {paidTransactions.map((transaction: Transaction) => (
                                        <tr key={transaction.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-4 py-5 whitespace-nowrap text-sm text-theme-purple-lighter/70">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-3.5 w-3.5 text-theme-purple-lighter/30" />
                                                    {format(new Date(transaction.created_at || transaction.date_created || new Date()), 'd MMM yyyy HH:mm')}
                                                </div>
                                            </td>
                                            <td className="px-4 py-5">
                                                <div className="text-sm font-semibold text-white">
                                                    {transaction.product_name || transaction.description || 'Betaling'}
                                                </div>
                                                {transaction.coupon_code && (
                                                    <div className="flex items-center gap-1 text-[10px] text-theme-purple-lighter/40 font-bold uppercase tracking-wider mt-1">
                                                        <Tag className="h-3 w-3" />
                                                        {transaction.coupon_code}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-5 whitespace-nowrap">
                                                <span className="px-3 py-1 inline-flex text-[10px] font-bold uppercase tracking-wider rounded-full bg-theme-purple/20 text-theme-purple-lighter border border-theme-purple/30">
                                                    {getInferredTransactionType(transaction)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-5 text-center whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-green-400 border border-green-500/20">
                                                    <CheckCircle className="h-3 w-3" />
                                                    Betaald
                                                </span>
                                            </td>
                                            <td className="px-4 py-5 whitespace-nowrap text-right text-sm font-mono font-bold text-theme-purple-lighter">
                                                {formatAmount(transaction.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Tile>
            </main>
        </div>
    );
}

export default function TransactionsPage() {
    return (
        <ProtectedRoute requireAuth>
            <Suspense fallback={
                <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-theme-purple/20 border-t-theme-purple" />
                </div>
            }>
                <TransactionsContent />
            </Suspense>
        </ProtectedRoute>
    );
}
