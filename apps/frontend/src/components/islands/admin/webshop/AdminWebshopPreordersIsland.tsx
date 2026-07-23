'use client';

import { Fragment, useState, useTransition } from 'react';
import { ClipboardList, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { updatePreorderStatus, getPreorderPaymentLink } from '@/server/actions/admin/webshop/admin-webshop-preorders.actions';
import { formatDate } from '@/shared/lib/utils/date';
import { type AdminPreorder } from './webshop-admin-types';

interface Props {
    initialPreorders: AdminPreorder[];
}

const STATUS_OPTIONS = [
    { value: 'awaiting_deposit', label: 'Wacht op aanbetaling' },
    { value: 'awaiting_final', label: 'Wacht op restbetaling' },
    { value: 'completed', label: 'Voltooid' },
    { value: 'cancelled', label: 'Geannuleerd' }
];

export default function AdminWebshopPreordersIsland({ initialPreorders }: Props) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [preorders, setPreorders] = useState(initialPreorders);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [isPending, startTransition] = useTransition();
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const handleStatusChange = (id: number, status: string) => {
        setUpdatingId(id);
        startTransition(async () => {
            const res = await updatePreorderStatus(id, status);
            if (res.success) {
                setPreorders(prev => prev.map(p => p.id === id ? { ...p, status } : p));
                showToast('Status bijgewerkt', 'success');
            } else {
                showToast(res.error || 'Bijwerken mislukt', 'error');
            }
            setUpdatingId(null);
        });
    };

    const handleCopyLink = (id: number, paymentType: 'deposit' | 'final') => {
        startTransition(async () => {
            const res = await getPreorderPaymentLink(id, paymentType);
            if (res.success && res.link) {
                await navigator.clipboard.writeText(res.link);
                showToast('Link gekopieerd naar klembord', 'success');
            } else {
                showToast(res.error || 'Link ophalen mislukt', 'error');
            }
        });
    };

    return (
        <>
            <AdminToolbar 
                title="Webshop Bestellingen"
                backHref="/beheer/webshop" 
            />

            <div className="admin-container py-4 md:py-8 space-y-4">
                <div className="bg-(--beheer-card-bg) rounded-(--beheer-radius) border border-(--beheer-border) overflow-hidden shadow-xl">
                    {preorders.length === 0 ? (
                        <div className="py-24 text-center">
                            <ClipboardList className="h-12 w-12 text-(--beheer-text-muted) mx-auto mb-4 opacity-10" />
                            <p className="font-semibold text-sm text-(--beheer-text-muted)">Nog geen bestellingen</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-(--beheer-card-soft) border-b border-(--beheer-border)">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-(--beheer-text-muted)">Besteller</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-(--beheer-text-muted) hidden sm:table-cell">Datum</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-(--beheer-text-muted)">Totaal</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-(--beheer-text-muted)">Status</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-(--beheer-text-muted)">Acties</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-(--beheer-border)">
                                    {preorders.map((preorder) => (
                                        <Fragment key={preorder.id}>
                                            <tr className="hover:bg-(--beheer-card-soft)/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <button 
                                                        onClick={() => setExpandedId(expandedId === preorder.id ? null : preorder.id)} 
                                                        className="beheer-button w-fit flex items-center gap-2 font-semibold text-(--beheer-text) text-sm cursor-pointer hover:text-(--beheer-accent) transition-colors"
                                                    >
                                                        {expandedId === preorder.id ? <ChevronUp className="h-4 w-4 shrink-0 text-(--beheer-accent)" /> : <ChevronDown className="h-4 w-4 shrink-0 text-(--beheer-text-muted)" />}
                                                        <span>{preorder.first_name} {preorder.last_name}</span>
                                                    </button>
                                                    <p className="text-xs text-(--beheer-text-muted) ml-6 opacity-80">{preorder.email}</p>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-(--beheer-text-muted) hidden sm:table-cell">
                                                    {preorder.created_at ? formatDate(new Date(preorder.created_at), 'd MMM yyyy') : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-semibold text-(--beheer-text)">€{Number(preorder.subtotal_amount).toFixed(2)}</td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={preorder.status || ''}
                                                        disabled={isPending && updatingId === preorder.id}
                                                        onChange={(e) => handleStatusChange(preorder.id, e.target.value)}
                                                        className="beheer-select px-3 py-1.5 rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) text-(--beheer-text) text-xs font-semibold outline-none focus:border-(--beheer-accent) transition-all cursor-pointer disabled:opacity-50"
                                                    >
                                                        {STATUS_OPTIONS.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {!preorder.deposit_paid && (
                                                            <button 
                                                                onClick={() => handleCopyLink(preorder.id, 'deposit')} 
                                                                title="Kopieer aanbetalingslink" 
                                                                className="icon-button p-2 rounded-lg text-(--beheer-text-muted) hover:text-(--beheer-accent) hover:bg-(--beheer-accent)/10 transition-all cursor-pointer"
                                                            >
                                                                <Copy className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        {preorder.deposit_paid && !preorder.final_payment_paid && (
                                                            <button 
                                                                onClick={() => handleCopyLink(preorder.id, 'final')} 
                                                                title="Kopieer restbetalingslink" 
                                                                className="icon-button p-2 rounded-lg text-(--beheer-text-muted) hover:text-(--beheer-accent) hover:bg-(--beheer-accent)/10 transition-all cursor-pointer"
                                                            >
                                                                <Copy className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedId === preorder.id && (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-4 bg-(--beheer-card-soft)/50 border-t border-b border-(--beheer-border)/50">
                                                        <div className="space-y-2">
                                                            {preorder.lines.map((line) => (
                                                                <div key={line.id} className="flex items-center justify-between text-sm">
                                                                    <span className="text-(--beheer-text) font-medium">
                                                                        {line.product_name_snapshot}
                                                                        {line.variant_label_snapshot && ` (${line.variant_label_snapshot})`}
                                                                        {' '}&times; {line.quantity}
                                                                    </span>
                                                                    <span className="text-(--beheer-text-muted) font-mono">€{(Number(line.unit_price) * line.quantity).toFixed(2)}</span>
                                                                </div>
                                                            ))}
                                                            <div className="flex items-center justify-between text-sm pt-2 border-t border-(--beheer-border)/50 font-semibold">
                                                                <span className="text-(--beheer-text-muted)">Aanbetaling {preorder.deposit_paid ? '(betaald)' : '(open)'}</span>
                                                                <span className="text-(--beheer-text) font-mono">€{Number(preorder.deposit_amount).toFixed(2)}</span>
                                                            </div>
                                                            {preorder.pickup_notes && (
                                                                <p className="text-xs text-(--beheer-text-muted) italic pt-2 opacity-80">Opmerking: {preorder.pickup_notes}</p>
                                                            )}
                                                            {preorder.phone_number && (
                                                                <p className="text-xs text-(--beheer-text-muted) opacity-80">Telefoon: {preorder.phone_number}</p>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}