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
                <span className="rounded-full bg-green-500/10 px-3 py-1 text-[10px] font-semibold text-green-500">
                    Betaald
                </span>
            );
        case 'expired':
            return (
                <span className="rounded-full bg-gray-500/10 px-3 py-1 text-[10px] font-semibold text-gray-500">
                    Verlopen
                </span>
            );
        case 'failed':
        case 'canceled':
            return (
                <span className="rounded-full bg-red-500/10 px-3 py-1 text-[10px] font-semibold text-red-500">
                    Mislukt
                </span>
            );
        default:
            return (
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-semibold text-amber-500">
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
        <div className="overflow-hidden rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) shadow-sm">
            <div className="border-b border-(--beheer-border) p-8">
                <h3 className="text-xl leading-tight font-semibold text-(--beheer-text)">Transactie Geschiedenis</h3>
                <p className="mt-1 text-xs font-semibold text-(--beheer-text-muted) opacity-60">Overzicht van alle lidmaatschap, webshop en activiteit betalingen</p>
            </div>

            {transactions.length === 0 ? (
                <div className="py-20 text-center">
                    <CreditCard className="mx-auto mb-4 size-12 text-(--beheer-text-muted) opacity-20" />
                    <p className="text-xs font-semibold text-(--beheer-text-muted)">Nog geen transacties gevonden</p>
                </div>
            ) : (
                <div className="max-h-[60vh] scrollbar-thin scrollbar-thumb-(--beheer-border) overflow-auto">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="border-b border-(--beheer-border) bg-(--beheer-card-soft)/50 text-xs font-semibold text-(--beheer-text-muted)">
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
                                <tr key={tx.id} className="group transition-colors hover:bg-(--beheer-card-soft)/30">
                                    <td className="px-8 py-5">
                                        <div className="font-semibold text-(--beheer-text)">{tx.product_name || 'Lidmaatschap betaling'}</div>
                                    </td>
                                    <td className="px-8 py-5 text-xs font-medium text-(--beheer-text-muted) capitalize">
                                        {tx.product_type || 'onbekend'}
                                    </td>
                                    <td className="px-8 py-5 font-mono text-xs text-(--beheer-text-muted) opacity-70">
                                        {tx.mollie_id || '-'}
                                    </td>
                                    <td className="px-8 py-5 text-xs font-medium text-(--beheer-text-muted)">
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
