'use server';

import { z } from 'zod';
import { db, schema } from '@salvemundi/db';
import { eq, or, type SQL } from 'drizzle-orm';

import {
    signupSchema,
    validateCouponSchema,
    transactionStatusSchema,
    type SignupFormData
} from '@salvemundi/validations/schema/membership.zod';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { type EnrichedUser } from '@/types/auth';
import { revalidateTag } from 'next/cache';
import { rateLimit } from '@/server/utils/ratelimit';
import { getExpandedEnv } from '@/server/utils/env';
import { getValidCoupon, claimCoupon, releaseCoupon } from '@/server/utils/coupon.utils';
import { normalizeDate } from '@/lib/utils/date-utils';
import { safeConsoleError } from '@/server/utils/logger';

const getFinanceServiceUrl = () => getExpandedEnv('FINANCE_SERVICE_URL');

const getInternalHeaders = () => {
    const token = (getExpandedEnv('INTERNAL_SERVICE_TOKEN') || '').replace(/^"|"$/g, '').trim();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
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
    formData.geboortedatum = normalizeDate(formData.geboortedatum) as string;

    const parsed = signupSchema.safeParse(formData);

    if (!parsed.success) {
        return { success: false, errors: z.flattenError(parsed.error).fieldErrors };
    }

    const { success } = await rateLimit('membership-signup', 3, 300);
    if (!success) {
        return { success: false, error: 'Te veel inschrijfpogingen. Probeer het over een paar minuten opnieuw.' };
    }

    const session = await getEnrichedSession();

    const user = session?.user as EnrichedUser | undefined;
    const isExpired = user && user.membership_status !== 'active';

    const { fetchUserCommitteesDb } = await import('@/server/internal/user-db.utils');
    const committees = user ? await fetchUserCommitteesDb(user.id) : [];
    const isCommitteeMember = committees.length > 0;

    const baseAmount = (isCommitteeMember && isExpired) ? 10.00 : 20.00;
    let finalAmount = baseAmount;
    let couponClaimed = false;

    if (parsed.data.coupon) {
        const result = await claimCoupon(parsed.data.coupon);
        if (result.valid && result.coupon) {
            couponClaimed = true;
            const { coupon } = result;
            const discountValue = coupon.discount_type === 'percentage'
                ? (baseAmount * coupon.discount_value / 100)
                : coupon.discount_value;

            finalAmount = Math.max(0.01, Math.min(baseAmount, baseAmount - discountValue));
        } else {
            return { success: false, error: result.error || 'Coupon is ongeldig of niet meer beschikbaar' };
        }
    }

    const url = `${getFinanceServiceUrl()}/api/finance/create`;

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
            })
        });

        const data = await response.json() as { checkoutUrl?: string; error?: unknown; message?: string };

        if (response.ok && data.checkoutUrl) {
            return { success: true, checkoutUrl: data.checkoutUrl };
        }

        safeConsoleError('[membership.actions.ts][initiateMembershipPaymentAction] ', `Finance service returned status ${response.status}: ${JSON.stringify(data)}`);

        if (couponClaimed && parsed.data.coupon) {
            await releaseCoupon(parsed.data.coupon);
        }
        return { success: false, error: 'Er is een fout opgetreden bij het aanmaken van de betaling.' };
    } catch (error: unknown) {
        if (couponClaimed && parsed.data.coupon) {
            await releaseCoupon(parsed.data.coupon);
        }
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[membership.actions.ts][initiateMembershipPaymentAction] ', `Payment initiation failed: ${typedError.message}`);
        return { success: false, error: 'Kan geen verbinding maken met betaalservice' };
    }
}

export async function getTransactionStatusAction(transactionId: string) {
    const parsed = transactionStatusSchema.safeParse({ id: transactionId });

    if (!parsed.success) {
        return { status: 'error' };
    }

    try {
        const idStr = parsed.data.id;
        const idNum = Number(idStr);
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idStr);

        const conditions: SQL[] = [];
        if (!isNaN(idNum)) {
            conditions.push(eq(schema.transactions.id, idNum));
        }
        conditions.push(eq(schema.transactions.mollie_id, idStr));
        if (isUuid) {
            conditions.push(eq(schema.transactions.access_token, idStr));
        }

        const rows = await db.select({
            payment_status: schema.transactions.payment_status,
            user_id: schema.transactions.user_id
        }).from(schema.transactions).where(or(...conditions)).limit(1);

        if (rows.length === 0) return { status: 'error' };
        const transaction = rows[0] as { payment_status: string; user_id: string | null };

        if (transaction.payment_status === 'paid') {
            if (transaction.user_id) {
                revalidateTag(`user-${transaction.user_id}`, 'max');
            }
            return { status: 'paid', user_id: transaction.user_id };
        } else if (['failed', 'canceled', 'expired'].includes(transaction.payment_status)) {
            return { status: 'failed', user_id: transaction.user_id };
        }

        return { status: 'open', user_id: transaction.user_id };
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[membership.actions.ts][getTransactionStatusAction] ', `Status check failed: ${typedError.message}`);
        return { status: 'error', user_id: null };
    }
}