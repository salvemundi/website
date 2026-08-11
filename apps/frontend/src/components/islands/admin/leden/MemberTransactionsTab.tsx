'use client';

import { CreditCard } from 'lucide-react';
import { safeConsoleError } from '@/server/utils/logger';

export interface MemberTransaction {
    id: number;
    created_at: string | null;
    product_name: string | null;
    amount: number | null;
    payment_status: string | null;
    mollie_id: string | null;
    product_type: string | null;
}

interface Props {
    transactions: MemberTransaction[];
}

export function TransactionStatus({ status }: { status: string }) {
    switch (status) {
        case 'paid':
            return (
                <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-semibold">
                    Betaald
                </span>
            );
        case 'expired':
            return (
                <span className="px-3 py-1 bg-gray-500/10 text-gray-500 rounded-full text-[10px] font-semibold">
                    Verlopen
                </span>
            );
        case 'failed':
        case 'canceled':
            return (
                <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-[10px] font-semibold">
                    Mislukt
                </span>
            );
        default:
            return (
                <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-semibold">
                    Open
                </span>
            );
    }
}

export default function MemberTransactionsTab({ transactions }: Props) {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Onbekend';
        try {
            return new Intl.DateTimeFormat('nl-NL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(new Date(dateString));
        } catch (error) {
            safeConsoleError('[MemberTransactionsTab.tsx][formatDate] ', error);
            return 'Onbekend';
        }
    };

    const formatAmount = (amount: number | null | undefined) => {
        if (amount === null || amount === undefined) return '€ 0,00';
        try {
            return new Intl.NumberFormat('nl-NL', {
                style: 'currency',
                currency: 'EUR'
            }).format(amount);
        } catch (error) {
            safeConsoleError('[MemberTransactionsTab.tsx][formatAmount] ', error);
            return `€ ${amount}`;
        }
    };

    return (
        <div className="bg-(--beheer-card-bg) rounded-(--beheer-radius) border border-(--beheer-border) overflow-hidden shadow-sm">
            <div className="p-8 border-b border-(--beheer-border)">
                <h3 className="text-xl font-semibold text-(--beheer-text) leading-tight">Transactie Geschiedenis</h3>
                <p className="text-xs text-(--beheer-text-muted) font-semibold mt-1 opacity-60">Overzicht van alle lidmaatschap, webshop en activiteit betalingen</p>
            </div>

            {transactions.length === 0 ? (
                <div className="py-20 text-center">
                    <CreditCard className="h-12 w-12 text-(--beheer-text-muted) opacity-20 mx-auto mb-4" />
                    <p className="text-(--beheer-text-muted) font-semibold text-xs">Nog geen transacties gevonden</p>
                </div>
            ) : (
                <div className="overflow-x-auto max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-(--beheer-border)">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-(--beheer-card-soft)/50 text-xs font-semibold text-(--beheer-text-muted) border-b border-(--beheer-border)">
                                <th className="px-8 py-4">Product / Omschrijving</th>
                                <th className="px-8 py-4">Type</th>
                                <th className="px-8 py-4">Mollie ID</th>
                                <th className="px-8 py-4">Datum</th>
                                <th className="px-8 py-4">Bedrag</th>
                                <th className="px-8 py-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--beheer-border)">
                            {transactions.map(tx => (
                                <tr key={tx.id} className="group hover:bg-(--beheer-card-soft)/30 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="font-semibold text-(--beheer-text)">{tx.product_name || 'Lidmaatschap betaling'}</div>
                                    </td>
                                    <td className="px-8 py-5 text-xs text-(--beheer-text-muted) font-medium capitalize">
                                        {tx.product_type || 'onbekend'}
                                    </td>
                                    <td className="px-8 py-5 text-xs font-mono text-(--beheer-text-muted) opacity-70">
                                        {tx.mollie_id || '-'}
                                    </td>
                                    <td className="px-8 py-5 text-xs text-(--beheer-text-muted) font-medium">
                                        {formatDate(tx.created_at)}
                                    </td>
                                    <td className="px-8 py-5 font-semibold text-(--beheer-text)">
                                        {formatAmount(tx.amount)}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <TransactionStatus status={tx.payment_status || 'open'} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
