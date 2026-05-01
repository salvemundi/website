'use server';

import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { isSuperAdmin } from '@/lib/auth';

import { getSystemDirectus } from '@/lib/directus';
import { 
    readItems, 
    updateItem, 
    deleteItem, 
    createItem 
} from '@directus/sdk';
import { COUPON_FIELDS } from '@salvemundi/validations/directus/fields';

import { AdminResource } from '@/shared/lib/permissions-config';
import { hasPermission } from '@/shared/lib/permissions';
import { type EnrichedUser } from '@/types/auth';

async function checkAccess() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error('Niet ingelogd');
    
    const user = session.user as unknown as EnrichedUser;
    if (!hasPermission(user.committees, AdminResource.Coupons)) {
        throw new Error('Geen toegang: onvoldoende rechten voor coupon beheer');
    }
    
    return session;
}

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

export type CouponStatus = 'active' | 'expired' | 'maxed' | 'inactive' | 'pending';

export async function getCoupons(): Promise<Coupon[]> {
    await checkAccess();
    try {
        const items = await getSystemDirectus().request(readItems('coupons', {
            sort: ['-id'],
            limit: 500,
            fields: [...COUPON_FIELDS]
        }));
        return (items ?? []).map(i => ({
            ...i,
            id: Number(i.id),
            coupon_code: i.coupon_code || '',
            discount_type: (i.discount_type || 'percentage') as 'fixed' | 'percentage',
            discount_value: Number(i.discount_value),
            usage_count: Number(i.usage_count),
            usage_limit: i.usage_limit ? Number(i.usage_limit) : null,
            valid_from: i.valid_from || null,
            valid_until: i.valid_until || null,
            is_active: !!i.is_active,
            date_created: i.date_created || undefined
        } as Coupon));
    } catch (e) {
        
        throw new Error('Kon coupons niet ophalen');
    }
}

export async function createCoupon(formData: FormData): Promise<{ success: boolean; error?: string; fieldErrors?: Record<string, string[]> }> {
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

    const payload: Record<string, unknown> = {
        coupon_code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: discountValue,
        is_active: isActive,
        usage_count: 0,
        usage_limit: usageLimit,
        valid_from: validFrom || null,
        valid_until: validUntil || null,
    };

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error('Unauthorized');
    try {
        await getSystemDirectus().request(createItem('coupons', payload));
        revalidatePath('/beheer/coupons');
        return { success: true };
    } catch (e) {
        
        // Directus SDK errors might contain more info, but for simplicity:
        return { success: false, error: 'Aanmaken mislukt (controleer op unieke code)' };
    }
}

export async function deleteCoupon(id: number): Promise<{ success: boolean; error?: string }> {
    const session = await checkAccess();
    try {
        await getSystemDirectus().request(deleteItem('coupons', id));
        revalidatePath('/beheer/coupons');
        return { success: true };
    } catch (e) {
        
        return { success: false, error: 'Verwijderen mislukt (wordt mogelijk nog gebruikt)' };
    }
}

export async function toggleCouponActive(id: number, currentActive: boolean): Promise<{ success: boolean; error?: string }> {
    const session = await checkAccess();
    try {
        await getSystemDirectus().request(updateItem('coupons', id, { is_active: !currentActive }));
        revalidatePath('/beheer/coupons');
        return { success: true };
    } catch (e) {
        
        return { success: false, error: 'Bijwerken mislukt' };
    }
}

