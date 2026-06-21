import 'server-only';
import { query } from '@/lib/database/db';
import { safeConsoleError } from '@/server/utils/logger';

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

        const result = await query<CouponData>(sql, [code.trim()]);
        const coupon = result.rows[0] as CouponData | undefined;

        if (!coupon) {
            return { valid: false, error: 'Coupon code niet gevonden' };
        }

        if (!coupon.is_active) {
            return { valid: false, error: 'Deze coupon is momenteel niet actief' };
        }

        const now = new Date();

        if (coupon.valid_from && new Date(coupon.valid_from) > now) {
            return { valid: false, error: 'Deze coupon is nog niet geldig' };
        }

        if (coupon.valid_until && new Date(coupon.valid_until) < now) {
            return { valid: false, error: 'Deze coupon is verlopen' };
        }

        if (coupon.usage_limit && (coupon.usage_count || 0) >= coupon.usage_limit) {
            return { valid: false, error: 'Deze coupon is al maximaal gebruikt' };
        }

        return {
            valid: true,
            coupon
        };
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[coupon.utils.ts][getValidCoupon] ', `Database error during validation: ${typedError.message}`);
        return { valid: false, error: 'Fout bij raadplegen van de database' };
    }
}

export async function claimCoupon(code: string): Promise<CouponValidationResult> {
    if (!code || typeof code !== 'string') {
        return { valid: false, error: 'Ongeldige coupon code' };
    }

    try {
        const sql = `
            UPDATE coupons 
            SET usage_count = usage_count + 1 
            WHERE UPPER(coupon_code) = UPPER($1)
              AND is_active = true
              AND (valid_from IS NULL OR valid_from <= NOW())
              AND (valid_until IS NULL OR valid_until >= NOW())
              AND (usage_limit IS NULL OR usage_count < usage_limit)
            RETURNING 
                id,
                discount_type, 
                discount_value, 
                usage_count, 
                usage_limit, 
                valid_from, 
                valid_until, 
                is_active
        `;

        const result = await query<CouponData>(sql, [code.trim()]);
        const coupon = result.rows[0] as CouponData | undefined;

        if (!coupon) {
            const checkResult = await getValidCoupon(code);
            return {
                valid: false,
                error: checkResult.error || 'Coupon kon niet worden geclaimd'
            };
        }

        return {
            valid: true,
            coupon
        };
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[coupon.utils.ts][claimCoupon] ', `Database error during coupon claiming: ${typedError.message}`);
        return { valid: false, error: 'Fout bij verwerken van coupon' };
    }
}

export async function releaseCoupon(code: string): Promise<void> {
    if (!code || typeof code !== 'string') return;
    try {
        const sql = `
            UPDATE coupons 
            SET usage_count = GREATEST(0, usage_count - 1)
            WHERE UPPER(coupon_code) = UPPER($1)
        `;
        await query(sql, [code.trim()]);
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[coupon.utils.ts][releaseCoupon] ', `Database error during coupon releasing: ${typedError.message}`);
    }
}