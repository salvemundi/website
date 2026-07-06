import 'server-only';
import { db, schema } from '@/lib/database/db';
import { eq, and, or, isNull, sql } from 'drizzle-orm';
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
        const rows = await db.select({
            id: schema.coupons.id,
            discount_type: schema.coupons.discount_type,
            discount_value: schema.coupons.discount_value,
            usage_count: schema.coupons.usage_count,
            usage_limit: schema.coupons.usage_limit,
            valid_from: schema.coupons.valid_from,
            valid_until: schema.coupons.valid_until,
            is_active: schema.coupons.is_active
        })
        .from(schema.coupons)
        .where(sql`UPPER(${schema.coupons.coupon_code}) = UPPER(${code.trim()})`)
        .limit(1);

        const coupon = rows[0] as unknown as CouponData | undefined;

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
        const rows = await db.update(schema.coupons)
            .set({ usage_count: sql`${schema.coupons.usage_count} + 1` })
            .where(
                and(
                    sql`UPPER(${schema.coupons.coupon_code}) = UPPER(${code.trim()})`,
                    eq(schema.coupons.is_active, true),
                    or(isNull(schema.coupons.valid_from), sql`${schema.coupons.valid_from} <= NOW()`),
                    or(isNull(schema.coupons.valid_until), sql`${schema.coupons.valid_until} >= NOW()`),
                    or(isNull(schema.coupons.usage_limit), sql`${schema.coupons.usage_count} < ${schema.coupons.usage_limit}`)
                )
            )
            .returning({
                id: schema.coupons.id,
                discount_type: schema.coupons.discount_type,
                discount_value: schema.coupons.discount_value,
                usage_count: schema.coupons.usage_count,
                usage_limit: schema.coupons.usage_limit,
                valid_from: schema.coupons.valid_from,
                valid_until: schema.coupons.valid_until,
                is_active: schema.coupons.is_active
            });

        const coupon = rows[0] as unknown as CouponData | undefined;

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
        await db.update(schema.coupons)
            .set({ usage_count: sql`GREATEST(0, ${schema.coupons.usage_count} - 1)` })
            .where(sql`UPPER(${schema.coupons.coupon_code}) = UPPER(${code.trim()})`);
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[coupon.utils.ts][releaseCoupon] ', `Database error during coupon releasing: ${typedError.message}`);
    }
}