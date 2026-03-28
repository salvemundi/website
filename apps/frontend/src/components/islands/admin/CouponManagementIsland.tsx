'use client';

import { useState, useTransition, useMemo } from 'react';
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
    const [showExpired, setShowExpired] = useState(false);

    const { validCoupons, inactiveCoupons } = useMemo(() => {
        const valid: Coupon[] = [];
        const inactive: Coupon[] = [];
        
        coupons.forEach(c => {
            const status = getComputedCouponStatus(c);
            if (status.type === 'active' || status.type === 'pending' || status.type === 'inactive') {
                valid.push(c);
            } else {
                inactive.push(c);
            }
        });
        
        return { validCoupons: valid, inactiveCoupons: inactive };
    }, [coupons]);

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
                <form onSubmit={handleCreate} className="bg-[var(--bg-card)] ring-1 ring-[var(--border-color)] rounded-2xl p-6 mb-8 space-y-6 shadow-xl">
                    <h3 className="font-bold text-lg text-[var(--text-main)] flex items-center gap-2">
                        <Plus className="h-5 w-5 text-[var(--theme-purple)]" />
                        Nieuwe Coupon Aanmaken
                    </h3>

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
                                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] z-10" />
                                <input
                                    type="text"
                                    name="coupon_code"
                                    required
                                    placeholder="BV. KORTING2025"
                                    className="form-input pl-10 font-mono uppercase tracking-widest"
                                    onChange={e => e.target.value = e.target.value.toUpperCase()}
                                />
                            </div>
                        </div>

                        {/* Discount Type */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Type Korting</label>
                            <div className="flex bg-[var(--bg-soft)] p-1 rounded-xl ring-1 ring-[var(--border-color)]">
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
                                    ? <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] z-10" />
                                    : <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] z-10" />}
                                <input
                                    type="number"
                                    name="discount_value"
                                    required
                                    min="0.01"
                                    max={discountType === 'percentage' ? 100 : undefined}
                                    step="0.01"
                                    placeholder={discountType === 'fixed' ? '10.00' : '20'}
                                    className="form-input pl-10"
                                />
                            </div>
                        </div>

                        {/* Usage Limit */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Gebruikslimiet (optioneel)</label>
                            <input type="number" name="usage_limit" min="1" placeholder="Onbeperkt" className="form-input" />
                        </div>

                        {/* Valid From */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Geldig Vanaf</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] z-10" />
                                <input type="date" name="valid_from" className="form-input pl-10" />
                            </div>
                        </div>

                        {/* Valid Until */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Geldig Tot</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] z-10" />
                                <input type="date" name="valid_until" className="form-input pl-10" />
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
            {/* Valid Coupons Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Geldige Coupons
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs">
                            {validCoupons.length}
                        </span>
                    </h2>
                </div>

                <div className="bg-[var(--bg-card)] rounded-2xl ring-1 ring-[var(--border-color)] overflow-hidden shadow-sm">
                    {validCoupons.length === 0 ? (
                        <div className="py-12 text-center text-[var(--text-muted)]">
                            <Ticket className="h-10 w-10 mx-auto mb-3 opacity-20" />
                            <p className="font-bold">Geen actieve coupons</p>
                            <p className="text-xs mt-1">Nieuwe coupons verschijnen hier.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-[var(--bg-soft)] border-b border-[var(--border-color)]">
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
                                    {validCoupons.map(coupon => (
                                        <CouponRow 
                                            key={coupon.id} 
                                            coupon={coupon} 
                                            onToggle={handleToggle} 
                                            onDelete={handleDelete}
                                            isToggling={togglingId === coupon.id}
                                            isDeleting={deletingId === coupon.id}
                                            formatCurrency={formatCurrency}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Inactive / Expired Section */}
            <div className="mt-12 space-y-4">
                <button 
                    onClick={() => setShowExpired(!showExpired)}
                    className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition group"
                >
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        {showExpired ? <ToggleRight className="h-5 w-5 text-[var(--theme-purple)]" /> : <ToggleLeft className="h-5 w-5" />}
                        Verlopen of Inactieve Coupons
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs">
                            {inactiveCoupons.length}
                        </span>
                    </h2>
                    <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        {showExpired ? '(Klik om te verbergen)' : '(Klik om te tonen)'}
                    </span>
                </button>

                {showExpired && (
                    <div className="bg-[var(--bg-card)] rounded-2xl ring-1 ring-[var(--border-color)] overflow-hidden opacity-80 shadow-sm transition-all animate-in fade-in slide-in-from-top-2">
                        {inactiveCoupons.length === 0 ? (
                            <div className="py-8 text-center text-[var(--text-muted)]">
                                <p className="text-sm italic">Geen inactieve coupons gevonden.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-[var(--bg-soft)] border-b border-[var(--border-color)]">
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
                                        {inactiveCoupons.map(coupon => (
                                            <CouponRow 
                                                key={coupon.id} 
                                                coupon={coupon} 
                                                onToggle={handleToggle} 
                                                onDelete={handleDelete}
                                                isToggling={togglingId === coupon.id}
                                                isDeleting={deletingId === coupon.id}
                                                formatCurrency={formatCurrency}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
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

function CouponRow({ 
    coupon, 
    onToggle, 
    onDelete, 
    isToggling, 
    isDeleting, 
    formatCurrency 
}: { 
    coupon: Coupon; 
    onToggle: (c: Coupon) => void; 
    onDelete: (id: number) => void;
    isToggling: boolean;
    isDeleting: boolean;
    formatCurrency: (val: number) => string;
}) {
    const status = getComputedCouponStatus(coupon);
    const isExpiredOrMaxed = status.type === 'expired' || status.type === 'maxed' || status.type === 'inactive';
    
    return (
        <tr className="hover:bg-[var(--bg-soft)] transition-colors border-b border-[var(--border-color)] last:border-0 opacity-100 group">
            {/* Code */}
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isExpiredOrMaxed ? 'bg-gray-100 dark:bg-gray-800' : 'bg-[var(--theme-purple)]/10'}`}>
                        <Ticket className={`h-4 w-4 ${isExpiredOrMaxed ? 'text-[var(--text-muted)]' : 'text-[var(--theme-purple)]'}`} />
                    </div>
                    <span className={`font-bold font-mono tracking-widest ${isExpiredOrMaxed ? 'text-[var(--text-muted)]' : 'text-[var(--text-main)]'}`}>
                        {coupon.coupon_code}
                    </span>
                </div>
            </td>

            {/* Discount */}
            <td className="px-6 py-4 whitespace-nowrap">
                <div className={`flex items-center gap-1.5 font-bold ${isExpiredOrMaxed ? 'text-[var(--text-muted)]' : 'text-[var(--text-main)]'}`}>
                    {coupon.discount_type === 'percentage' ? (
                        <><Percent className="h-3.5 w-3.5 opacity-50" />{coupon.discount_value}%</>
                    ) : (
                        formatCurrency(coupon.discount_value)
                    )}
                </div>
            </td>

            {/* Usage */}
            <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                <div className={`flex flex-col gap-0.5 ${isExpiredOrMaxed ? 'opacity-60' : ''}`}>
                    <span className="font-bold text-[var(--text-main)]">
                        {coupon.usage_count} <span className="font-normal text-[var(--text-muted)]">/ {coupon.usage_limit ?? '∞'}</span>
                    </span>
                    {coupon.usage_limit !== null && (
                        <div className="w-24 h-1.5 bg-[var(--border-color)] rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${isExpiredOrMaxed ? 'bg-gray-400' : 'bg-[var(--theme-purple)]'}`}
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
                        <span className={status.type === 'expired' ? 'text-red-500 font-bold' : ''}>
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
                    {(status.type === 'active' || status.type === 'pending')
                        ? <CheckCircle className="h-3 w-3" />
                        : <XCircle className="h-3 w-3" />}
                    {status.label}
                </span>
            </td>

            {/* Actions */}
            <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={() => onToggle(coupon)}
                        disabled={isToggling}
                        title={coupon.is_active ? 'Deactiveren' : 'Activeren'}
                        className="p-2 text-[var(--text-muted)] hover:text-[var(--theme-purple)] hover:bg-[var(--theme-purple)]/10 rounded-xl transition"
                    >
                        {isToggling
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : coupon.is_active
                                ? <ToggleRight className="h-4 w-4 text-green-500" />
                                : <ToggleLeft className="h-4 w-4" />}
                    </button>
                    <button
                        onClick={() => onDelete(coupon.id)}
                        disabled={isDeleting}
                        title="Verwijderen"
                        className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
                    >
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                </div>
            </td>
        </tr>
    );
}
