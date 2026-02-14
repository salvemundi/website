'use server';

import { fetchDirectus, mutateDirectus, buildQuery } from '@/shared/lib/server-directus';

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

/**
 * Fetch all coupons.
 */
export async function getAllCouponsAction() {
    try {
        const query = buildQuery({
            fields: '*',
            sort: '-id'
        });
        const list = await fetchDirectus<Coupon[]>(`/items/coupons?${query}`, 0);
        return list || [];
    } catch (error) {
        console.error('[CouponAction] getAllCouponsAction error:', error);
        return [];
    }
}

/**
 * Create a new coupon.
 */
export async function createCouponAction(payload: Partial<Coupon>) {
    try {
        const result = await mutateDirectus('/items/coupons', 'POST', payload);
        return { success: true, coupon: result };
    } catch (error: any) {
        console.error('[CouponAction] createCouponAction error:', error);
        return { success: false, error: error.message || 'Kon coupon niet aanmaken' };
    }
}

/**
 * Delete a coupon.
 */
export async function deleteCouponAction(id: number) {
    try {
        await mutateDirectus(`/items/coupons/${id}`, 'DELETE');
        return { success: true };
    } catch (error: any) {
        console.error(`[CouponAction] deleteCouponAction(${id}) error:`, error);
        return { success: false, error: error.message || 'Kon coupon niet verwijderen' };
    }
}

/**
 * Fetch a coupon by code.
 */
export async function getCouponByCodeAction(code: string) {
    try {
        const query = buildQuery({
            filter: { coupon_code: { _eq: code } },
            fields: '*'
        });
        const list = await fetchDirectus<Coupon[]>(`/items/coupons?${query}`, 0);
        return list && list.length > 0 ? list[0] : null;
    } catch (error) {
        console.error(`[CouponAction] getCouponByCodeAction(${code}) error:`, error);
        return null;
    }
}
