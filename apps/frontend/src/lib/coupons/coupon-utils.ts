import type { Coupon, CouponStatus } from '@/server/actions/admin-coupons.actions';

export function getComputedCouponStatus(coupon: Coupon): {
    type: CouponStatus;
    label: string;
    color: string;
    description: string;
} {
    const now = new Date();

    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        return { type: 'expired', label: 'Verlopen', color: 'bg-[var(--beheer-inactive)]/20 text-[var(--beheer-inactive)]', description: 'Coupon is verlopen' };
    }
    if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
        return { type: 'maxed', label: 'Limiet bereikt', color: 'bg-orange-500/20 text-orange-500', description: 'Gebruikslimiet bereikt' };
    }
    if (!coupon.is_active) {
        return { type: 'inactive', label: 'Inactief', color: 'bg-slate-500/20 text-slate-500', description: 'Coupon is handmatig uitgeschakeld' };
    }
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        return { type: 'pending', label: 'Nog niet actief', color: 'bg-amber-500/20 text-amber-500', description: 'Coupon is nog niet actief' };
    }
    return { type: 'active', label: 'Actief', color: 'bg-[var(--beheer-active)]/20 text-[var(--beheer-active)]', description: 'Coupon is actief' };
}
