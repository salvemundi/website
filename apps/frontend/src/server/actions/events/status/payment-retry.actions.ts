'use server';

import { getEnrichedSession } from '@/server/auth/auth-utils';
import { query } from '@/lib/database';
import { getFinanceServiceUrl, getInternalHeaders, fetchWithTimeout } from '@/server/internal/activiteit-utils';
import { safeConsoleError } from '@/server/utils/logger';

interface EventSignupWithEvent {
    id: number;
    event_id: number;
    participant_email: string;
    participant_name: string;
    participant_phone: string;
    payment_status: string;
    event_name: string;
    price_members: number | null;
    price_non_members: number | null;
}

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
        const signupRes = await query(
            `SELECT es.*, e.name as event_name, e.price_members, e.price_non_members 
             FROM event_signups es 
             JOIN events e ON es.event_id = e.id 
             WHERE es.id = $1`,
            [signupId]
        );

        if (signupRes.rows.length === 0) {
            return { success: false, error: "Aanmelding niet gevonden." };
        }

        const signup = signupRes.rows[0] as EventSignupWithEvent;

        const isAdmin = currentUser.role === 'admin' || currentUser.role === '06e78cf9-f9c3-4f9e-a86d-1907de634567' || currentUser.isICT;
        const isParticipant = currentUser.email === signup.participant_email;

        if (!isAdmin && !isParticipant) {
            return { success: false, error: "Unauthorized" };
        }

        if (signup.payment_status === 'paid') {
            return { success: false, error: "Deze aanmelding is al betaald." };
        }

        const isMember = currentUser.membership_status === 'active';
        const price = (isMember ? signup.price_members : signup.price_non_members) ?? 0;

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

        safeConsoleError(`[payment-retry.actions][retryActivityPayment] Finance payment creation failed. Status: ${paymentRes.status}`);
        return { success: false, error: "Kon geen nieuwe betaling aanmaken. Probeer het later opnieuw." };
    } catch (error: unknown) {
        safeConsoleError('[payment-retry.actions][retryActivityPayment] Unexpected failure:', error);
        return { success: false, error: "Er is een onverwachte fout opgetreden. Probeer het later opnieuw." };
    }
}
