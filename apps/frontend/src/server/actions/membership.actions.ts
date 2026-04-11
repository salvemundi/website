'use server';

import { 
    signupSchema, 
    validateCouponSchema, 
    transactionStatusSchema, 
    type SignupFormData,
    TRANSACTION_FIELDS 
} from '@salvemundi/validations';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { revalidateTag } from 'next/cache';
import { rateLimit } from '../utils/ratelimit';
import { query } from '@/lib/database';


const getFinanceServiceUrl = () =>
    process.env.FINANCE_SERVICE_URL;

const getInternalHeaders = () => {
    const token = process.env.INTERNAL_SERVICE_TOKEN;
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
 
        
        return { success: false, error: 'De opgegeven coupon is niet geldig of de service is niet bereikbaar.' };
    } catch (error) {
        
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


