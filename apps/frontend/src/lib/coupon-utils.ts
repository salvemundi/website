import type { Coupon, CouponStatus } from '@/server/actions/admin-coupons.actions';

export function getComputedCouponStatus(coupon: Coupon): {
    type: CouponStatus;
    label: string;
    color: string;
    description: string;
} {
    const now = new Date();

    if (!coupon.is_active) {
        return { type: 'inactive', label: 'Inactief', color: 'bg-gray-100 text-gray-600', description: 'Coupon is handmatig uitgeschakeld' };
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        return { type: 'expired', label: 'Verlopen', color: 'bg-red-100 text-red-600', description: 'Coupon is verlopen' };
    }
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        return { type: 'pending', label: 'Nog niet actief', color: 'bg-yellow-100 text-yellow-700', description: 'Coupon is nog niet actief' };
    }
    if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
        return { type: 'maxed', label: 'Limiet bereikt', color: 'bg-orange-100 text-orange-600', description: 'Gebruikslimiet bereikt' };
    }
    return { type: 'active', label: 'Actief', color: 'bg-green-100 text-green-700', description: 'Coupon is actief' };
}
