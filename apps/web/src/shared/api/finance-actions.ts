'use server';

const FINANCE_SERVICE_URL = process.env.FINANCE_SERVICE_URL;
const SERVICE_SECRET = process.env.SERVICE_SECRET;

if (!FINANCE_SERVICE_URL) {
    throw new Error('Server configuration error: FINANCE_SERVICE_URL is not defined in environment variables.');
}
if (!SERVICE_SECRET) {
    throw new Error('Server configuration error: SERVICE_SECRET is not defined in environment variables.');
}

export interface PaymentPayload {
    amount: string | number;
    description: string;
    redirectUrl: string;
    isContribution?: boolean;
    userId?: string | null;
    firstName?: string;
    lastName?: string;
    email?: string;
    dateOfBirth?: string;
    phoneNumber?: string;
    couponCode?: string;
    registrationId?: string | number;
    registrationType?: string;
    qrToken?: string;
}

export interface PaymentResult {
    success: boolean;
    checkoutUrl?: string; // Redirect URL for Mollie
    paymentId?: string;   // For free transactions
    error?: string;
}

/**
 * Creates a payment by calling the Finance Service.
 */
export async function createPaymentAction(payload: PaymentPayload, traceId?: string): Promise<PaymentResult> {
    const activeTraceId = traceId || Math.random().toString(36).substring(7);

    console.info(`[Action][${activeTraceId}] Creating payment for: ${payload.description} (${payload.amount})`);

    if (!SERVICE_SECRET) {
        console.error(`[Action][${activeTraceId}] SERVICE_SECRET is not set!`);
        return { success: false, error: 'Serverconfiguratie fout' };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for payments (slightly longer than coupons)

    try {
        const response = await fetch(`${FINANCE_SERVICE_URL}/api/payments/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': SERVICE_SECRET,
                'X-Trace-Id': activeTraceId
            },
            body: JSON.stringify(payload),
            cache: 'no-store',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.warn(`[Action][${activeTraceId}] Finance Service Error (${response.status}):`, errorText);

            try {
                const errorJson = JSON.parse(errorText);
                return {
                    success: false,
                    error: errorJson.details || errorJson.error || 'Betaling aanmaken mislukt'
                };
            } catch {
                return { success: false, error: 'Interne fout bij het aanmaken van de betaling' };
            }
        }

        const data = await response.json();

        return {
            success: true,
            checkoutUrl: data.checkoutUrl,
            paymentId: data.paymentId
        };

    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.error(`[Action][${activeTraceId}] Timeout calling finance service for payment`);
            return { success: false, error: 'Betaalservice reageert te traag, probeer het later opnieuw' };
        }
        console.error(`[Action][${activeTraceId}] Fatal error calling finance service:`, error.message);
        return { success: false, error: 'Kon geen verbinding maken met de betaalservice' };
    }
}
