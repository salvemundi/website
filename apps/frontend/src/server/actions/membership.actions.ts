'use server';

import { 
    signupSchema, 
    validateCouponSchema, 
    transactionStatusSchema, 
    type SignupFormData
} from '@salvemundi/validations/schema/membership.zod';
import { TRANSACTION_FIELDS } from '@salvemundi/validations/directus/fields';
import { auth } from '@/server/auth/auth';
import { type EnrichedUser } from '@/types/auth';
import { headers } from 'next/headers';
import { revalidateTag } from 'next/cache';
import { rateLimit } from '../utils/ratelimit';
import { query } from '@/lib/database';
import { getExpandedEnv } from '../utils/env';
import { getValidCoupon } from '../utils/coupon.utils';
import { normalizeDate } from '@/lib/utils/date-utils';

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

    const result = await getValidCoupon(parsed.data.couponCode);

    if (!result.valid || !result.coupon) {
        return { success: false, error: result.error || 'Coupon niet gevonden' };
    }

    const { coupon } = result;

    return {
        success: true,
        discount: coupon.discount_value,
        type: coupon.discount_type,
        description: `Korting: ${coupon.discount_value}${coupon.discount_type === 'percentage' ? '%' : ' EUR'}`
    };
}

export async function initiateMembershipPaymentAction(formData: SignupFormData) {
    // Normalize date before validation
    formData.geboortedatum = normalizeDate(formData.geboortedatum) as string;
    
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

    const user = session?.user as unknown as EnrichedUser;
    const isExpired = user && user.membership_status !== 'active';

    // Fetch committees for pricing (Active members pay €10 for renewal)
    const { fetchUserCommitteesDb } = await import('./user-db.utils');
    const committees = user ? await fetchUserCommitteesDb(user.id) : [];
    const isCommitteeMember = committees.length > 0;

    const baseAmount = (isCommitteeMember && isExpired) ? 10.00 : 20.00;
    let finalAmount = baseAmount;

    // Server-side Price Re-calculation & Coupon Re-validation (Pentest/IDOR Mitigation)
    if (parsed.data.coupon) {
        const result = await getValidCoupon(parsed.data.coupon);
        if (result.valid && result.coupon) {
            const { coupon } = result;
            const discountValue = coupon.discount_type === 'percentage' 
                ? (baseAmount * coupon.discount_value / 100) 
                : coupon.discount_value;
            
            // Strictly enforce bounds: Min €0.01 (Mollie), Max baseAmount
            finalAmount = Math.max(0.01, Math.min(baseAmount, baseAmount - discountValue));
        }
    }

    const url = `${getFinanceServiceUrl()}/api/payments/create`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: getInternalHeaders(),
            body: JSON.stringify({
                amount: finalAmount,
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
            `SELECT payment_status, user_id FROM transactions 
             WHERE id::text = $1 
                OR mollie_id::text = $1 
                OR access_token::text = $1 
             LIMIT 1`,
            [parsed.data.id]
        );

        if (!rows || rows.length === 0) return { status: 'error' };
        const transaction = rows[0];

        if (transaction.payment_status === 'paid') {
            // Revalidate user data if payment was successful
            if (transaction.user_id) {
                revalidateTag(`user-${transaction.user_id}`, 'max');
            }
            return { status: 'paid', user_id: transaction.user_id };
        } else if (['failed', 'canceled', 'expired'].includes(transaction.payment_status ?? '')) {
            return { status: 'failed', user_id: transaction.user_id };
        }

        return { status: 'open', user_id: transaction.user_id };
    } catch (error) {
        
        return { status: 'error', user_id: null };
    }
}


