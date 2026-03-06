'use server';

import {
    signupSchema,
    validateCouponSchema,
    transactionStatusSchema,
    type SignupFormData
} from '@salvemundi/validations';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { revalidateTag } from 'next/cache';

const getFinanceServiceUrl = () =>
    process.env.INTERNAL_FINANCE_URL || 'http://v7-acc-finance-service:3001';

const getDirectusUrl = () =>
    process.env.INTERNAL_DIRECTUS_URL || 'http://v7-core-directus:8055';

const getInternalHeaders = () => {
    const token = process.env.INTERNAL_SERVICE_TOKEN;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
};

const getDirectusHeaders = () => {
    const token = process.env.DIRECTUS_STATIC_TOKEN;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
};

/**
 * Validates a coupon code against the Finance microservice.
 */
export async function validateCouponAction(formData: FormData) {
    const couponCode = formData.get('couponCode') as string;
    const parsed = validateCouponSchema.safeParse({ couponCode });

    if (!parsed.success) {
        return { success: false, error: 'Ongeldige coupon code' };
    }

    const url = `${getFinanceServiceUrl()}/api/coupons/validate`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: getInternalHeaders(),
            body: JSON.stringify({ couponCode: parsed.data.couponCode }),
        });

        const data = await response.json();

        if (response.ok && data.valid) {
            return {
                success: true,
                discount: data.discount_value,
                type: data.discount_type,
                description: data.description
            };
        }

        return { success: false, error: data.error || 'Coupon niet geldig' };
    } catch (error) {
        console.error('[membership.actions#validateCoupon] Error:', error);
        return { success: false, error: 'Fout bij valideren van coupon' };
    }
}

/**
 * Initiates a membership payment (signup or renewal).
 */
export async function initiateMembershipPaymentAction(formData: SignupFormData) {
    const parsed = signupSchema.safeParse(formData);

    if (!parsed.success) {
        return { success: false, errors: parsed.error.flatten().fieldErrors };
    }

    const session = await auth.api.getSession({
        headers: await headers()
    });

    const user = session?.user;
    const isExpired = user && !user.is_member; // Assuming is_member is on the user object

    // Determine base amount (simplified logic based on legacy)
    // In a real V7 app, we would verify committee status via Azure Groups or Directus
    const baseAmount = 20.00;

    const url = `${getFinanceServiceUrl()}/api/payments/create`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: getInternalHeaders(),
            body: JSON.stringify({
                amount: baseAmount,
                description: isExpired ? 'Verlenging Salve Mundi Lidmaatschap' : 'Inschrijving Salve Mundi Lidmaatschap',
                isContribution: true,
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

        return { success: false, error: data.error || 'Fout bij aanmaken van betaling' };
    } catch (error) {
        console.error('[membership.actions#initiatePayment] Error:', error);
        return { success: false, error: 'Kan geen verbinding maken met betaalservice' };
    }
}

/**
 * Fetches the status of a transaction for the confirmation page.
 */
export async function getTransactionStatusAction(transactionId: string) {
    const parsed = transactionStatusSchema.safeParse({ id: transactionId });

    if (!parsed.success) {
        return { status: 'error' };
    }

    const url = `${getDirectusUrl()}/items/transacties/${parsed.data.id}`;

    try {
        const response = await fetch(url, {
            headers: getDirectusHeaders(),
            next: { revalidate: 0 } // Don't cache status checks
        });

        const json = await response.json();
        const transaction = json?.data;

        if (transaction?.payment_status === 'paid') {
            // Revalidate user data if payment was successful
            if (transaction.user_id) {
                revalidateTag(`user-${transaction.user_id}`);
            }
            return { status: 'paid' };
        } else if (['failed', 'canceled', 'expired'].includes(transaction?.payment_status)) {
            return { status: 'failed' };
        }

        return { status: 'open' };
    } catch (error) {
        console.error('[membership.actions#getStatus] Error:', error);
        return { status: 'error' };
    }
}
