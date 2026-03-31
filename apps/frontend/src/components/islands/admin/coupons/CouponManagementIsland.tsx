'use client';

import { 
    useState, useTransition, useMemo 
} from 'react';
import {
    Ticket, Plus, CheckCircle, X, Clock, ToggleLeft, ToggleRight
} from 'lucide-react';
import type { Coupon } from '@/server/actions/admin-coupons.actions';
import { getComputedCouponStatus } from '@/lib/coupon-utils';
import { createCoupon, deleteCoupon, toggleCouponActive, getCoupons } from '@/server/actions/admin-coupons.actions';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';

import CouponRow from './CouponRow';
import CouponForm from './CouponForm';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

interface Props {
    initialCoupons: Coupon[];
}

export default function CouponManagementIsland({ initialCoupons }: Props) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
    const [showForm, setShowForm] = useState(false);
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
            // Only 'active' and 'pending' are shown in the top section
            if (status.type === 'active' || status.type === 'pending') {
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

        startTransition(async () => {
            const res = await createCoupon(formData);
            if (!res.success) {
                setFormError(res.error ?? 'Aanmaken mislukt');
                return;
            }
            const fresh = await getCoupons();
            setCoupons(fresh);
            setShowForm(false);
        });
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Weet je zeker dat je deze coupon wilt verwijderen?')) return;
        setDeletingId(id);
        const res = await deleteCoupon(id);
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
        { label: 'Totaal', value: coupons.length, icon: Ticket, trend: 'Coupons' },
        { label: 'Nu Actief', value: coupons.filter(c => getComputedCouponStatus(c).type === 'active').length, icon: CheckCircle, trend: 'Valid' },
        { label: 'Verlopen', value: coupons.filter(c => getComputedCouponStatus(c).type === 'expired').length, icon: Clock, trend: 'Action' },
        { label: 'Gebruikt', value: coupons.reduce((sum, c) => sum + (c.usage_count || 0), 0), icon: Ticket, trend: 'Usage' },
    ];

    return (
        <>
            <AdminToolbar 
                title="Coupons Beheer"
                subtitle="Beheer kortingscodes en acties voor het lidmaatschap"
                backHref="/beheer"
                actions={
                    <button
                        onClick={() => { setShowForm(!showForm); setFormError(null); }}
                        className={`flex items-center justify-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] rounded-[var(--beheer-radius)] font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 cursor-pointer ${
                            showForm 
                            ? 'bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text-muted)] hover:border-[var(--beheer-accent)]/50' 
                            : 'bg-[var(--beheer-accent)] text-white shadow-[var(--shadow-glow)] hover:opacity-90'
                        }`}
                    >
                        {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {showForm ? 'Annuleren' : 'Nieuwe Coupon'}
                    </button>
                }
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <AdminStatsBar stats={adminStats} />

                {showForm && (
                    <CouponForm 
                        onSave={handleCreate}
                        onCancel={() => setShowForm(false)}
                        isPending={isPending}
                        error={formError}
                    />
                )}

                {/* Main Table */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-l-4 border-[var(--beheer-active)] pl-4 py-1">
                        <h2 className="text-[10px] font-black text-[var(--beheer-text)] flex items-center gap-3 uppercase tracking-widest">
                            Geldige Coupons
                            <span className="px-3 py-1 rounded-full bg-[var(--beheer-active)]/20 text-[var(--beheer-active)] text-[9px] shadow-sm border border-[var(--beheer-active)]/20">
                                {validCoupons.length}
                            </span>
                        </h2>
                    </div>

                    <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] overflow-hidden shadow-xl transition-all">
                        {validCoupons.length === 0 ? (
                            <div className="py-24 text-center">
                                <Ticket className="h-12 w-12 text-[var(--beheer-text-muted)] mx-auto mb-4 opacity-10" />
                                <p className="font-black uppercase tracking-widest text-[10px] text-[var(--beheer-text-muted)]">Geen geldige coupons gevonden</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-[var(--beheer-card-soft)] border-b border-[var(--beheer-border)]">
                                        <tr>
                                            <th className="px-8 py-5 text-[9px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Code</th>
                                            <th className="px-8 py-5 text-[9px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Korting</th>
                                            <th className="px-8 py-5 text-[9px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest hidden sm:table-cell">Gebruik</th>
                                            <th className="px-8 py-5 text-[9px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest hidden lg:table-cell">Geldigheid</th>
                                            <th className="px-8 py-5 text-center text-[9px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Status</th>
                                            <th className="px-8 py-5 text-right text-[9px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Acties</th>
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
                        <h2 className="text-[10px] font-black flex items-center gap-3 uppercase tracking-widest">
                            {showExpired ? <ToggleRight className="h-5 w-5 text-[var(--beheer-accent)]" /> : <ToggleLeft className="h-5 w-5" />}
                            Inactief of Verlopen
                            <span className="px-3 py-1 rounded-full bg-slate-500/20 text-slate-500 text-[9px] border border-slate-500/20">
                                {inactiveCoupons.length}
                            </span>
                        </h2>
                    </button>

                    {showExpired && (
                        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] overflow-hidden opacity-80 shadow-lg transition-all animate-in fade-in slide-in-from-top-4">
                            {inactiveCoupons.length === 0 ? (
                                <div className="py-12 text-center text-[var(--beheer-text-muted)] italic opacity-40 font-bold uppercase tracking-widest text-[9px]">
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
