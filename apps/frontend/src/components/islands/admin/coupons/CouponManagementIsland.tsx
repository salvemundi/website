'use client';

import { 
    useState, useTransition, useMemo 
} from 'react';
import {
    Ticket, Plus, CheckCircle, X, Clock, ToggleLeft, ToggleRight
} from 'lucide-react';
import { type Coupon } from './coupon-types';
import { getComputedCouponStatus } from '@/lib/coupons';
import { createCoupon, deleteCoupon, toggleCouponActive, getCoupons } from '@/server/actions/admin-coupons.actions';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';
import AdminModal from '@/components/ui/admin/AdminModal';
import CouponRow from './CouponRow';
import CouponForm from './CouponForm';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { cn } from '@/lib/utils/cn';
interface Props {
    initialCoupons?: Coupon[];
}

export default function CouponManagementIsland({ 
    initialCoupons = [], 
}: Props) {
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
            // Non-expired coupons (active, pending, inactive, maxed) go in the top section
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

        // Optimistic values
        const code = (formData.get('coupon_code') as string || '').toUpperCase();
        const value = Number(formData.get('discount_value'));
        const isActive = formData.get('is_active') === 'on';
        
        // 1. Optimistic Update
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
            isOptimistic: true // Custom flag for UI
        };

        setCoupons(prev => [tempCoupon, ...prev]);
        setIsAdding(false);

        startTransition(async () => {
            const res = await createCoupon(formData) as any;
            
            if (!res.success) {
                setFormError(res.error ?? 'Aanmaken mislukt');
                // Rollback
                setCoupons(prev => prev.filter(c => c.id !== tempId));
                setIsAdding(true); // Open modal again
                return;
            }

            // 2. Replace optimistic with real data
            if (res.data) {
                setCoupons(prev => prev.map(c => c.id === tempId ? res.data : c));
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
            <div className={`container mx-auto px-4 py-8 max-w-7xl`}>
                
                <AdminModal
                    isOpen={isAdding}
                    onClose={() => setIsAdding(false)}
                    title="Nieuwe Coupon Aanmaken"
                    subtitle="Voeg een nieuwe kortingscode toe aan het systeem"
                    maxWidth="3xl"
                >
                    <CouponForm 
                        onSave={handleCreate}
                        onCancel={() => setIsAdding(false)}
                        isPending={isPending}
                        error={formError}
                    />
                </AdminModal>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-[var(--beheer-text)] tracking-tight flex items-center gap-3">
                            <div className="p-2.5 bg-[var(--beheer-accent)]/10 rounded-xl text-[var(--beheer-accent)]">
                                <Ticket className="h-6 w-6" />
                            </div>
                            Coupon Beheer
                        </h2>
                        <p className="text-xs font-semibold text-[var(--beheer-text-muted)] tracking-widest uppercase opacity-60 ml-14">
                            Beheer kortingscodes en acties
                        </p>
                    </div>
                    
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-[var(--beheer-accent)] text-white font-semibold text-sm rounded-xl shadow-lg hover:opacity-90 transition-all active:scale-95 border border-white/10 group self-start sm:self-center"
                    >
                        <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                        <span>Nieuwe Coupon</span>
                    </button>
                </div>

                <AdminStatsBar stats={adminStats} />

                {/* Main Table */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-l-4 border-[var(--beheer-active)] pl-4 py-1">
                        <h2 className="text-sm font-semibold text-[var(--beheer-text)] flex items-center gap-3">
                            Coupons
                            <span className="px-2.5 py-0.5 rounded-full bg-[var(--beheer-active)]/10 text-[var(--beheer-active)] text-xs font-bold border border-[var(--beheer-active)]/20">
                                {validCoupons.length}
                            </span>
                        </h2>
                    </div>

                    <div 
                        className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] overflow-hidden shadow-xl transition-all"
                    >
                        {validCoupons.length === 0 ? (
                            <div className="py-24 text-center">
                                <Ticket className="h-12 w-12 text-[var(--beheer-text-muted)] mx-auto mb-4 opacity-10" />
                                <p className="font-semibold text-sm text-[var(--beheer-text-muted)]">Geen coupons gevonden</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-[var(--beheer-card-soft)] border-b border-[var(--beheer-border)]">
                                        <tr>
                                            <th className="px-8 py-5 text-xs font-semibold text-[var(--beheer-text-muted)] uppercase tracking-wider">Code</th>
                                            <th className="px-8 py-5 text-xs font-semibold text-[var(--beheer-text-muted)] uppercase tracking-wider">Korting</th>
                                            <th className="px-8 py-5 text-xs font-semibold text-[var(--beheer-text-muted)] uppercase tracking-wider hidden sm:table-cell">Gebruik</th>
                                            <th className="px-8 py-5 text-xs font-semibold text-[var(--beheer-text-muted)] uppercase tracking-wider hidden lg:table-cell">Geldigheid</th>
                                            <th className="px-8 py-5 text-center text-xs font-semibold text-[var(--beheer-text-muted)] uppercase tracking-wider">Status</th>
                                            <th className="px-8 py-5 text-right text-xs font-semibold text-[var(--beheer-text-muted)] uppercase tracking-wider">Acties</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--beheer-border)]">
                                        {validCoupons.map(coupon => (
                                            <CouponRow 
                                                key={coupon.id} 
                                                coupon={coupon} 
                                                onToggle={handleToggle} 
                                                onDelete={handleDelete}
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

                {/* Collapsible Section for Expired/Inactive */}
                <div className="mt-12 space-y-4">
                    <button 
                        onClick={() => setShowExpired(!showExpired)}
                        className="flex items-center gap-4 text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] transition-all group cursor-pointer border-l-4 border-slate-500 pl-4 py-1"
                    >
                        <h2 className="text-sm font-semibold flex items-center gap-3">
                            {showExpired ? <ToggleRight className="h-5 w-5 text-[var(--beheer-accent)]" /> : <ToggleLeft className="h-5 w-5" />}
                            Verlopen Coupons
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-500/10 text-slate-500 text-xs font-bold border border-slate-500/20">
                                {inactiveCoupons.length}
                            </span>
                        </h2>
                    </button>

                    {showExpired && (
                        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] overflow-hidden opacity-80 shadow-lg transition-all animate-in fade-in slide-in-from-top-4">
                            {inactiveCoupons.length === 0 ? (
                                <div className="py-12 text-center text-[var(--beheer-text-muted)] italic text-xs font-semibold">
                                    Niets gevonden
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <tbody className="divide-y divide-[var(--beheer-border)]">
                                            {inactiveCoupons.map(coupon => (
                                                <CouponRow 
                                                    key={coupon.id} 
                                                    coupon={coupon} 
                                                    onToggle={handleToggle} 
                                                    onDelete={handleDelete}
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
