'use server';

import { getEnrichedSession } from '@/server/auth/auth-utils';
import { db, schema } from '@salvemundi/db';
import { eq } from 'drizzle-orm';
import { getFinanceServiceUrl, getInternalHeaders, fetchWithTimeout } from '@/server/internal/activiteit-utils';
import { safeConsoleError } from '@/server/utils/logger';

/**
 * Re-initiates the payment process for an existing signup.
 */
export async function retryActivityPayment(signupId: number) {
    const session = await getEnrichedSession();
    if (!session) {
        return { success: false, error: "Niet ingelogd" };
    }
    const currentUser = session.user;

    try {
        const rows = await db.select({
            id: schema.event_signups.id,
            event_id: schema.event_signups.event_id,
            participant_email: schema.event_signups.participant_email,
            participant_name: schema.event_signups.participant_name,
            participant_phone: schema.event_signups.participant_phone,
            payment_status: schema.event_signups.payment_status,
            event_name: schema.events.name,
            price_members: schema.events.price_members,
            price_non_members: schema.events.price_non_members
        })
        .from(schema.event_signups)
        .innerJoin(schema.events, eq(schema.event_signups.event_id, schema.events.id))
        .where(eq(schema.event_signups.id, signupId))
        .limit(1);

        if (rows.length === 0) {
            return { success: false, error: "Aanmelding niet gevonden." };
        }

        const signup = rows[0];

        const isAdmin = currentUser.role === 'admin' || currentUser.role === '06e78cf9-f9c3-4f9e-a86d-1907de634567' || currentUser.isICT;
        const isParticipant = currentUser.email === signup.participant_email;

        if (!isAdmin && !isParticipant) {
            return { success: false, error: "Unauthorized" };
        }

        if (signup.payment_status === 'paid') {
            return { success: false, error: "Deze aanmelding is al betaald." };
        }

        const isMember = currentUser.membership_status === 'active';
        const price = Number(isMember ? signup.price_members : signup.price_non_members) || 0;

        if (price <= 0) {
            return { success: false, error: "Deze activiteit is gratis." };
        }

        const financeUrl = `${getFinanceServiceUrl()}/api/payments/create`;
        const paymentRes = await fetchWithTimeout(financeUrl, {
            method: 'POST',
            headers: getInternalHeaders(),
            body: JSON.stringify({
                amount: price,
                description: `Retry Signup: ${signup.event_name}`,
                registrationId: signup.id,
                registrationType: 'event_signup',
                email: signup.participant_email,
                firstName: signup.participant_name,
                phoneNumber: signup.participant_phone,
                userId: currentUser.id,
                isContribution: false,
                redirectUrl: `${process.env.PUBLIC_URL}/activiteiten/bevestiging?id=${signup.id}`
            })
        });

        const paymentData = await paymentRes.json() as { checkoutUrl?: string };
        if (paymentRes.ok && paymentData.checkoutUrl) {
            return { success: true, checkoutUrl: paymentData.checkoutUrl };
        }

        safeConsoleError(`[payment-retry.actions.ts][retryActivityPayment] Finance payment creation failed. Status: ${paymentRes.status}`);
        return { success: false, error: "Kon geen nieuwe betaling aanmaken. Probeer het later opnieuw." };
    } catch (error: unknown) {
        safeConsoleError('[payment-retry.actions.ts][retryActivityPayment] Unexpected failure:', error);
        return { success: false, error: "Er is een onverwachte fout opgetreden. Probeer het later opnieuw." };
    }
}
