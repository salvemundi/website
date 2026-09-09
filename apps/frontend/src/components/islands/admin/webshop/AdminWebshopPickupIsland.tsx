'use client';

import { useState, useTransition } from 'react';
import { ClipboardCheck, CheckCircle2 } from 'lucide-react';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { toggleOrderPickedUp } from '@/server/actions/admin/webshop/admin-webshop-preorders.actions';
import { formatDate } from '@/shared/lib/utils/date';
import { type AdminPickupOrder } from './webshop-admin-types';

interface Props {
    initialPreorders: AdminPickupOrder[];
}

export default function AdminWebshopPickupIsland({ initialPreorders }: Props) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [preorders, setPreorders] = useState(initialPreorders);
    const [isPending, startTransition] = useTransition();
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const handleToggle = (id: number, pickedUp: boolean) => {
        setUpdatingId(id);
        startTransition(async () => {
            const res = await toggleOrderPickedUp(id, pickedUp);
            if (res.success) {
                setPreorders(prev => prev.map(p => p.id === id ? { ...p, picked_up: pickedUp, picked_up_at: pickedUp ? new Date().toISOString() : null } : p));
                showToast(pickedUp ? 'Gemarkeerd als opgehaald' : 'Markering ongedaan gemaakt', 'success');
            } else {
                showToast(res.error || 'Bijwerken mislukt', 'error');
            }
            setUpdatingId(null);
        });
    };

    const openCount = preorders.filter(p => !p.picked_up).length;

    return (
        <>
            <AdminToolbar
                title="Afhaallijst"
                backHref="/beheer/webshop"
            />

            <div className="admin-container py-4 md:py-8 space-y-4">
                <p className="text-sm text-(--beheer-text-muted)">{openCount} van de {preorders.length} bestellingen nog niet opgehaald.</p>

                <div className="bg-(--beheer-card-bg) rounded-(--beheer-radius) border border-(--beheer-border) overflow-hidden shadow-xl">
                    {preorders.length === 0 ? (
                        <div className="py-24 text-center">
                            <ClipboardCheck className="h-12 w-12 text-(--beheer-text-muted) mx-auto mb-4 opacity-10" />
                            <p className="font-semibold text-sm text-(--beheer-text-muted)">Nog geen betaalde bestellingen</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-(--beheer-card-soft) border-b border-(--beheer-border)">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-(--beheer-text-muted)">Lid</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-(--beheer-text-muted)">Bestelling</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-(--beheer-text-muted) hidden sm:table-cell">Opgehaald op</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-(--beheer-text-muted)">Opgehaald</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-(--beheer-border)">
                                    {preorders.map((preorder) => (
                                        <tr key={preorder.id} className={`hover:bg-(--beheer-card-soft)/30 transition-colors ${preorder.picked_up ? 'opacity-60' : ''}`}>
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-(--beheer-text) text-sm">{preorder.first_name} {preorder.last_name}</p>
                                                <p className="text-xs text-(--beheer-text-muted) opacity-80">{preorder.email}</p>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-(--beheer-text)">
                                                {preorder.lines.map((line) => (
                                                    <p key={line.id}>
                                                        {line.product_name_snapshot}
                                                        {line.variant_label_snapshot && ` (${line.variant_label_snapshot})`}
                                                        {' '}&times; {line.quantity}
                                                    </p>
                                                ))}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-(--beheer-text-muted) hidden sm:table-cell">
                                                {preorder.picked_up_at ? formatDate(new Date(preorder.picked_up_at), 'd MMM yyyy HH:mm') : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end">
                                                    <button
                                                        type="button"
                                                        disabled={isPending && updatingId === preorder.id}
                                                        onClick={() => handleToggle(preorder.id, !preorder.picked_up)}
                                                        className={`beheer-button flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 ${preorder.picked_up ? 'bg-green-500/10 text-green-600' : 'bg-(--beheer-accent)/10 text-(--beheer-accent) hover:bg-(--beheer-accent)/20'}`}
                                                    >
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        {preorder.picked_up ? 'Opgehaald' : 'Markeer als opgehaald'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
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
