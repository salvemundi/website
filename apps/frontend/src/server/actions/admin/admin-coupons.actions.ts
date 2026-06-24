'use server';

import { revalidatePath } from 'next/cache';

import { db, schema } from '@salvemundi/db';
import { eq } from 'drizzle-orm';
import { AdminResource } from '@/shared/lib/permissions-config';
import { hasPermission } from '@/shared/lib/permissions';
import { type EnrichedUser } from '@/types/auth';
import { getEnrichedSession } from '@/server/auth/auth-utils';

async function checkAccess() {
    const session = await getEnrichedSession();
    if (!session?.user) throw new Error('Niet ingelogd');

    const user = session.user as unknown as EnrichedUser;
    if (!hasPermission(user.committees, AdminResource.Coupons)) {
        throw new Error('Geen toegang: onvoldoende rechten voor coupon beheer');
    }

    return session;
}

import { type Coupon } from '@/components/islands/admin/coupons/coupon-types';
import { safeConsoleError } from '@/server/utils/logger';

export async function createCoupon(formData: FormData): Promise<{ success: boolean; data?: Coupon; error?: string; fieldErrors?: Record<string, string[]> }> {
    await checkAccess();

    const code = formData.get('coupon_code') as string;
    const discountType = formData.get('discount_type') as string;
    const discountValueRaw = formData.get('discount_value') as string;
    const usageLimitRaw = formData.get('usage_limit') as string;
    const validFrom = formData.get('valid_from') as string;
    const validUntil = formData.get('valid_until') as string;
    const isActive = formData.get('is_active') === 'on';

    if (!code || !discountValueRaw) {
        return { success: false, error: 'Coupon code en waarde zijn verplicht' };
    }

    const discountValue = parseFloat(discountValueRaw.replace(',', '.'));
    if (isNaN(discountValue) || discountValue <= 0) {
        return { success: false, error: 'Ongeldige kortingswaarde: moet een positief getal zijn' };
    }

    if (discountType === 'percentage' && (discountValue > 100 || discountValue <= 0)) {
        return { success: false, error: 'Percentage moet tussen 0.01% en 100% liggen' };
    }

    let usageLimit: number | null = null;
    if (usageLimitRaw) {
        usageLimit = parseInt(usageLimitRaw);
        if (isNaN(usageLimit) || usageLimit < 1) {
            return { success: false, error: 'Gebruikslimiet moet minimaal 1 zijn (of leeg voor onbeperkt)' };
        }
    }

    try {
        const inserted = await db.insert(schema.coupons).values({
            coupon_code: code.trim().toUpperCase(),
            discount_type: discountType,
            discount_value: discountValue,
            is_active: isActive,
            usage_count: 0,
            usage_limit: usageLimit,
            valid_from: validFrom || null,
            valid_until: validUntil || null
        }).returning();

        if (inserted.length === 0) throw new Error('Insert returned no data');
        const item = inserted[0];

        revalidatePath('/beheer/coupons');

        const newCoupon: Coupon = {
            ...item,
            id: Number(item.id),
            coupon_code: item.coupon_code || '',
            discount_type: (item.discount_type || 'percentage') as 'fixed' | 'percentage',
            discount_value: Number(item.discount_value),
            usage_count: Number(item.usage_count),
            usage_limit: item.usage_limit ? Number(item.usage_limit) : null,
            valid_from: item.valid_from ? new Date(item.valid_from).toISOString() : null,
            valid_until: item.valid_until ? new Date(item.valid_until).toISOString() : null,
            is_active: !!item.is_active,
            date_created: item.date_created ? new Date(item.date_created).toISOString() : undefined
        };

        return { success: true, data: newCoupon };
    } catch (error) {
        safeConsoleError(`[admin-coupons.actions.ts][createCoupon] Failed to create coupon`, error);
        return { success: false, error: 'Aanmaken mislukt (controleer op unieke code of velden)' };
    }
}

export async function deleteCoupon(id: number): Promise<{ success: boolean; error?: string }> {
    await checkAccess();
    try {
        await db.delete(schema.coupons).where(eq(schema.coupons.id, id));
        revalidatePath('/beheer/coupons');
        return { success: true };
    } catch (error) {
        safeConsoleError(`[admin-coupons.actions.ts][deleteCoupon] Failed to delete coupon`, error);
        return { success: false, error: 'Verwijderen mislukt (wordt mogelijk nog gebruikt)' };
    }
}

export async function toggleCouponActive(id: number, currentActive: boolean): Promise<{ success: boolean; error?: string }> {
    await checkAccess();
    try {
        await db.update(schema.coupons).set({ is_active: !currentActive }).where(eq(schema.coupons.id, id));
        revalidatePath('/beheer/coupons');
        return { success: true };
    } catch (error) {
        safeConsoleError(`[admin-coupons.actions.ts][toggleCouponActive] Failed to toggle coupon`, error);
        return { success: false, error: 'Bijwerken mislukt' };
    }
}


