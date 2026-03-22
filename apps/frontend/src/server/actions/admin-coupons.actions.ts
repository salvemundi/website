'use server';

import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { getSystemDirectus } from '@/lib/directus';
import { 
    readItems, 
    updateItem, 
    deleteItem, 
    createItem 
} from '@directus/sdk';

const ALLOWED_ROLES = ['ictcommissie', 'ict', 'bestuur', 'kascommissie', 'kas', 'kandidaatbestuur', 'kandi'];

async function checkAccess() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error('Niet ingelogd');
    // Allow any admin with entra_id (all internal staff can manage coupons)
    if (!(session.user as any).entra_id) throw new Error('Geen toegang');
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
            fields: ['id', 'coupon_code', 'discount_type', 'discount_value', 'usage_count', 'usage_limit', 'valid_from', 'valid_until', 'is_active', 'date_created']
        }));
        return (items ?? []) as Coupon[];
    } catch (e) {
        console.error('[AdminCoupons] Fetch failed:', e);
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
        return { success: false, error: 'Ongeldige kortingswaarde' };
    }
    if (discountType === 'percentage' && discountValue > 100) {
        return { success: false, error: 'Percentage kan niet hoger zijn dan 100%' };
    }

    const payload: Record<string, unknown> = {
        coupon_code: code.toUpperCase(),
        discount_type: discountType,
        discount_value: discountValue,
        is_active: isActive,
        usage_count: 0,
        usage_limit: usageLimitRaw ? parseInt(usageLimitRaw) : null,
        valid_from: validFrom || null,
        valid_until: validUntil || null,
    };

    try {
        await getUserDirectus(session.session.token).request(createItem('coupons', payload));
        revalidatePath('/beheer/coupons');
        return { success: true };
    } catch (e) {
        console.error('[AdminCoupons] Create failed:', e);
        // Directus SDK errors might contain more info, but for simplicity:
        return { success: false, error: 'Aanmaken mislukt (controleer op unieke code)' };
    }
}

export async function deleteCoupon(id: number): Promise<{ success: boolean; error?: string }> {
    const session = await checkAccess();
    try {
        await getUserDirectus(session.session.token).request(deleteItem('coupons', id));
        revalidatePath('/beheer/coupons');
        return { success: true };
    } catch (e) {
        console.error('[AdminCoupons] Delete failed:', e);
        return { success: false, error: 'Verwijderen mislukt (wordt mogelijk nog gebruikt)' };
    }
}

export async function toggleCouponActive(id: number, currentActive: boolean): Promise<{ success: boolean; error?: string }> {
    const session = await checkAccess();
    try {
        await getUserDirectus(session.session.token).request(updateItem('coupons', id, { is_active: !currentActive }));
        revalidatePath('/beheer/coupons');
        return { success: true };
    } catch (e) {
        console.error('[AdminCoupons] Toggle active failed:', e);
        return { success: false, error: 'Bijwerken mislukt' };
    }
}

