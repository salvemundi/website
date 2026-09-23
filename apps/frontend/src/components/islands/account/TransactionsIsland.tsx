'use client';

import { useMemo } from 'react';
import { CreditCard, Clock, Tag } from 'lucide-react';
import type { Transaction } from '@salvemundi/validations/schema/profiel.zod';
import { Tile } from './profile/ProfielUI';

const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('nl-NL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }).format(date);

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
        return t.product_type || t.transaction_type || 'Overig';
    };

    const formatAmount = (amount: number | string | null | undefined): string => {
        const numAmount = amount === null || amount === undefined
            ? 0
            : typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(numAmount);
    };

    return (
        <Tile
            title="Mijn Betalingen"
            icon={<CreditCard className="size-6" />}
            className="w-full"
        >
            {paidTransactions.length === 0 ? (
                <div className="squircle-lg border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center shadow-inner dark:border-white/10 dark:bg-black/10">
                    <p className="mb-2 text-lg font-bold text-(--text-main)">Geen betaalde transacties gevonden.</p>
                    <p className="text-sm text-(--text-muted)">Zodra je een betaling afrondt, verschijnt deze hier.</p>
                </div>
            ) : (
                <div className="-mx-6 overflow-x-auto sm:mx-0">
                    <table className="w-full border-separate border-spacing-0">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-white/5">
                                <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-purple-500 uppercase opacity-60">Datum</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-purple-500 uppercase opacity-60">Product</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-purple-500 uppercase opacity-60">Type</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black tracking-widest text-purple-500 uppercase opacity-60">Bedrag</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                            {paidTransactions.map((transaction) => (
                                <tr key={transaction.id} className="group transition-all hover:bg-slate-50 dark:hover:bg-white/5">
                                    <td className="p-6 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-sm font-bold text-(--text-main)">
                                            <Clock className="size-4 text-purple-500 opacity-40" />
                                            {formatDate(new Date(transaction.created_at || transaction.date_created || new Date()))}
                                        </div>
                                    </td>
                                    <td className="p-6 transition-transform group-hover:translate-x-1">
                                        <div className="text-sm leading-tight font-black text-purple-700 dark:text-white">
                                            {transaction.product_name || transaction.description || 'Betaling'}
                                        </div>
                                        {transaction.coupon_code && (
                                            <div className="mt-1 flex items-center gap-1.5 text-[9px] font-black tracking-widest text-purple-500 uppercase opacity-70">
                                                <Tag className="size-3" />
                                                {transaction.coupon_code}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-6 whitespace-nowrap">
                                        <span className="inline-flex rounded-full border border-purple-200 bg-purple-100 px-3 py-1 text-[9px] font-black tracking-widest text-purple-700 uppercase shadow-sm dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300">
                                            {getInferredTransactionType(transaction)}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right text-sm font-black whitespace-nowrap text-(--text-main)">
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
