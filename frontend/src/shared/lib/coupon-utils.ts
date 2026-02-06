export type CouponStatus = 'active' | 'expired' | 'pending' | 'sold_out' | 'inactive';

export interface Coupon {
    id: number;
    coupon_code: string;
    discount_type: 'fixed' | 'percentage';
    discount_value: number;
    usage_limit: number | null;
    usage_count: number;
    valid_from: string | null;
    valid_until: string | null;
    is_active: boolean;
}

export interface ComputedStatus {
    type: CouponStatus;
    label: string;
    color: string;
    description: string;
}

export function getComputedCouponStatus(coupon: Coupon): ComputedStatus {
    const now = new Date();

    if (!coupon.is_active) {
        return {
            type: 'inactive',
            label: 'Gedeactiveerd',
            color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            description: 'Deze coupon is handmatig uitgeschakeld.'
        };
    }

    if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
        return {
            type: 'sold_out',
            label: 'Limiet bereikt',
            color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
            description: 'Het maximaal aantal gebruiken voor deze coupon is bereikt.'
        };
    }

    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        return {
            type: 'expired',
            label: 'Verlopen',
            color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
            description: 'De geldigheidsduur van deze coupon is verstreken.'
        };
    }

    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        return {
            type: 'pending',
            label: 'In afwachting',
            color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            description: 'Deze coupon is nog niet geldig (startdatum in de toekomst).'
        };
    }

    return {
        type: 'active',
        label: 'Actief',
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        description: 'Deze coupon is actief en kan worden gebruikt.'
    };
}
