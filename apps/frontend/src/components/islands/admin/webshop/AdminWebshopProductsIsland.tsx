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

function StockBadge({ product }: { product: AdminProduct }) {
    if (product.stock_quantity === null) {
        return <span className="text-(--beheer-text-muted)">Onbeperkt</span>;
    }
    if (product.stock_quantity === 0) {
        return <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-500">Uitverkocht</span>;
    }
    return <span>{product.stock_quantity} stuks</span>;
}

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
            <div className="admin-container space-y-12 py-4 md:py-8">
                {/* Drop windows */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-l-4 border-(--beheer-accent) py-1 pl-4">
                        <h2 className="flex items-center gap-3 text-sm font-semibold text-(--beheer-text)">
                            Drops
                            <span className="rounded-full border border-(--beheer-accent)/20 bg-(--beheer-accent)/10 px-2.5 py-0.5 text-xs font-semibold text-(--beheer-accent)">
                                {dropWindows.length}
                            </span>
                        </h2>
                        <button
                            onClick={() => setDropWindowModal({ open: true, editing: null })}
                            className="beheer-button flex w-fit shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-(--beheer-accent) px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:opacity-95 active:scale-95"
                        >
                            <Plus className="size-4" />
                            <span>Nieuwe drop</span>
                        </button>
                    </div>

                    <div className="overflow-hidden rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) shadow-xl">
                        {dropWindows.length === 0 ? (
                            <div className="py-16 text-center">
                                <CalendarClock className="mx-auto mb-4 size-12 text-(--beheer-text-muted) opacity-10" />
                                <p className="text-sm font-semibold text-(--beheer-text-muted)">Nog geen drops aangemaakt</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="border-b border-(--beheer-border) bg-(--beheer-card-soft)">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-semibold text-(--beheer-text-muted)">Naam</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-(--beheer-text-muted)">Status</th>
                                            <th className="hidden px-6 py-4 text-xs font-semibold text-(--beheer-text-muted) sm:table-cell">Sluit op</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-(--beheer-text-muted)">Acties</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-(--beheer-border)">
                                        {dropWindows.map((dw) => (
                                            <tr key={dw.id}>
                                                <td className="px-6 py-4 text-sm font-semibold text-(--beheer-text)">{dw.name}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${dw.status === 'open' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500' : dw.status === 'closed' ? 'border-slate-500/20 bg-slate-500/10 text-slate-500' : 'border-amber-500/20 bg-amber-500/10 text-amber-500'}`}>
                                                        {dw.status ? STATUS_LABELS[dw.status] ?? dw.status : 'Onbekend'}
                                                    </span>
                                                </td>
                                                <td className="hidden px-6 py-4 text-sm text-(--beheer-text-muted) sm:table-cell">
                                                    {dw.closes_at ? formatDate(new Date(dw.closes_at), 'd MMMM yyyy HH:mm') : '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => setDropWindowModal({ open: true, editing: dw })} className="icon-button cursor-pointer rounded-lg p-2 text-(--beheer-text-muted) transition-all hover:bg-(--beheer-accent)/10 hover:text-(--beheer-accent)" aria-label="Bewerken">
                                                            <Edit2 className="size-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteDropWindow(dw.id)} disabled={deletingId === dw.id} className="icon-button cursor-pointer rounded-lg p-2 text-red-500 transition-all hover:bg-red-500/10 disabled:opacity-50" aria-label="Verwijderen">
                                                            <Trash2 className="size-4" />
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
                    <div className="flex items-center justify-between border-l-4 border-(--beheer-accent) py-1 pl-4">
                        <h2 className="flex items-center gap-3 text-sm font-semibold text-(--beheer-text)">
                            Producten
                            <span className="rounded-full border border-(--beheer-accent)/20 bg-(--beheer-accent)/10 px-2.5 py-0.5 text-xs font-semibold text-(--beheer-accent)">
                                {products.length}
                            </span>
                        </h2>
                        <button
                            onClick={() => setProductModal({ open: true, editing: null })}
                            className="beheer-button flex w-fit shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-(--beheer-accent) px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:opacity-95 active:scale-95"
                        >
                            <Plus className="size-4" />
                            <span>Nieuw product</span>
                        </button>
                    </div>

                    <div className="overflow-hidden rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) shadow-xl">
                        {products.length === 0 ? (
                            <div className="py-16 text-center">
                                <Package className="mx-auto mb-4 size-12 text-(--beheer-text-muted) opacity-10" />
                                <p className="text-sm font-semibold text-(--beheer-text-muted)">Nog geen producten aangemaakt</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="border-b border-(--beheer-border) bg-(--beheer-card-soft)">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-semibold text-(--beheer-text-muted)">Naam</th>
                                            <th className="hidden px-6 py-4 text-xs font-semibold text-(--beheer-text-muted) sm:table-cell">Type</th>
                                            <th className="hidden px-6 py-4 text-xs font-semibold text-(--beheer-text-muted) lg:table-cell">Drop</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-(--beheer-text-muted)">Prijs</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-(--beheer-text-muted)">Voorraad</th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-(--beheer-text-muted)">Actief</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-(--beheer-text-muted)">Acties</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-(--beheer-border)">
                                        {products.map((product) => (
                                            <tr key={product.id}>
                                                <td className="px-6 py-4 text-sm font-semibold text-(--beheer-text)">{product.name}</td>
                                                <td className="hidden px-6 py-4 text-sm text-(--beheer-text-muted) capitalize sm:table-cell">{product.type}</td>
                                                <td className="hidden px-6 py-4 text-sm text-(--beheer-text-muted) lg:table-cell">
                                                    {product.drop_window_id ? dropWindowById.get(product.drop_window_id)?.name || '-' : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-(--beheer-text-muted)">€{Number(product.price).toFixed(2)}</td>
                                                <td className="px-6 py-4 text-sm text-(--beheer-text-muted)"><StockBadge product={product} /></td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => handleToggleActive(product)} disabled={togglingId === product.id} className="icon-button cursor-pointer text-(--beheer-text-muted) transition-all hover:text-(--beheer-accent) disabled:opacity-50">
                                                        {product.is_active ? <ToggleRight className="mx-auto size-6 text-emerald-500" /> : <ToggleLeft className="mx-auto size-6" />}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => setProductModal({ open: true, editing: product })} className="icon-button cursor-pointer rounded-lg p-2 text-(--beheer-text-muted) transition-all hover:bg-(--beheer-accent)/10 hover:text-(--beheer-accent)" aria-label="Bewerken">
                                                            <Edit2 className="size-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteProduct(product.id)} disabled={deletingId === product.id} className="icon-button cursor-pointer rounded-lg p-2 text-red-500 transition-all hover:bg-red-500/10 disabled:opacity-50" aria-label="Verwijderen">
                                                            <Trash2 className="size-4" />
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