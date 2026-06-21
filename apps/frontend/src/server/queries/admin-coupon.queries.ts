import 'server-only';
import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { COUPON_FIELDS } from '@salvemundi/validations/directus/fields';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { AdminResource } from '@/shared/lib/permissions-config';
import { hasPermission } from '@/shared/lib/permissions';

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
    date_created?: string;
};

import { type EnrichedUser } from '@/types/auth';
import { safeConsoleError } from '../utils/logger';

async function checkAccess() {
    const session = await getEnrichedSession();
    if (!session?.user) throw new Error('Niet ingelogd');

    const user = session.user as unknown as EnrichedUser;
    if (!hasPermission(user.committees, AdminResource.Coupons)) {
        throw new Error('Geen toegang: onvoldoende rechten voor coupon beheer');
    }

    return session;
}

interface CouponRow {
    id: string | number;
    coupon_code?: unknown;
    discount_type?: unknown;
    discount_value?: unknown;
    usage_count?: unknown;
    usage_limit?: unknown;
    valid_from?: unknown;
    valid_until?: unknown;
    is_active?: unknown;
    date_created?: unknown;
}

export async function getCoupons(): Promise<Coupon[]> {
    await checkAccess();
    try {
        const items = await getSystemDirectus().request(readItems('coupons', {
            sort: ['-id'],
            limit: -1,
            fields: [...COUPON_FIELDS]
        }));

        return (items as unknown as CouponRow[]).map(i => ({
            id: Number(i.id),
            coupon_code: typeof i.coupon_code === 'string' ? i.coupon_code : '',
            discount_type: (typeof i.discount_type === 'string' ? i.discount_type : 'percentage') as 'fixed' | 'percentage',
            discount_value: i.discount_value !== null && i.discount_value !== undefined ? Number(i.discount_value) : 0,
            usage_count: i.usage_count !== null && i.usage_count !== undefined ? Number(i.usage_count) : 0,
            usage_limit: i.usage_limit !== null && i.usage_limit !== undefined ? Number(i.usage_limit) : null,
            valid_from: typeof i.valid_from === 'string' ? i.valid_from : null,
            valid_until: typeof i.valid_until === 'string' ? i.valid_until : null,
            is_active: !!i.is_active,
            date_created: typeof i.date_created === 'string' ? i.date_created : undefined
        }));
    } catch (error) {
        safeConsoleError('[admin-coupon.queries][getCoupons] error while fetching coupons:', error);
        throw error;
    }
}

export async function createCoupon(couponData: { coupon_code: string; discount_type: 'fixed' | 'percentage'; discount_value: number; usage_limit: number | null; valid_from: string | null; valid_until: string | null; is_active: boolean; }): Promise<Coupon> {
    try {
        await checkAccess();
        const { createItem } = await import('@directus/sdk');
        const item = await getSystemDirectus().request(createItem('coupons', couponData));

        const i = item as unknown as CouponRow;

        return {
            id: Number(i.id),
            coupon_code: typeof i.coupon_code === 'string' ? i.coupon_code : '',
            discount_type: (typeof i.discount_type === 'string' ? i.discount_type : 'percentage') as 'fixed' | 'percentage',
            discount_value: i.discount_value !== null && i.discount_value !== undefined ? Number(i.discount_value) : 0,
            usage_count: i.usage_count !== null && i.usage_count !== undefined ? Number(i.usage_count) : 0,
            usage_limit: i.usage_limit !== null && i.usage_limit !== undefined ? Number(i.usage_limit) : null,
            valid_from: typeof i.valid_from === 'string' ? i.valid_from : null,
            valid_until: typeof i.valid_until === 'string' ? i.valid_until : null,
            is_active: !!i.is_active,
            date_created: typeof i.date_created === 'string' ? i.date_created : undefined
        };
    } catch (error) {
        safeConsoleError('[admin-coupon.queries][createCoupon] error while creating coupon:', error);
        throw error;
    }
}