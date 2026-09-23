'use client';

import { 
    Ticket, 
    Percent, 
    CheckCircle, 
    XCircle, 
    Trash, 
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
            "group border-b border-(--beheer-border) opacity-100 transition-colors last:border-0 hover:bg-(--beheer-card-soft)/50",
            coupon.isOptimistic && "pointer-events-none opacity-60"
        )}>
            {/* Code */}
            <td className="px-8 py-6 whitespace-nowrap">
                <div className="flex items-center gap-4">
                    <div className={`rounded-xl p-3 transition-colors ${isExpiredOrMaxed ? 'bg-(--beheer-card-soft) text-slate-400 opacity-50' : 'bg-(--beheer-accent)/10 text-(--beheer-accent) shadow-sm'}`}>
                        <Ticket className="size-4" />
                    </div>
                    <span className={`font-mono text-sm font-semibold tracking-tight ${isExpiredOrMaxed ? 'text-(--beheer-text-muted) opacity-60' : 'text-(--beheer-text)'}`}>
                        {coupon.coupon_code}
                    </span>
                </div>
            </td>

            {/* Discount */}
            <td className="px-8 py-6 whitespace-nowrap">
                <div className={`flex items-center gap-2 text-sm font-semibold ${isExpiredOrMaxed ? 'text-(--beheer-text-muted) opacity-50' : 'text-(--beheer-accent)'}`}>
                    {coupon.discount_type === 'percentage' ? (
                        <><Percent className="size-3.5" />{coupon.discount_value}%</>
                    ) : (
                        formatCurrency(coupon.discount_value)
                    )}
                </div>
            </td>

            {/* Usage */}
            <td className="hidden px-8 py-6 whitespace-nowrap sm:table-cell">
                <div className={`flex flex-col gap-2.5 ${isExpiredOrMaxed ? 'opacity-40' : ''}`}>
                    <span className="text-xs font-semibold text-(--beheer-text)">
                        {coupon.usage_count} <span className="text-(--beheer-text-muted)">/ {coupon.usage_limit ?? '∞'}</span>
                    </span>
                    {coupon.usage_limit !== null && (
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-(--beheer-border) shadow-inner">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${isExpiredOrMaxed ? 'bg-slate-500' : 'bg-(--beheer-accent)'}`}
                                style={{ width: `${Math.min((coupon.usage_count / coupon.usage_limit) * 100, 100)}%` }}
                            />
                        </div>
                    )}
                </div>
            </td>

            {/* Validity */}
            <td className="hidden px-8 py-6 whitespace-nowrap lg:table-cell">
                <div className="flex flex-col gap-1.5 text-xs font-semibold text-(--beheer-text-muted)">
                    {coupon.valid_from && (
                        <span className="flex items-center gap-2 opacity-70"><div className="size-1 rounded-full bg-emerald-500" /> Van: {formatDate(coupon.valid_from)}</span>
                    )}
                    {coupon.valid_until ? (
                        <span className={`flex items-center gap-2 ${status.type === 'expired' ? 'text-red-500' : 'opacity-70'}`}>
                            <div className={`size-1 rounded-full ${status.type === 'expired' ? 'bg-red-500' : 'bg-amber-500'}`} /> Tot: {formatDate(coupon.valid_until)}
                        </span>
                    ) : (
                        <span className="flex items-center gap-2 italic opacity-30"><div className="size-1 rounded-full bg-(--beheer-border)" /> Geen limiet</span>
                    )}
                </div>
            </td>

            {/* Status */}
            <td className="px-8 py-6 text-center whitespace-nowrap">
                <span className={`inline-flex transform items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition-transform group-hover:scale-105 ${status.color}`} title={status.description}>
                    {(status.type === 'active' || status.type === 'pending')
                        ? <CheckCircle className="size-3" />
                        : <XCircle className="size-3" />}
                    {status.label}
                </span>
            </td>

            {/* Actions */}
            <td className="px-8 py-6 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1 opacity-20 transition-all group-hover:opacity-100">
                    {coupon.isOptimistic ? (
                        <div className="p-3">
                            <Loader2 className="size-5 animate-spin text-(--beheer-accent)" />
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => onToggle(coupon)}
                                disabled={isToggling}
                                title={coupon.is_active ? 'Deactiveren' : 'Activeren'}
                                className={`icon-button cursor-pointer rounded-xl p-3 transition-all ${coupon.is_active ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-slate-400 hover:bg-slate-500/10'}`}
                            >
                                {isToggling
                                    ? <Loader2 className="size-5 animate-spin" />
                                    : coupon.is_active
                                        ? <ToggleRight className="size-6" />
                                        : <ToggleLeft className="size-6" />}
                            </button>
                            <button
                                onClick={() => onDelete(coupon.id)}
                                disabled={isDeleting}
                                title="Verwijderen"
                                className="icon-button cursor-pointer rounded-xl p-3 text-(--beheer-text-muted) transition-all hover:bg-red-500/10 hover:text-red-500"
                            >
                                {isDeleting ? <Loader2 className="size-5 animate-spin" /> : <Trash className="size-5" />}
                            </button>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
}
