'use server';

import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

const getDirectusUrl = () => process.env.INTERNAL_DIRECTUS_URL;
const getToken = () => {
    const token = process.env.DIRECTUS_STATIC_TOKEN;
    if (!token) throw new Error('DIRECTUS_STATIC_TOKEN is missing');
    return token;
};
const directusHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
});

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
    const res = await fetch(
        `${getDirectusUrl()}/items/coupons?sort=-id&limit=500&fields=id,coupon_code,discount_type,discount_value,usage_count,usage_limit,valid_from,valid_until,is_active,date_created`,
        { headers: directusHeaders() }
    );
    if (!res.ok) throw new Error('Kon coupons niet ophalen');
    const json = await res.json();
    return json.data ?? [];
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

    const res = await fetch(`${getDirectusUrl()}/items/coupons`, {
        method: 'POST',
        headers: directusHeaders(),
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text();
        console.error('[admin-coupons] createCoupon failed:', text);
        if (text.includes('unique')) return { success: false, error: 'Deze coupon code bestaat al' };
        return { success: false, error: 'Aanmaken mislukt' };
    }

    revalidatePath('/beheer/coupons');
    return { success: true };
}

export async function deleteCoupon(id: number): Promise<{ success: boolean; error?: string }> {
    await checkAccess();
    const res = await fetch(`${getDirectusUrl()}/items/coupons/${id}`, {
        method: 'DELETE',
        headers: directusHeaders(),
    });
    if (!res.ok) {
        const text = await res.text();
        if (text.includes('foreign') || text.includes('constraint')) {
            return { success: false, error: 'Coupon kan niet worden verwijderd (wordt nog gebruikt in een betaling)' };
        }
        return { success: false, error: 'Verwijderen mislukt' };
    }
    revalidatePath('/beheer/coupons');
    return { success: true };
}

export async function toggleCouponActive(id: number, currentActive: boolean): Promise<{ success: boolean; error?: string }> {
    await checkAccess();
    const res = await fetch(`${getDirectusUrl()}/items/coupons/${id}`, {
        method: 'PATCH',
        headers: directusHeaders(),
        body: JSON.stringify({ is_active: !currentActive }),
    });
    if (!res.ok) return { success: false, error: 'Bijwerken mislukt' };
    revalidatePath('/beheer/coupons');
    return { success: true };
}

