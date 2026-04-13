'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { CreditCard, Clock, Tag, CheckCircle } from 'lucide-react';
import type { Transaction } from '@salvemundi/validations/schema/profiel.zod';
interface TransactionsIslandProps {
    isLoading?: boolean;
    transactions?: Transaction[];
}

export const TransactionsIsland: React.FC<TransactionsIslandProps> = ({ isLoading = false, transactions = [] }) => {

    const paidTransactions = useMemo(() => {
        if (isLoading) return [];
        return transactions.filter((t) => {
            const status = (t.payment_status || t.status || '').toLowerCase();
            return status === 'paid' || status === 'completed';
        });
    }, [transactions, isLoading]);

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

    return (
        <section className={`relative overflow-hidden rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 shadow-lg p-6 sm:p-8`} aria-busy={isLoading}>
            <header className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-purple-100)] pb-4">
                <div className="flex min-w-0 items-center gap-3">
                     <div className="shrink-0 rounded-xl bg-theme-purple/10 p-2 text-[var(--color-purple-500)]">
                        <CreditCard className="h-5 w-5" />
                    </div>
                    <h2 className="truncate text-lg font-bold text-[var(--text-main)]">
                         Mijn Betalingen
                    </h2>
                </div>
            </header>

            {!isLoading && paidTransactions.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-[var(--color-purple-100)] bg-slate-50 dark:bg-black/20 p-8 text-center">
                    <p className="text-[var(--text-main)] font-medium">Geen betaalde transacties gevonden.</p>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">Zodra je een betaling afrondt, verschijnt deze hier.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                         <thead>
                            <tr className="border-b border-[var(--color-purple-100)]">
                                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Datum</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Product</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Type</th>
                                <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Betaalstatus</th>
                                <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Bedrag</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-purple-100)]">
                            {isLoading ? (
                                [1, 2, 3, 4, 5].map((i) => (
                                    <tr key={i}>
                                        <td className="px-4 py-6">
                                            <div className="h-4 w-28 bg-[var(--color-purple-500)]/10 rounded-sm skeleton-active" />
                                        </td>
                                        <td className="px-4 py-6">
                                            <div className="space-y-2">
                                                <div className="h-4 w-40 bg-[var(--color-purple-500)]/10 rounded-sm skeleton-active" />
                                                <div className="h-3 w-20 bg-[var(--color-purple-500)]/5 rounded-full skeleton-active" />
                                            </div>
                                        </td>
                                        <td className="px-4 py-6">
                                            <div className="h-6 w-16 bg-[var(--color-purple-500)]/5 rounded-full skeleton-active" />
                                        </td>
                                        <td className="px-4 py-6 flex justify-center">
                                            <div className="h-7 w-24 bg-green-500/10 rounded-full skeleton-active" />
                                        </td>
                                        <td className="px-4 py-6 text-right">
                                            <div className="h-4 w-16 ml-auto bg-[var(--color-purple-500)]/10 rounded-sm skeleton-active" />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                paidTransactions.map((transaction) => (
                                    <tr key={transaction.id} className="hover:bg-slate-50 dark:hover:bg-black/20 transition-colors group">
                                         <td className="px-4 py-5 whitespace-nowrap text-sm text-[var(--text-main)]">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                                                {format(new Date(transaction.created_at || transaction.date_created || new Date()), 'd MMM yyyy HH:mm')}
                                            </div>
                                        </td>
                                        <td className="px-4 py-5">
                                            <div className="text-sm font-semibold text-[var(--text-main)]">
                                                {transaction.product_name || transaction.description || 'Betaling'}
                                            </div>
                                            {transaction.coupon_code && (
                                                <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mt-1">
                                                    <Tag className="h-3 w-3" />
                                                    {transaction.coupon_code}
                                                </div>
                                            )}
                                        </td>
                                         <td className="px-4 py-5 whitespace-nowrap">
                                            <span className="px-3 py-1 inline-flex text-[10px] font-bold uppercase tracking-wider rounded-full bg-[var(--color-purple-100)] text-[var(--color-purple-500)] border border-[var(--color-purple-200)]">
                                                {getInferredTransactionType(transaction)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-5 text-center whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400 border border-green-500/20">
                                                <CheckCircle className="h-3 w-3" />
                                                Betaald
                                            </span>
                                        </td>
                                        <td className="px-4 py-5 whitespace-nowrap text-right text-sm font-mono font-bold text-[var(--text-main)]">
                                            {formatAmount(transaction.amount)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
};

