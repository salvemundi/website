'use server';

import { z } from 'zod';
import crypto from 'node:crypto';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { type MembershipUserData } from '@/components/islands/account/MembershipStatusIsland';
import { webshopPreorderFormSchema, type WebshopPreorderForm } from '@salvemundi/validations/schema/webshop.zod';
import { fetchProductByIdDb } from '@/server/internal/webshop/webshop-product-db.utils';
import { insertPreorderDb, insertPreorderLinesDb, fetchPreorderByIdDb } from '@/server/internal/webshop/webshop-preorder-db.utils';;
import { getFinanceServiceUrl, getInternalHeaders, fetchWithTimeout } from '@/server/internal/activiteiten/activiteiten.utils';
import { safeConsoleError } from '@/server/utils/logger';

interface FinancePaymentResponse {
    checkoutUrl?: string;
}

interface FinanceErrorResponse {
    error?: string;
    message?: string;
}

async function requireMemberSession() {
    const session = await getEnrichedSession();
    if (!session?.user) {
        return { ok: false as const, error: 'Je moet ingelogd zijn om te bestellen.' };
    }

    const user = session.user as unknown as MembershipUserData;
    if (user.membership_status !== 'active') {
        return { ok: false as const, error: 'Bestellen is alleen voor leden van Salve Mundi.' };
    }

    return { ok: true as const, session };
}

async function buildFinancePaymentRequest(preorderId: number, paymentType: 'deposit' | 'final') {
    const preorder = await fetchPreorderByIdDb(preorderId);
    if (!preorder) return { success: false as const, error: 'Bestelling niet gevonden.' };

    if (paymentType === 'deposit' && preorder.deposit_paid) {
        return { success: false as const, error: 'Aanbetaling is al voldaan.' };
    }
    if (paymentType === 'final' && preorder.final_payment_paid) {
        return { success: false as const, error: 'Restbetaling is al voldaan.' };
    }
    if (paymentType === 'final' && !preorder.deposit_paid) {
        return { success: false as const, error: 'De aanbetaling moet eerst voldaan zijn.' };
    }

    const amount = paymentType === 'deposit'
        ? Number(preorder.deposit_amount)
        : Number(preorder.subtotal_amount) - Number(preorder.deposit_amount);

    if (!(amount > 0)) {
        return { success: false as const, error: 'Het te betalen bedrag is ongeldig.' };
    }

    const FINANCE_SERVICE_URL = getFinanceServiceUrl();
    if (!FINANCE_SERVICE_URL) return { success: false as const, error: 'Betaalservice niet geconfigureerd.' };

    const redirectUrl = `${process.env.PUBLIC_URL || ''}/webshop/bevestiging?preorder=${preorderId}&token=${preorder.access_token}`;

    try {
        const response = await fetchWithTimeout(`${FINANCE_SERVICE_URL}/api/finance/create`, {
            method: 'POST',
            headers: getInternalHeaders(),
            body: JSON.stringify({
                amount,
                description: `${paymentType === 'deposit' ? 'Aanbetaling' : 'Restbetaling'}: webshop bestelling #${preorderId}`,
                registrationId: preorderId,
                registrationType: 'webshop_preorder',
                email: preorder.email,
                firstName: preorder.first_name,
                lastName: preorder.last_name,
                phoneNumber: preorder.phone_number,
                userId: preorder.user_id,
                redirectUrl
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({})) as FinanceErrorResponse;
            safeConsoleError('[webshop-checkout.actions.ts][buildFinancePaymentRequest] Finance service error:', errData);
            return { success: false as const, error: errData.message || errData.error || 'Betaalverzoek mislukt.' };
        }

        const data = await response.json() as FinancePaymentResponse;
        return { success: true as const, checkoutUrl: data.checkoutUrl };
    } catch (error) {
        safeConsoleError('[webshop-checkout.actions.ts][buildFinancePaymentRequest]', error);
        return { success: false as const, error: 'Interne fout bij starten betaling.' };
    }
}

export async function submitPreorderAndInitiatePayment(formData: WebshopPreorderForm) {
    try {
        if (formData.website) {
            return { success: false, error: 'Ongeldige aanvraag.' };
        }

        const memberCheck = await requireMemberSession();
        if (!memberCheck.ok) return { success: false, error: memberCheck.error };
        const { session } = memberCheck;

        const validated = webshopPreorderFormSchema.safeParse(formData);
        if (!validated.success) {
            return { success: false, error: 'Vul alle verplichte velden correct in.', fieldErrors: z.flattenError(validated.error).fieldErrors };
        }
        const data = validated.data;

        if (data.lines.length !== 1) {
            return { success: false, error: 'Er kan op dit moment maar 1 product per bestelling worden geplaatst.' };
        }
        const line = data.lines[0];

        const product = await fetchProductByIdDb(line.product_id);
        if (!product || !product.is_active) {
            return { success: false, error: 'Dit product is niet meer beschikbaar.' };
        }
        if (!product.drop_window || product.drop_window.id !== data.drop_window_id || product.drop_window.status !== 'open') {
            return { success: false, error: 'Deze drop is gesloten voor nieuwe bestellingen.' };
        }

        let variantLabel: string | null = null;
        if (product.type === 'clothing') {
            if (!line.variant_id) return { success: false, error: 'Kies een maat.' };
            const variant = product.variants.find(v => v.id === line.variant_id && v.is_active);
            if (!variant) return { success: false, error: 'Ongeldige variant geselecteerd.' };
            variantLabel = [variant.size, variant.color].filter(Boolean).join(' / ') || null;
        }

        const unitPrice = Number(product.price);
        const unitDeposit = Number(product.deposit_amount);
        const subtotal = unitPrice * line.quantity;
        const deposit = unitDeposit * line.quantity;

        const preorderId = await insertPreorderDb({
            user_id: session.user.id,
            drop_window_id: product.drop_window.id,
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone_number: data.phone_number,
            status: 'awaiting_deposit',
            subtotal_amount: subtotal.toFixed(2),
            deposit_amount: deposit.toFixed(2),
            terms_accepted: data.terms_accepted,
            pickup_notes: data.pickup_notes || null,
            access_token: crypto.randomUUID(),
        });

        if (!preorderId) {
            return { success: false, error: 'Bestelling aanmaken mislukt.' };
        }

        await insertPreorderLinesDb([{
            preorder_id: preorderId,
            product_id: product.id,
            variant_id: line.variant_id ?? null,
            quantity: line.quantity,
            unit_price: unitPrice.toFixed(2),
            product_name_snapshot: product.name,
            variant_label_snapshot: variantLabel,
        }]);

        const payment = await buildFinancePaymentRequest(preorderId, 'deposit');
        if (!payment.success) {
            return { success: false, error: payment.error, preorderId };
        }

        return { success: true, checkoutUrl: payment.checkoutUrl, preorderId };
    } catch (error) {
        safeConsoleError('[webshop-checkout.actions.ts][submitPreorderAndInitiatePayment]', error);
        return { success: false, error: 'Er is een onverwachte fout opgetreden.' };
    }
}

export async function initiateFinalPayment(preorderId: number, token?: string) {
    try {
        const preorder = await fetchPreorderByIdDb(preorderId);
        if (!preorder) return { success: false as const, error: 'Bestelling niet gevonden.' };

        const session = await getEnrichedSession();
        const isOwner = Boolean(session?.user.id && preorder.user_id === session.user.id);
        const hasValidToken = Boolean(token && preorder.access_token && token === preorder.access_token);

        if (!isOwner && !hasValidToken) {
            return { success: false as const, error: 'Geen toegang tot deze bestelling.' };
        }

        return await buildFinancePaymentRequest(preorderId, 'final');
    } catch (error) {
        safeConsoleError('[webshop-checkout.actions.ts][initiateFinalPayment]', error);
        return { success: false as const, error: 'Er is een onverwachte fout opgetreden.' };
    }
}
