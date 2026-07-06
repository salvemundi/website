'use server';

import { revalidatePath } from 'next/cache';
import { db, schema } from '@salvemundi/db';
import { eq } from 'drizzle-orm';
import { type Coupon } from '@/components/islands/admin/coupons/coupon-types';
import { safeConsoleError } from '@/server/utils/logger';
import { z } from 'zod';

const couponFormSchema = z.object({
    coupon_code: z.string().min(1, 'Coupon code is verplicht').transform(val => val.trim().toUpperCase()),
    discount_type: z.enum(['fixed', 'percentage']),
    discount_value: z.preprocess(
        (val) => typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val,
        z.number().positive('Ongeldige kortingswaarde: moet een positief getal zijn')
    ),
    usage_limit: z.preprocess(
        (val) => (val === '' || val === null || val === undefined) ? null : Number(val),
        z.number().min(1, 'Gebruikslimiet moet minimaal 1 zijn').nullable()
    ),
    valid_from: z.string().nullable().transform(val => val || null),
    valid_until: z.string().nullable().transform(val => val || null),
    is_active: z.preprocess((val) => val === 'on' || val === true, z.boolean())
}).refine(data => {
    if (data.discount_type === 'percentage' && data.discount_value > 100) {
        return false;
    }
    return true;
}, {
    message: 'Percentage moet tussen 0.01% en 100% liggen',
    path: ['discount_value']
});

import { enforceFeatureAccess } from '@/server/actions/admin/admin-utils.actions';

async function checkAccess() {
    return enforceFeatureAccess('coupons');
}

export async function createCoupon(formData: FormData): Promise<{ success: boolean; data?: Coupon; error?: string; fieldErrors?: Record<string, string[]> }> {
    await checkAccess();

    const rawData = {
        coupon_code: formData.get('coupon_code'),
        discount_type: formData.get('discount_type'),
        discount_value: formData.get('discount_value'),
        usage_limit: formData.get('usage_limit'),
        valid_from: formData.get('valid_from'),
        valid_until: formData.get('valid_until'),
        is_active: formData.get('is_active')
    };

    const validated = couponFormSchema.safeParse(rawData);

    if (!validated.success) {
        const errors = validated.error.flatten();
        return { 
            success: false, 
            error: errors.formErrors[0] || 'Validatie mislukt',
            fieldErrors: errors.fieldErrors 
        };
    }

    const data = validated.data;

    try {
        const inserted = await db.insert(schema.coupons).values({
            coupon_code: data.coupon_code,
            discount_type: data.discount_type,
            discount_value: data.discount_value,
            is_active: data.is_active,
            usage_count: 0,
            usage_limit: data.usage_limit,
            valid_from: data.valid_from,
            valid_until: data.valid_until
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