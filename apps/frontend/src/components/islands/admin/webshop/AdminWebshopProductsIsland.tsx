'use client';

import { useState, useTransition } from 'react';
import { Package, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, CalendarClock} from 'lucide-react';
import AdminModal from '@/components/ui/admin/AdminModal';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import AdminWebshopDropWindowForm from './AdminWebshopDropWindowForm';
import AdminWebshopProductForm from './AdminWebshopProductForm';
import {
    saveDropWindow,
    deleteDropWindow,
    saveProduct,
    deleteProduct,
    toggleProductActive
} from '@/server/actions/admin/webshop/admin-webshop-products.actions';
import { formatDate } from '@/shared/lib/utils/date';
import { type AdminDropWindow, type AdminProduct } from './webshop-admin-types';

interface Props {
    initialDropWindows: AdminDropWindow[];
    initialProducts: AdminProduct[];
}

const STATUS_LABELS: Record<string, string> = {
    draft: 'Concept',
    open: 'Open',
    closed: 'Gesloten'
};

export default function AdminWebshopProductsIsland({ initialDropWindows, initialProducts }: Props) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [dropWindows, setDropWindows] = useState(initialDropWindows);
    const [products, setProducts] = useState(initialProducts);
    const [isPending, startTransition] = useTransition();
    const [formError, setFormError] = useState<string | null>(null);

    const [dropWindowModal, setDropWindowModal] = useState<{ open: boolean; editing: AdminDropWindow | null }>({ open: false, editing: null });
    const [productModal, setProductModal] = useState<{ open: boolean; editing: AdminProduct | null }>({ open: false, editing: null });
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const dropWindowById = new Map(dropWindows.map(dw => [dw.id, dw]));

    const handleSaveDropWindow = (formData: FormData) => {
        setFormError(null);
        startTransition(async () => {
            const res = await saveDropWindow(formData);
            if (!res.success) {
                setFormError(res.error || 'Opslaan mislukt.');
                return;
            }
            setDropWindowModal({ open: false, editing: null });
            showToast('Drop opgeslagen', 'success');
            window.location.reload();
        });
    };

    const handleDeleteDropWindow = (id: number) => {
        if (!confirm('Weet je zeker dat je deze drop wilt verwijderen?')) return;
        setDeletingId(id);
        startTransition(async () => {
            const res = await deleteDropWindow(id);
            if (res.success) {
                setDropWindows(prev => prev.filter(dw => dw.id !== id));
                showToast('Drop verwijderd', 'success');
            } else {
                showToast(res.error || 'Verwijderen mislukt', 'error');
            }
            setDeletingId(null);
        });
    };

    const handleSaveProduct = (formData: FormData) => {
        setFormError(null);
        startTransition(async () => {
            const res = await saveProduct(formData);
            if (!res.success) {
                setFormError(res.error || 'Opslaan mislukt.');
                return;
            }
            setProductModal({ open: false, editing: null });
            showToast('Product opgeslagen', 'success');
            window.location.reload();
        });
    };

    const handleDeleteProduct = (id: number) => {
        if (!confirm('Weet je zeker dat je dit product wilt verwijderen?')) return;
        setDeletingId(id);
        startTransition(async () => {
            const res = await deleteProduct(id);
            if (res.success) {
                setProducts(prev => prev.filter(p => p.id !== id));
                showToast('Product verwijderd', 'success');
            } else {
                showToast(res.error || 'Verwijderen mislukt', 'error');
            }
            setDeletingId(null);
        });
    };

    const handleToggleActive = (product: AdminProduct) => {
        setTogglingId(product.id);
        startTransition(async () => {
            const res = await toggleProductActive(product.id, !!product.is_active);
            if (res.success) {
                setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: !p.is_active } : p));
                showToast(`Product ${product.is_active ? 'gedeactiveerd' : 'geactiveerd'}`, 'success');
            } else {
                showToast(res.error || 'Bijwerken mislukt', 'error');
            }
            setTogglingId(null);
        });
    };

    return (
        <>
            <div className="admin-container py-4 md:py-8 space-y-12">
                {/* Drop windows */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-l-4 border-(--beheer-active) pl-4 py-1">
                        <h2 className="text-sm font-semibold text-(--beheer-text) flex items-center gap-3">
                            Drops
                            <span className="px-2.5 py-0.5 rounded-full bg-(--beheer-active)/10 text-(--beheer-active) text-xs font-semibold border border-(--beheer-active)/20">
                                {dropWindows.length}
                            </span>
                        </h2>
                        <button
                            onClick={() => setDropWindowModal({ open: true, editing: null })}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-theme-purple text-white rounded-xl text-xs font-semibold shadow-lg hover:opacity-90 transition-all active:scale-95"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Nieuwe drop</span>
                        </button>
                    </div>

                    <div className="bg-(--beheer-card-bg) rounded-(--beheer-radius) border border-(--beheer-border) overflow-hidden shadow-xl">
                        {dropWindows.length === 0 ? (
                            <div className="py-16 text-center">
                                <CalendarClock className="h-12 w-12 text-(--beheer-text-muted) mx-auto mb-4 opacity-10" />
                                <p className="font-semibold text-sm text-(--beheer-text-muted)">Nog geen drops aangemaakt</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-(--beheer-card-soft) border-b border-(--beheer-border)">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-semibold text-(--beheer-text-muted)">Naam</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-(--beheer-text-muted)">Status</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-(--beheer-text-muted) hidden sm:table-cell">Sluit op</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-(--beheer-text-muted)">Acties</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-(--beheer-border)">
                                        {dropWindows.map((dw) => (
                                            <tr key={dw.id}>
                                                <td className="px-6 py-4 font-semibold text-(--beheer-text) text-sm">{dw.name}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${dw.status === 'open' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : dw.status === 'closed' ? 'bg-slate-500/10 text-slate-500 border-slate-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                                        {dw.status ? STATUS_LABELS[dw.status] ?? dw.status : 'Onbekend'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-(--beheer-text-muted) hidden sm:table-cell">
                                                    {dw.closes_at ? formatDate(new Date(dw.closes_at), 'd MMMM yyyy HH:mm') : '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => setDropWindowModal({ open: true, editing: dw })} className="p-2 rounded-lg text-(--beheer-text-muted) hover:text-theme-purple hover:bg-theme-purple/10 transition-all" aria-label="Bewerken">
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteDropWindow(dw.id)} disabled={deletingId === dw.id} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50" aria-label="Verwijderen">
                                                            <Trash2 className="h-4 w-4" />
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

                {/* Products */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-l-4 border-(--beheer-active) pl-4 py-1">
                        <h2 className="text-sm font-semibold text-(--beheer-text) flex items-center gap-3">
                            Producten
                            <span className="px-2.5 py-0.5 rounded-full bg-(--beheer-active)/10 text-(--beheer-active) text-xs font-semibold border border-(--beheer-active)/20">
                                {products.length}
                            </span>
                        </h2>
                        <button
                            onClick={() => setProductModal({ open: true, editing: null })}
                            disabled={dropWindows.length === 0}
                            title={dropWindows.length === 0 ? 'Maak eerst een drop aan' : undefined}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-theme-purple text-white rounded-xl text-xs font-semibold shadow-lg hover:opacity-90 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Nieuw product</span>
                        </button>
                    </div>

                    <div className="bg-(--beheer-card-bg) rounded-(--beheer-radius) border border-(--beheer-border) overflow-hidden shadow-xl">
                        {products.length === 0 ? (
                            <div className="py-16 text-center">
                                <Package className="h-12 w-12 text-(--beheer-text-muted) mx-auto mb-4 opacity-10" />
                                <p className="font-semibold text-sm text-(--beheer-text-muted)">Nog geen producten aangemaakt</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-(--beheer-card-soft) border-b border-(--beheer-border)">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-semibold text-(--beheer-text-muted)">Naam</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-(--beheer-text-muted) hidden sm:table-cell">Type</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-(--beheer-text-muted) hidden lg:table-cell">Drop</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-(--beheer-text-muted)">Prijs</th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-(--beheer-text-muted)">Actief</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-(--beheer-text-muted)">Acties</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-(--beheer-border)">
                                        {products.map((product) => (
                                            <tr key={product.id}>
                                                <td className="px-6 py-4 font-semibold text-(--beheer-text) text-sm">{product.name}</td>
                                                <td className="px-6 py-4 text-sm text-(--beheer-text-muted) hidden sm:table-cell capitalize">{product.type}</td>
                                                <td className="px-6 py-4 text-sm text-(--beheer-text-muted) hidden lg:table-cell">
                                                    {product.drop_window_id ? dropWindowById.get(product.drop_window_id)?.name || '-' : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-(--beheer-text-muted)">€{Number(product.price).toFixed(2)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => handleToggleActive(product)} disabled={togglingId === product.id} className="text-(--beheer-text-muted) hover:text-theme-purple transition-all disabled:opacity-50">
                                                        {product.is_active ? <ToggleRight className="h-6 w-6 text-emerald-500 mx-auto" /> : <ToggleLeft className="h-6 w-6 mx-auto" />}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => setProductModal({ open: true, editing: product })} className="p-2 rounded-lg text-(--beheer-text-muted) hover:text-theme-purple hover:bg-theme-purple/10 transition-all" aria-label="Bewerken">
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteProduct(product.id)} disabled={deletingId === product.id} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50" aria-label="Verwijderen">
                                                            <Trash2 className="h-4 w-4" />
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
            </div>

            <AdminModal
                isOpen={dropWindowModal.open}
                onClose={() => { setDropWindowModal({ open: false, editing: null }); setFormError(null); }}
                title={dropWindowModal.editing ? 'Drop Bewerken' : 'Nieuwe Drop Aanmaken'}
                maxWidth="lg"
            >
                <AdminWebshopDropWindowForm
                    dropWindow={dropWindowModal.editing}
                    onSave={handleSaveDropWindow}
                    onCancel={() => { setDropWindowModal({ open: false, editing: null }); setFormError(null); }}
                    isPending={isPending}
                    error={formError}
                />
            </AdminModal>

            <AdminModal
                isOpen={productModal.open}
                onClose={() => { setProductModal({ open: false, editing: null }); setFormError(null); }}
                title={productModal.editing ? 'Product Bewerken' : 'Nieuw Product Aanmaken'}
                maxWidth="4xl"
            >
                <AdminWebshopProductForm
                    product={productModal.editing}
                    dropWindows={dropWindows}
                    onSave={handleSaveProduct}
                    onCancel={() => { setProductModal({ open: false, editing: null }); setFormError(null); }}
                    isPending={isPending}
                    error={formError}
                />
            </AdminModal>

            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}
