'use client';

import React from 'react';
import { 
    Ticket, 
    Percent, 
    CheckCircle, 
    XCircle, 
    Trash2, 
    Loader2, 
    ToggleLeft, 
    ToggleRight 
} from 'lucide-react';
import { type Coupon } from './coupon-types';
import { getComputedCouponStatus } from '@/lib/coupons';
import { formatDate } from '@/shared/lib/utils/date';
import { cn } from '@/lib/utils/cn';

interface Props {
    coupon: Coupon;
    onToggle: (c: Coupon) => void;
    onDelete: (id: number) => void;
    isToggling: boolean;
    isDeleting: boolean;
}

export default function CouponRow({ 
    coupon, 
    onToggle, 
    onDelete, 
    isToggling, 
    isDeleting 
}: Props) {
    const status = getComputedCouponStatus(coupon);
    const isExpiredOrMaxed = status.type === 'expired' || status.type === 'maxed' || status.type === 'inactive';
    
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(val);

    return (
        <tr className={cn(
            "hover:bg-[var(--beheer-card-soft)]/50 transition-colors border-b border-[var(--beheer-border)] last:border-0 opacity-100 group",
            coupon.isOptimistic && "animate-pulse opacity-60 pointer-events-none"
        )}>
            {/* Code */}
            <td className="px-8 py-6 whitespace-nowrap">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${isExpiredOrMaxed ? 'bg-[var(--beheer-card-soft)] text-slate-400 opacity-50' : 'bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] shadow-sm'}`}>
                        <Ticket className="h-4 w-4" />
                    </div>
                    <span className={`font-semibold font-mono text-sm tracking-tight ${isExpiredOrMaxed ? 'text-[var(--beheer-text-muted)] opacity-60' : 'text-[var(--beheer-text)]'}`}>
                        {coupon.coupon_code}
                    </span>
                </div>
            </td>

            {/* Discount */}
            <td className="px-8 py-6 whitespace-nowrap">
                <div className={`flex items-center gap-2 font-semibold text-sm ${isExpiredOrMaxed ? 'text-[var(--beheer-text-muted)] opacity-50' : 'text-[var(--beheer-accent)]'}`}>
                    {coupon.discount_type === 'percentage' ? (
                        <><Percent className="h-3.5 w-3.5" />{coupon.discount_value}%</>
                    ) : (
                        formatCurrency(coupon.discount_value)
                    )}
                </div>
            </td>

            {/* Usage */}
            <td className="px-8 py-6 whitespace-nowrap hidden sm:table-cell">
                <div className={`flex flex-col gap-2.5 ${isExpiredOrMaxed ? 'opacity-40' : ''}`}>
                    <span className="font-semibold text-xs text-[var(--beheer-text)]">
                        {coupon.usage_count} <span className="text-[var(--beheer-text-muted)]">/ {coupon.usage_limit ?? '∞'}</span>
                    </span>
                    {coupon.usage_limit !== null && (
                        <div className="w-24 h-1.5 bg-[var(--beheer-border)] rounded-full overflow-hidden shadow-inner">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${isExpiredOrMaxed ? 'bg-slate-500' : 'bg-[var(--beheer-accent)]'}`}
                                style={{ width: `${Math.min((coupon.usage_count / coupon.usage_limit) * 100, 100)}%` }}
                            />
                        </div>
                    )}
                </div>
            </td>

            {/* Validity */}
            <td className="px-8 py-6 whitespace-nowrap hidden lg:table-cell">
                <div className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--beheer-text-muted)]">
                    {coupon.valid_from && (
                        <span className="flex items-center gap-2 opacity-70"><div className="w-1 h-1 rounded-full bg-emerald-500" /> Van: {formatDate(coupon.valid_from)}</span>
                    )}
                    {coupon.valid_until ? (
                        <span className={`flex items-center gap-2 ${status.type === 'expired' ? 'text-red-500' : 'opacity-70'}`}>
                            <div className={`w-1 h-1 rounded-full ${status.type === 'expired' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} /> Tot: {formatDate(coupon.valid_until)}
                        </span>
                    ) : (
                        <span className="flex items-center gap-2 opacity-30 italic"><div className="w-1 h-1 rounded-full bg-[var(--beheer-border)]" /> Geen limiet</span>
                    )}
                </div>
            </td>

            {/* Status */}
            <td className="px-8 py-6 whitespace-nowrap text-center">
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transform transition-transform group-hover:scale-105 ${status.color}`} title={status.description}>
                    {(status.type === 'active' || status.type === 'pending')
                        ? <CheckCircle className="h-3 w-3" />
                        : <XCircle className="h-3 w-3" />}
                    {status.label}
                </span>
            </td>

            {/* Actions */}
            <td className="px-8 py-6 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-1 opacity-20 group-hover:opacity-100 transition-all">
                    {coupon.isOptimistic ? (
                        <div className="p-3">
                            <Loader2 className="h-5 w-5 animate-spin text-[var(--beheer-accent)]" />
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => onToggle(coupon)}
                                disabled={isToggling}
                                title={coupon.is_active ? 'Deactiveren' : 'Activeren'}
                                className={`p-3 rounded-xl transition-all cursor-pointer ${coupon.is_active ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-slate-400 hover:bg-slate-500/10'}`}
                            >
                                {isToggling
                                    ? <Loader2 className="h-5 w-5 animate-spin" />
                                    : coupon.is_active
                                        ? <ToggleRight className="h-6 w-6" />
                                        : <ToggleLeft className="h-6 w-6" />}
                            </button>
                            <button
                                onClick={() => onDelete(coupon.id)}
                                disabled={isDeleting}
                                title="Verwijderen"
                                className="p-3 text-[var(--beheer-text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                            >
                                {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                            </button>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
}
