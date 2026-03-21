
export interface Coupon {
    valid: boolean;
    discount?: number;
    type?: string; // 'percentage' or 'fixed'
}

/**
 * Calculates the total price after applying a coupon.
 * Single source of truth for membership and event pricing.
 */
export function calculateDiscountedPrice(baseAmount: number, coupon?: Coupon | null): number {
    if (!coupon || !coupon.valid || !coupon.discount) {
        return baseAmount;
    }

    if (coupon.type === 'percentage') {
        const discounted = baseAmount * (1 - coupon.discount / 100);
        return Math.round(discounted * 100) / 100; // Round to 2 decimals
    }

    const discounted = Math.max(0, baseAmount - coupon.discount);
    return Math.round(discounted * 100) / 100;
}
