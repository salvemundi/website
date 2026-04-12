'use server';

import { 
    signupSchema, 
    validateCouponSchema, 
    transactionStatusSchema, 
    type SignupFormData
} from '@salvemundi/validations/schema/membership.zod';
import { TRANSACTION_FIELDS } from '@salvemundi/validations/directus/fields';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { revalidateTag } from 'next/cache';
import { rateLimit } from '../utils/ratelimit';
import { query } from '@/lib/database';
import { getExpandedEnv } from '../utils/env';

const getFinanceServiceUrl = () =>
    getExpandedEnv('FINANCE_SERVICE_URL');

const getInternalHeaders = () => {
    const token = getExpandedEnv('INTERNAL_SERVICE_TOKEN');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
};

export async function validateCouponAction(formData: FormData) {
    const couponCode = formData.get('couponCode') as string;
    const parsed = validateCouponSchema.safeParse({ couponCode });

    if (!parsed.success) {
        return { success: false, error: 'Ongeldige coupon code' };
    }

    const { success } = await rateLimit('validate-coupon', 10, 60);
    if (!success) {
        return { success: false, error: 'Te veel verzoeken. Probeer het later opnieuw.' };
    }

    try {
        // Direct SQL validation (Pentest-safe via $1 parameters)
        const sql = `
            SELECT 
                discount_type, 
                discount_value, 
                description, 
                usage_count, 
                usage_limit, 
                valid_from, 
                valid_until, 
                is_active
            FROM coupons
            WHERE UPPER(coupon_code) = UPPER($1)
            LIMIT 1
        `;

        const result = await query(sql, [parsed.data.couponCode.trim()]);
        const coupon = result.rows[0];

        if (!coupon) {
            return { success: false, error: 'Coupon niet gevonden' };
        }

        // 1. Manual Toggle Check
        if (!coupon.is_active) {
            return { success: false, error: 'Deze coupon is momenteel niet actief' };
        }

        // 2. Date Validation Logic
        const now = new Date();
        
        if (coupon.valid_from && new Date(coupon.valid_from) > now) {
            return { success: false, error: 'Deze coupon is nog niet geldig' };
        }

        if (coupon.valid_until && new Date(coupon.valid_until) < now) {
            return { success: false, error: 'Deze coupon is verlopen' };
        }

        // 3. Usage Limit Check
        if (coupon.usage_limit !== null && (coupon.usage_count || 0) >= coupon.usage_limit) {
            return { success: false, error: 'Deze coupon is al maximaal gebruikt' };
        }

        return {
            success: true,
            discount: Number(coupon.discount_value),
            type: coupon.discount_type,
            description: coupon.description || `Korting: ${coupon.discount_value}${coupon.discount_type === 'percentage' ? '%' : ' EUR'}`
        };
    } catch (error: any) {
        // Log the error for internal monitoring (Server-side only)
        // In a real production app, use a dedicated logger here.
        return { success: false, error: 'Fout bij valideren van coupon' };
    }
}

export async function initiateMembershipPaymentAction(formData: SignupFormData) {
    const parsed = signupSchema.safeParse(formData);

    if (!parsed.success) {
        return { success: false, errors: parsed.error.flatten().fieldErrors };
    }

    const { success } = await rateLimit('membership-signup', 3, 300);
    if (!success) {
        return { success: false, error: 'Te veel inschrijfpogingen. Probeer het over een paar minuten opnieuw.' };
    }


    const session = await auth.api.getSession({
        headers: await headers()
    });

    const user = session?.user;
    const isExpired = user && user.membership_status !== 'active';

    // Fetch committees for pricing (Active members pay €10 for renewal)
    const { fetchUserCommitteesDb } = await import('./user-db.utils');
    const committees = user ? await fetchUserCommitteesDb(user.id) : [];
    const isCommitteeMember = committees.length > 0;

    const baseAmount = (isCommitteeMember && isExpired) ? 10.00 : 20.00;

    const url = `${getFinanceServiceUrl()}/api/payments/create`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: getInternalHeaders(),
            body: JSON.stringify({
                amount: baseAmount,
                description: isExpired ? 'Verlenging Salve Mundi Lidmaatschap' : 'Inschrijving Salve Mundi Lidmaatschap',
                registrationType: 'membership',
                isContribution: true,
                isNewMember: !isExpired,
                userId: user?.id || null,
                firstName: parsed.data.voornaam,
                lastName: parsed.data.achternaam,
                email: parsed.data.email,
                dateOfBirth: parsed.data.geboortedatum,
                phoneNumber: parsed.data.telefoon,
                couponCode: parsed.data.coupon,
                redirectUrl: `${process.env.PUBLIC_URL}/lidmaatschap/bevestiging${isExpired ? '?type=renewal' : ''}`
            }),
        });

        const data = await response.json();

        if (response.ok && data.checkoutUrl) {
            return { success: true, checkoutUrl: data.checkoutUrl };
        }
 
        
        return { success: false, error: 'Er is een fout opgetreden bij het aanmaken van de betaling.' };
    } catch (error) {
        
        return { success: false, error: 'Kan geen verbinding maken met betaalservice' };
    }
}

export async function getTransactionStatusAction(transactionId: string) {
    const parsed = transactionStatusSchema.safeParse({ id: transactionId });

    if (!parsed.success) {
        return { status: 'error' };
    }

    try {
        const { rows } = await query(
            'SELECT payment_status, user_id FROM transactions WHERE id = $1 LIMIT 1',
            [parsed.data.id]
        );

        if (!rows || rows.length === 0) return { status: 'error' };
        const transaction = rows[0];

        if (transaction.payment_status === 'paid') {
            // Revalidate user data if payment was successful
            if (transaction.user_id) {
                revalidateTag(`user-${transaction.user_id}`, 'default');
            }
            return { status: 'paid' };
        } else if (['failed', 'canceled', 'expired'].includes(transaction.payment_status ?? '')) {
            return { status: 'failed' };
        }

        return { status: 'open' };
    } catch (error) {
        
        return { status: 'error' };
    }
}


