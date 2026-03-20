'use client';

import { useState, useTransition } from 'react';
import {
    Ticket, Plus, Percent, CheckCircle, XCircle, Trash2, Euro, Calendar,
    Loader2, X, AlertCircle, Save, ToggleLeft, ToggleRight
} from 'lucide-react';
import type { Coupon } from '@/server/actions/admin-coupons.actions';
import { getComputedCouponStatus } from '@/lib/coupon-utils';
import { createCoupon, deleteCoupon, toggleCouponActive } from '@/server/actions/admin-coupons.actions';


interface Props {
    initialCoupons: Coupon[];
}

export default function CouponManagementIsland({ initialCoupons }: Props) {
    const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
    const [showForm, setShowForm] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
    const [isPending, startTransition] = useTransition();
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [togglingId, setTogglingId] = useState<number | null>(null);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(val);

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormError(null);
        const form = e.currentTarget;
        const fd = new FormData(form);
        fd.set('discount_type', discountType);

        startTransition(async () => {
            const res = await createCoupon(fd);
            if (!res.success) {
                setFormError(res.error ?? 'Aanmaken mislukt');
                return;
            }
            // Reload coupons after create
            const { getCoupons } = await import('@/server/actions/admin-coupons.actions');
            const fresh = await getCoupons();
            setCoupons(fresh);
            setShowForm(false);
            form.reset();
            setDiscountType('fixed');
        });
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Weet je zeker dat je deze coupon wilt verwijderen?')) return;
        setDeletingId(id);
        const res = await deleteCoupon(id);
        if (res.success) setCoupons(prev => prev.filter(c => c.id !== id));
        else alert(res.error ?? 'Verwijderen mislukt');
        setDeletingId(null);
    };

    const handleToggle = async (coupon: Coupon) => {
        setTogglingId(coupon.id);
        const res = await toggleCouponActive(coupon.id, coupon.is_active);
        if (res.success) setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c));
        else alert(res.error ?? 'Bijwerken mislukt');
        setTogglingId(null);
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header action bar */}
            <div className="flex justify-end mb-6">
                {showForm ? (
                    <button
                        onClick={() => { setShowForm(false); setFormError(null); }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--border-color)] text-[var(--text-muted)] font-bold text-sm hover:bg-[var(--border-color)] transition"
                    >
                        <X className="h-4 w-4" /> Annuleren
                    </button>
                ) : (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--theme-purple)] text-white font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition"
                    >
                        <Plus className="h-4 w-4" /> Nieuwe Coupon
                    </button>
                )}
            </div>

            {/* Create Form */}
            {showForm && (
                <form onSubmit={handleCreate} className="bg-[var(--bg-card)] ring-1 ring-[var(--border-color)] rounded-2xl p-6 mb-8 space-y-6">
                    <h3 className="font-bold text-lg text-[var(--text-main)]">Nieuwe Coupon Aanmaken</h3>

                    {formError && (
                        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {formError}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Coupon Code */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Coupon Code *</label>
                            <div className="relative">
                                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                                <input
                                    type="text"
                                    name="coupon_code"
                                    required
                                    placeholder="BV. KORTING2025"
                                    className={inputClass + ' pl-9 font-mono uppercase tracking-widest'}
                                    onChange={e => e.target.value = e.target.value.toUpperCase()}
                                />
                            </div>
                        </div>

                        {/* Discount Type */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Type Korting</label>
                            <div className="flex bg-[var(--bg-card-soft,_#f4f4f5)] p-1 rounded-xl">
                                <button type="button" onClick={() => setDiscountType('fixed')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${discountType === 'fixed' ? 'bg-[var(--theme-purple)] text-white shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
                                    <Euro className="inline h-3.5 w-3.5 mr-1" /> Vast Bedrag
                                </button>
                                <button type="button" onClick={() => setDiscountType('percentage')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${discountType === 'percentage' ? 'bg-[var(--theme-purple)] text-white shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
                                    <Percent className="inline h-3.5 w-3.5 mr-1" /> Percentage
                                </button>
                            </div>
                        </div>

                        {/* Discount Value */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Waarde *</label>
                            <div className="relative">
                                {discountType === 'fixed'
                                    ? <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                                    : <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />}
                                <input
                                    type="number"
                                    name="discount_value"
                                    required
                                    min="0.01"
                                    max={discountType === 'percentage' ? 100 : undefined}
                                    step="0.01"
                                    placeholder={discountType === 'fixed' ? '10.00' : '20'}
                                    className={inputClass + ' pl-9'}
                                />
                            </div>
                        </div>

                        {/* Usage Limit */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Gebruikslimiet (optioneel)</label>
                            <input type="number" name="usage_limit" min="1" placeholder="Onbeperkt" className={inputClass} />
                        </div>

                        {/* Valid From */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Geldig Vanaf</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                                <input type="date" name="valid_from" className={inputClass + ' pl-9'} />
                            </div>
                        </div>

                        {/* Valid Until */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Geldig Tot</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                                <input type="date" name="valid_until" className={inputClass + ' pl-9'} />
                            </div>
                        </div>
                    </div>

                    {/* Active toggle */}
                    <div className="flex items-center gap-3">
                        <input type="checkbox" id="is_active" name="is_active" defaultChecked className="rounded accent-[var(--theme-purple)] h-4 w-4" />
                        <label htmlFor="is_active" className="text-sm font-medium text-[var(--text-main)]">Direct actief</label>
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t border-[var(--border-color)]">
                        <button type="button" onClick={() => { setShowForm(false); setFormError(null); }} className="px-5 py-2.5 rounded-full text-sm font-bold text-[var(--text-muted)] hover:bg-[var(--border-color)] transition">
                            Annuleren
                        </button>
                        <button type="submit" disabled={isPending} className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--theme-purple)] text-white font-bold text-sm shadow hover:shadow-lg hover:-translate-y-0.5 transition disabled:opacity-60 disabled:translate-y-0">
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {isPending ? 'Opslaan...' : 'Coupon Opslaan'}
                        </button>
                    </div>
                </form>
            )}

            {/* Coupons Table */}
            <div className="bg-[var(--bg-card)] rounded-2xl ring-1 ring-[var(--border-color)] overflow-hidden">
                {coupons.length === 0 ? (
                    <div className="py-20 text-center text-[var(--text-muted)]">
                        <Ticket className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p className="font-bold">Geen coupons gevonden</p>
                        <p className="text-sm mt-1">Klik op "Nieuwe Coupon" om te beginnen.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[var(--bg-card-soft,_#f8f8f8)] border-b border-[var(--border-color)]">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Code</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Korting</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider hidden sm:table-cell">Gebruik</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider hidden lg:table-cell">Geldigheid</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Acties</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {coupons.map(coupon => {
                                    const status = getComputedCouponStatus(coupon);
                                    const isExpiredOrMaxed = status.type === 'expired' || status.type === 'maxed';
                                    return (
                                        <tr key={coupon.id} className="hover:bg-[var(--bg-card-soft,_#f8f8f8)] transition-colors">
                                            {/* Code */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-xl ${isExpiredOrMaxed ? 'bg-gray-100' : 'bg-[var(--theme-purple)]/10'}`}>
                                                        <Ticket className={`h-4 w-4 ${isExpiredOrMaxed ? 'text-gray-400' : 'text-[var(--theme-purple)]'}`} />
                                                    </div>
                                                    <span className="font-bold font-mono tracking-widest text-[var(--text-main)]">{coupon.coupon_code}</span>
                                                </div>
                                            </td>

                                            {/* Discount */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 font-bold text-[var(--text-main)]">
                                                    {coupon.discount_type === 'percentage' ? (
                                                        <><Percent className="h-3.5 w-3.5 text-[var(--text-muted)]" />{coupon.discount_value}%</>
                                                    ) : (
                                                        formatCurrency(coupon.discount_value)
                                                    )}
                                                </div>
                                            </td>

                                            {/* Usage */}
                                            <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-[var(--text-main)]">
                                                        {coupon.usage_count} <span className="font-normal text-[var(--text-muted)]">/ {coupon.usage_limit ?? '∞'}</span>
                                                    </span>
                                                    {coupon.usage_limit !== null && (
                                                        <div className="w-24 h-1.5 bg-[var(--border-color)] rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full bg-[var(--theme-purple)] transition-all"
                                                                style={{ width: `${Math.min((coupon.usage_count / coupon.usage_limit) * 100, 100)}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Validity */}
                                            <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                                                <div className="flex flex-col text-xs text-[var(--text-muted)]">
                                                    {coupon.valid_from && (
                                                        <span>Van: {new Date(coupon.valid_from).toLocaleDateString('nl-NL')}</span>
                                                    )}
                                                    {coupon.valid_until ? (
                                                        <span className={new Date(coupon.valid_until) < new Date() ? 'text-red-500' : ''}>
                                                            Tot: {new Date(coupon.valid_until).toLocaleDateString('nl-NL')}
                                                        </span>
                                                    ) : (
                                                        <span>Geen einddatum</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${status.color}`} title={status.description}>
                                                    {status.type === 'active'
                                                        ? <CheckCircle className="h-3 w-3" />
                                                        : <XCircle className="h-3 w-3" />}
                                                    {status.label}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {/* Toggle active */}
                                                    <button
                                                        onClick={() => handleToggle(coupon)}
                                                        disabled={togglingId === coupon.id}
                                                        title={coupon.is_active ? 'Deactiveren' : 'Activeren'}
                                                        className="p-2 text-[var(--text-muted)] hover:text-[var(--theme-purple)] hover:bg-[var(--theme-purple)]/10 rounded-xl transition"
                                                    >
                                                        {togglingId === coupon.id
                                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                                            : coupon.is_active
                                                                ? <ToggleRight className="h-4 w-4 text-green-500" />
                                                                : <ToggleLeft className="h-4 w-4" />}
                                                    </button>
                                                    {/* Delete */}
                                                    <button
                                                        onClick={() => handleDelete(coupon.id)}
                                                        disabled={deletingId === coupon.id}
                                                        title="Verwijderen"
                                                        className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
                                                    >
                                                        {deletingId === coupon.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Summary stats */}
            {coupons.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-[var(--text-muted)]">
                    <span><strong className="text-[var(--text-main)]">{coupons.filter(c => getComputedCouponStatus(c).type === 'active').length}</strong> actief</span>
                    <span><strong className="text-[var(--text-main)]">{coupons.filter(c => getComputedCouponStatus(c).type === 'expired').length}</strong> verlopen</span>
                    <span><strong className="text-[var(--text-main)]">{coupons.reduce((sum, c) => sum + c.usage_count, 0)}</strong> totaal gebruikt</span>
                </div>
            )}
        </div>
    );
}

const inputClass = 'w-full px-4 py-2.5 rounded-xl bg-[var(--bg-card,_white)] border border-[var(--border-color)] text-[var(--text-main)] text-sm focus:ring-2 focus:ring-[var(--theme-purple)] focus:outline-none transition';
