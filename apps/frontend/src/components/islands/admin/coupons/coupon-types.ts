export type Coupon = {
    id: number;
    coupon_code: string;
    discount_type: 'fixed' | 'percentage';
    discount_value: number;
    usage_count: number;
    usage_limit: number | null;
    valid_from: string | null;
    valid_until: string | null;
    is_active: boolean;
    isOptimistic?: boolean;
    date_created?: string;
};

export type CouponStatus = 'active' | 'expired' | 'maxed' | 'inactive' | 'pending';
