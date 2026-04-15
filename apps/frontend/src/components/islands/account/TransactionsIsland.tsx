'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { CreditCard, Clock, Tag, CheckCircle } from 'lucide-react';
import type { Transaction } from '@salvemundi/validations/schema/profiel.zod';
import { Tile } from './profile/ProfielUI';

interface TransactionsIslandProps {
    transactions?: Transaction[];
}

export const TransactionsIsland: React.FC<TransactionsIslandProps> = ({ transactions = [] }) => {
    const paidTransactions = useMemo(() => {
        return transactions.filter((t) => {
            const status = (t.payment_status || t.status || '').toLowerCase();
            return status === 'paid' || status === 'completed';
        });
    }, [transactions]);

    const getInferredTransactionType = (t: Transaction) => {
        if (t.transaction_type) return t.transaction_type;
        const desc = (t.product_name || t.description || '').toLowerCase();
        if (t.registration || t.pub_crawl_signup || desc.includes('event') || desc.includes('activiteit') || desc.includes('aanmelding')) return 'event';
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
        <Tile
            title="Mijn Betalingen"
            icon={<CreditCard className="h-6 w-6" />}
            className="w-full"
        >
            {paidTransactions.length === 0 ? (
                <div className="rounded-3xl border-2 border-dashed border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-black/10 p-12 text-center shadow-inner">
                    <p className="text-[var(--text-main)] font-bold text-lg mb-2">Geen betaalde transacties gevonden.</p>
                    <p className="text-[var(--text-muted)] text-sm">Zodra je een betaling afrondt, verschijnt deze hier.</p>
                </div>
            ) : (
                <div className="overflow-x-auto -mx-6 sm:mx-0">
                    <table className="w-full border-separate border-spacing-0">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-white/5">
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[var(--color-purple-500)] opacity-60">Datum</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[var(--color-purple-500)] opacity-60">Product</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[var(--color-purple-500)] opacity-60">Type</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-[var(--color-purple-500)] opacity-60">Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-[var(--color-purple-500)] opacity-60">Bedrag</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                            {paidTransactions.map((transaction) => (
                                <tr key={transaction.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all group">
                                    <td className="px-6 py-6 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-main)]">
                                            <Clock className="h-4 w-4 text-[var(--color-purple-500)] opacity-40" />
                                            {format(new Date(transaction.created_at || transaction.date_created || new Date()), 'd MMM yyyy', { locale: nl })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 transition-transform group-hover:translate-x-1">
                                        <div className="text-sm font-black text-[var(--color-purple-700)] dark:text-white leading-tight">
                                            {transaction.product_name || transaction.description || 'Betaling'}
                                        </div>
                                        {transaction.coupon_code && (
                                            <div className="flex items-center gap-1.5 text-[9px] text-[var(--color-purple-500)] font-black uppercase tracking-widest mt-1 opacity-70">
                                                <Tag className="h-3 w-3" />
                                                {transaction.coupon_code}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-6 whitespace-nowrap">
                                        <span className="px-3 py-1 inline-flex text-[9px] font-black uppercase tracking-widest rounded-full bg-[var(--color-purple-100)] text-[var(--color-purple-700)] dark:bg-[var(--color-purple-500)]/10 dark:text-[var(--color-purple-300)] border border-[var(--color-purple-200)] dark:border-[var(--color-purple-500)]/20 shadow-sm">
                                            {getInferredTransactionType(transaction)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6 text-center whitespace-nowrap">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-green-600 dark:text-green-400 border border-green-500/20 shadow-inner">
                                            <CheckCircle className="h-3 w-3" />
                                            Betaald
                                        </span>
                                    </td>
                                    <td className="px-6 py-6 whitespace-nowrap text-right text-sm font-black text-[var(--text-main)]">
                                        {formatAmount(transaction.amount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Tile>
    );
};
