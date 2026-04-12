import { query } from '@/lib/database/db';

export interface CouponData {
    id: string;
    discount_type: 'fixed' | 'percentage';
    discount_value: number;
    usage_count: number;
    usage_limit: number | null;
    valid_from: string | null;
    valid_until: string | null;
    is_active: boolean;
}

export interface CouponValidationResult {
    valid: boolean;
    error?: string;
    coupon?: CouponData;
}

/**
 * Validates a coupon code against the database.
 * Performs all business logic checks (active, dates, usage limits).
 */
export async function getValidCoupon(code: string): Promise<CouponValidationResult> {
    if (!code || typeof code !== 'string') {
        return { valid: false, error: 'Ongeldige coupon code' };
    }

    try {
        const sql = `
            SELECT 
                id,
                discount_type, 
                discount_value, 
                usage_count, 
                usage_limit, 
                valid_from, 
                valid_until, 
                is_active
            FROM coupons
            WHERE UPPER(coupon_code) = UPPER($1)
            LIMIT 1
        `;

        const result = await query(sql, [code.trim()]);
        const coupon = result.rows[0];

        if (!coupon) {
            return { valid: false, error: 'Coupon niet gevonden' };
        }

        // 1. Manual Toggle Check
        if (!coupon.is_active) {
            return { valid: false, error: 'Deze coupon is momenteel niet actief' };
        }

        // 2. Date Validation Logic
        const now = new Date();
        
        if (coupon.valid_from && new Date(coupon.valid_from) > now) {
            return { valid: false, error: 'Deze coupon is nog niet geldig' };
        }

        if (coupon.valid_until && new Date(coupon.valid_until) < now) {
            return { valid: false, error: 'Deze coupon is verlopen' };
        }

        // 3. Usage Limit Check
        if (coupon.usage_limit !== null && (coupon.usage_count || 0) >= coupon.usage_limit) {
            return { valid: false, error: 'Deze coupon is al maximaal gebruikt' };
        }

        return {
            valid: true,
            coupon: {
                ...coupon,
                discount_value: Number(coupon.discount_value)
            }
        };
    } catch (error) {
        // Log internally, but return generic error
        return { valid: false, error: 'Fout bij raadplegen van de database' };
    }
}
