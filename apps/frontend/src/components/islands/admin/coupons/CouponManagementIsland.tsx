'use client';

import {
    useState, useTransition, useMemo
} from 'react';
import {
    Ticket, Plus, CheckCircle, Clock, ToggleLeft, ToggleRight
} from 'lucide-react';
import { type Coupon } from './coupon-types';
import { getComputedCouponStatus } from '@/lib/coupons';
import { createCoupon, deleteCoupon, toggleCouponActive } from '@/server/actions/admin/admin-coupons.actions';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';
import AdminModal from '@/components/ui/admin/AdminModal';
import CouponRow from './CouponRow';
import CouponForm from './CouponForm';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';

interface Props {
    initialCoupons?: Coupon[];
}

export default function CouponManagementIsland({
    initialCoupons = [] }: Props) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
    const [isAdding, setIsAdding] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [showExpired, setShowExpired] = useState(false);

    const { validCoupons, inactiveCoupons } = useMemo(() => {
        const valid: Coupon[] = [];
        const inactive: Coupon[] = [];

        coupons.forEach(c => {
            const status = getComputedCouponStatus(c);
            if (status.type !== 'expired') {
                valid.push(c);
            } else {
                inactive.push(c);
            }
        });

        return { validCoupons: valid, inactiveCoupons: inactive };
    }, [coupons]);

    const handleCreate = async (formData: FormData, discountType: 'fixed' | 'percentage') => {
        setFormError(null);
        formData.set('discount_type', discountType);

        const code = (formData.get('coupon_code') as string || '').toUpperCase();
        const value = Number(formData.get('discount_value'));
        const isActive = formData.get('is_active') === 'on';

        const tempId = -Math.floor(Math.random() * 1000000);
        const tempCoupon: Coupon = {
            id: tempId,
            coupon_code: code,
            discount_type: discountType,
            discount_value: value,
            usage_count: 0,
            usage_limit: formData.get('usage_limit') ? Number(formData.get('usage_limit')) : null,
            valid_from: (formData.get('valid_from') as string) || null,
            valid_until: (formData.get('valid_until') as string) || null,
            is_active: isActive,
            isOptimistic: true
        };

        setCoupons(prev => [tempCoupon, ...prev]);
        setIsAdding(false);

        startTransition(async () => {
            const res = await createCoupon(formData);

            if (!res.success) {
                setFormError(res.error ?? 'Aanmaken mislukt');
                setCoupons(prev => prev.filter(c => c.id !== tempId));
                setIsAdding(true);
                return;
            }

            const newCoupon = res.data;
            if (newCoupon) {
                setCoupons(prev => prev.map(c => c.id === tempId ? newCoupon : c));
            }
        });
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Weet je zeker dat je deze coupon wilt verwijderen?')) return;
        setDeletingId(id);
        const res = await deleteCoupon(Number(id));
        if (res.success) {
            setCoupons(prev => prev.filter(c => c.id !== id));
            showToast('Coupon succesvol verwijderd', 'success');
        } else {
            showToast(res.error ?? 'Verwijderen mislukt', 'error');
        }
        setDeletingId(null);
    };

    const handleToggle = async (coupon: Coupon) => {
        setTogglingId(coupon.id);
        const res = await toggleCouponActive(coupon.id, coupon.is_active);
        if (res.success) {
            setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c));
            showToast(`Coupon ${coupon.is_active ? 'gedeactiveerd' : 'geactiveerd'}`, 'success');
        } else {
            showToast(res.error ?? 'Bijwerken mislukt', 'error');
        }
        setTogglingId(null);
    };

    const adminStats = [
        { label: 'Totaal', value: coupons.length, icon: Ticket },
        { label: 'Nu Actief', value: coupons.filter(c => getComputedCouponStatus(c).type === 'active').length, icon: CheckCircle },
        { label: 'Verlopen', value: coupons.filter(c => getComputedCouponStatus(c).type === 'expired').length, icon: Clock },
        { label: 'Gebruikt', value: coupons.reduce((sum, c) => sum + (c.usage_count || 0), 0), icon: Ticket },
    ];

    return (
        <>
            <AdminToolbar
                title="Coupons Beheer"
                backHref="/beheer"
                actions={
                    <button
                        onClick={() => setIsAdding(true)}
                        className="squircle beheer-button flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-theme-purple px-4 py-2 text-xs font-semibold whitespace-nowrap text-white shadow-lg transition-all hover:opacity-90 active:scale-95"
                    >
                        <Plus className="size-4" />
                        <span>Nieuwe Coupon</span>
                    </button>
                }
            />

            <div className="admin-container py-4 md:py-8">
                <AdminModal
                    isOpen={isAdding}
                    onClose={() => setIsAdding(false)}
                    title="Nieuwe Coupon Aanmaken"
                    maxWidth="3xl"
                >
                    <CouponForm
                        onSave={(formData, discountType) => { void handleCreate(formData, discountType); }}
                        onCancel={() => setIsAdding(false)}
                        isPending={isPending}
                        error={formError}
                    />
                </AdminModal>

                <AdminStatsBar stats={adminStats} />

                <div className="space-y-4">
                    <div className="flex items-center justify-between border-l-4 border-(--beheer-active) py-1 pl-4">
                        <h2 className="flex items-center gap-3 text-sm font-semibold text-(--beheer-text)">
                            Coupons
                            <span className="rounded-full border border-(--beheer-active)/20 bg-(--beheer-active)/10 px-2.5 py-0.5 text-xs font-semibold text-(--beheer-active)">
                                {validCoupons.length}
                            </span>
                        </h2>
                    </div>

                    <div
                        className="overflow-hidden rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) shadow-xl transition-all"
                    >
                        {validCoupons.length === 0 ? (
                            <div className="py-24 text-center">
                                <Ticket className="mx-auto mb-4 size-12 text-(--beheer-text-muted) opacity-10" />
                                <p className="text-sm font-semibold text-(--beheer-text-muted)">Geen coupons gevonden</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="border-b border-(--beheer-border) bg-(--beheer-card-soft)">
                                        <tr>
                                            <th className="px-8 py-5 text-xs font-semibold text-(--beheer-text-muted)">Code</th>
                                            <th className="px-8 py-5 text-xs font-semibold text-(--beheer-text-muted)">Korting</th>
                                            <th className="hidden px-8 py-5 text-xs font-semibold text-(--beheer-text-muted) sm:table-cell">Gebruik</th>
                                            <th className="hidden px-8 py-5 text-xs font-semibold text-(--beheer-text-muted) lg:table-cell">Geldigheid</th>
                                            <th className="px-8 py-5 text-center text-xs font-semibold text-(--beheer-text-muted)">Status</th>
                                            <th className="px-8 py-5 text-right text-xs font-semibold text-(--beheer-text-muted)">Acties</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-(--beheer-border)">
                                        {validCoupons.map(coupon => (
                                            <CouponRow
                                                key={coupon.id}
                                                coupon={coupon}
                                                onToggle={(c) => { void handleToggle(c); }}
                                                onDelete={(id) => { void handleDelete(id); }}
                                                isToggling={togglingId === coupon.id}
                                                isDeleting={deletingId === coupon.id}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-12 space-y-4">
                    <button
                        onClick={() => setShowExpired(!showExpired)}
                        className="group beheer-button flex cursor-pointer items-center gap-4 border-l-4 border-slate-500 py-1 pl-4 text-(--beheer-text-muted) transition-all hover:text-(--beheer-text)"
                    >
                        <h2 className="flex items-center gap-3 text-sm font-semibold">
                            {showExpired ? <ToggleRight className="size-5 text-(--beheer-accent)" /> : <ToggleLeft className="size-5" />}
                            Verlopen Coupons
                            <span className="rounded-full border border-slate-500/20 bg-slate-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                                {inactiveCoupons.length}
                            </span>
                        </h2>
                    </button>

                    {showExpired && (
                        <div className="overflow-hidden rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) opacity-80 shadow-lg transition-all">
                            {inactiveCoupons.length === 0 ? (
                                <div className="py-12 text-center text-xs font-semibold text-(--beheer-text-muted) italic">
                                    Niets gevonden
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <tbody className="divide-y divide-(--beheer-border)">
                                            {inactiveCoupons.map(coupon => (
                                                <CouponRow
                                                    key={coupon.id}
                                                    coupon={coupon}
                                                    onToggle={(c) => { void handleToggle(c); }}
                                                    onDelete={(id) => { void handleDelete(id); }}
                                                    isToggling={togglingId === coupon.id}
                                                    isDeleting={deletingId === coupon.id}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}