import 'server-only';
import { db, schema } from '@salvemundi/db';
import { desc } from 'drizzle-orm';
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

export async function getCoupons(): Promise<Coupon[]> {
    await checkAccess();
    try {
        const items = await db.select().from(schema.coupons).orderBy(desc(schema.coupons.id));

        return items.map(i => ({
            id: Number(i.id),
            coupon_code: i.coupon_code || '',
            discount_type: i.discount_type as 'fixed' | 'percentage',
            discount_value: i.discount_value !== null ? Number(i.discount_value) : 0,
            usage_count: Number(i.usage_count),
            usage_limit: i.usage_limit !== null ? Number(i.usage_limit) : null,
            valid_from: i.valid_from ? new Date(i.valid_from).toISOString() : null,
            valid_until: i.valid_until ? new Date(i.valid_until).toISOString() : null,
            is_active: !!i.is_active,
            date_created: i.date_created ? new Date(i.date_created).toISOString() : undefined
        }));
    } catch (error) {
        safeConsoleError('[admin-coupon.queries.ts][getCoupons] error while fetching coupons:', error);
        throw error;
    }
}

export async function createCoupon(couponData: { coupon_code: string; discount_type: 'fixed' | 'percentage'; discount_value: number; usage_limit: number | null; valid_from: string | null; valid_until: string | null; is_active: boolean; }): Promise<Coupon> {
    try {
        await checkAccess();
        const inserted = await db.insert(schema.coupons).values({
            coupon_code: couponData.coupon_code,
            discount_type: couponData.discount_type,
            discount_value: couponData.discount_value,
            usage_limit: couponData.usage_limit,
            valid_from: couponData.valid_from,
            valid_until: couponData.valid_until,
            is_active: couponData.is_active
        }).returning();

        if (inserted.length === 0) throw new Error('Failed to insert coupon');
        const i = inserted[0];

        return {
            id: Number(i.id),
            coupon_code: i.coupon_code || '',
            discount_type: i.discount_type as 'fixed' | 'percentage',
            discount_value: i.discount_value !== null ? Number(i.discount_value) : 0,
            usage_count: Number(i.usage_count),
            usage_limit: i.usage_limit !== null ? Number(i.usage_limit) : null,
            valid_from: i.valid_from ? new Date(i.valid_from).toISOString() : null,
            valid_until: i.valid_until ? new Date(i.valid_until).toISOString() : null,
            is_active: !!i.is_active,
            date_created: i.date_created ? new Date(i.date_created).toISOString() : undefined
        };
    } catch (error) {
        safeConsoleError('[admin-coupon.queries.ts][createCoupon] error while creating coupon:', error);
        throw error;
    }
}