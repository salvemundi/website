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
import { checkRateLimit } from '@/server/utils/ratelimit';
import { getExpandedEnv } from '@/server/utils/env';
import { getValidCoupon, claimCoupon, releaseCoupon } from '@/server/internal/coupon/coupon-db.utils';;
import { normalizeDate } from '@/lib/utils/date-utils';
import { safeConsoleError, logInfo } from '@/server/utils/logger';

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

    const rateLimitResult = await checkRateLimit('validate-coupon', 10, 60, 'Te veel verzoeken. Probeer het later opnieuw.');
    if (!rateLimitResult.success) return rateLimitResult;

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
    const session = await getEnrichedSession();
    const user = session?.user as EnrichedUser | undefined;
    const isRenewal = !!user;

    let voornaam = formData.voornaam;
    let achternaam = formData.achternaam;
    let email = formData.email;
    let telefoon = formData.telefoon;
    let geboortedatum = formData.geboortedatum;
    const couponCode = formData.coupon;

    if (isRenewal) {
        // For existing member renewals, prefill from authenticated user context
        voornaam = user.first_name || voornaam;
        achternaam = user.last_name || achternaam || '';
        email = user.email || email;
        telefoon = user.phone_number || telefoon || '';
        geboortedatum = user.date_of_birth || geboortedatum || '';
    } else {
        // For new member signups, strictly validate registration schema
        formData.geboortedatum = normalizeDate(formData.geboortedatum) as string;
        const parsed = signupSchema.safeParse(formData);

        if (!parsed.success) {
            const formattedErrors = z.flattenError(parsed.error).fieldErrors;
            const firstErrorMessage = Object.values(formattedErrors).flat()[0] || 'Ongeldige gegevens ingevuld.';
            safeConsoleError('[membership.actions.ts][initiateMembershipPaymentAction] Validation failed for new signup:', formattedErrors);
            return { success: false, error: firstErrorMessage, errors: formattedErrors };
        }

        voornaam = parsed.data.voornaam;
        achternaam = parsed.data.achternaam;
        email = parsed.data.email;
        telefoon = parsed.data.telefoon;
        geboortedatum = parsed.data.geboortedatum;
    }

    const rateLimitKey = isRenewal ? `membership-renewal-${user.id}` : 'membership-signup';
    const rateLimitResult = await checkRateLimit(rateLimitKey, 5, 300, 'Te veel pogingen. Probeer het over een paar minuten opnieuw.');
    if (!rateLimitResult.success) {
        safeConsoleError('[membership.actions.ts][initiateMembershipPaymentAction] Rate limit triggered:', rateLimitResult);
        return rateLimitResult;
    }

    const { fetchUserCommitteesDb } = await import('@/server/internal/leden/leden-db.utils');
    const committees = user ? await fetchUserCommitteesDb(user.id) : [];
    const isCommitteeMember = committees.length > 0;

    const baseAmount = (isCommitteeMember && isRenewal) ? 10.00 : 20.00;
    let finalAmount = baseAmount;
    let couponClaimed = false;

    if (couponCode) {
        const result = await claimCoupon(couponCode);
        if (result.valid && result.coupon) {
            couponClaimed = true;
            const { coupon } = result;
            const discountValue = coupon.discount_type === 'percentage'
                ? (baseAmount * coupon.discount_value / 100)
                : coupon.discount_value;

            finalAmount = Math.max(0.01, Math.min(baseAmount, baseAmount - discountValue));
        } else {
            safeConsoleError('[membership.actions.ts][initiateMembershipPaymentAction] Coupon claim failed:', result.error);
            return { success: false, error: result.error || 'Coupon is ongeldig of niet meer beschikbaar' };
        }
    }

    const url = `${getFinanceServiceUrl()}/api/finance/create`;
    logInfo('[membership.actions.ts][initiateMembershipPaymentAction]', `Initiating ${isRenewal ? 'RENEWAL' : 'SIGNUP'} payment for ${email} (${finalAmount} EUR) to ${url}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: getInternalHeaders(),
            signal: AbortSignal.timeout(10000),
            body: JSON.stringify({
                amount: finalAmount,
                description: isRenewal ? 'Verlenging Salve Mundi Lidmaatschap' : 'Inschrijving Salve Mundi Lidmaatschap',
                registrationType: 'membership',
                isContribution: true,
                isNewMember: !isRenewal,
                userId: user?.id || null,
                firstName: voornaam,
                lastName: achternaam,
                email: email,
                dateOfBirth: geboortedatum,
                phoneNumber: telefoon,
                couponCode: couponCode,
                redirectUrl: `${process.env.PUBLIC_URL}/lidmaatschap/bevestiging${isRenewal ? '?type=renewal' : ''}`
            })
        });

        const data = await response.json() as { checkoutUrl?: string; error?: unknown; message?: string };

        if (response.ok && data.checkoutUrl) {
            return { success: true, checkoutUrl: data.checkoutUrl };
        }

        safeConsoleError('[membership.actions.ts][initiateMembershipPaymentAction]', `Finance service returned status ${response.status}: ${JSON.stringify(data)}`);

        if (couponClaimed && couponCode) {
            await releaseCoupon(couponCode);
        }
        return { success: false, error: 'Er is een fout opgetreden bij het aanmaken van de betaling. Probeer het later opnieuw of neem contact op met het bestuur.' };
    } catch (error: unknown) {
        if (couponClaimed && couponCode) {
            await releaseCoupon(couponCode);
        }
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[membership.actions.ts][initiateMembershipPaymentAction]', `Payment initiation failed: ${typedError.message}`);
        return { success: false, error: 'Kan geen verbinding maken met de betaalservice. Probeer het later opnieuw.' };
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
            return { status: 'paid', user_id: transaction.user_id };
        } else if (['failed', 'canceled', 'expired'].includes(transaction.payment_status)) {
            return { status: 'failed', user_id: transaction.user_id };
        }

        // If status is still 'open' in DB, perform a live check against finance service (Mollie)
        if (isUuid) {
            try {
                const statusRes = await fetch(`${getFinanceServiceUrl()}/api/finance/status/${idStr}`, {
                    headers: getInternalHeaders(),
                    signal: AbortSignal.timeout(5000)
                });
                if (statusRes.ok) {
                    const liveData = await statusRes.json() as { payment_status?: string };
                    if (liveData.payment_status === 'paid') {
                        return { status: 'paid', user_id: transaction.user_id };
                    } else if (liveData.payment_status && ['failed', 'canceled', 'expired'].includes(liveData.payment_status)) {
                        return { status: 'failed', user_id: transaction.user_id };
                    }
                }
            } catch (liveErr) {
                logInfo('[membership.actions.ts][getTransactionStatusAction]', `Live status check failed for token ${idStr}: ${liveErr instanceof Error ? liveErr.message : String(liveErr)}`);
            }
        }

        return { status: 'open', user_id: transaction.user_id };
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[membership.actions.ts][getTransactionStatusAction] ', `Status check failed: ${typedError.message}`);
        return { status: 'error', user_id: null };
    }
}