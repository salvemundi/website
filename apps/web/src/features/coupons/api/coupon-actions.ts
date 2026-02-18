'use server';

const FINANCE_SERVICE_URL = process.env.FINANCE_SERVICE_URL;
const SERVICE_SECRET = process.env.SERVICE_SECRET;

if (!FINANCE_SERVICE_URL) {
    throw new Error('Server configuration error: FINANCE_SERVICE_URL is not defined in environment variables.');
}
if (!SERVICE_SECRET) {
    throw new Error('Server configuration error: SERVICE_SECRET is not defined in environment variables.');
}

export interface CouponValidationResult {
    valid: boolean;
    discount_value?: number;
    discount_type?: string;
    description?: string;
    error?: string;
}

/**
 * Validates a coupon code by calling the finance microservice.
 */
export async function validateCouponAction(couponCode: string, traceId?: string): Promise<CouponValidationResult> {
    const activeTraceId = traceId || Math.random().toString(36).substring(7);

    // Normalize code to uppercase for case-insensitive matching
    const normalizedCode = couponCode.toUpperCase().trim();

    console.info(`[Action][${activeTraceId}] Validating coupon: ${normalizedCode}`);

    if (!SERVICE_SECRET) {
        console.error(`[Action][${activeTraceId}] SERVICE_SECRET is not set!`);
        return { valid: false, error: 'Serverconfiguratie fout' };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
        const response = await fetch(`${FINANCE_SERVICE_URL}/api/coupons/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': SERVICE_SECRET,
                'X-Trace-Id': activeTraceId
            },
            body: JSON.stringify({ couponCode: normalizedCode }),
            cache: 'no-store',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.warn(`[Action][${activeTraceId}] Finance Service Error (${response.status}):`, errorText);

            try {
                const errorJson = JSON.parse(errorText);
                return { valid: false, error: errorJson.error || 'Coupon validatie mislukt' };
            } catch {
                return { valid: false, error: 'Interne fout bij coupon validatie' };
            }
        }

        const data = await response.json();
        console.info(`[Action][${activeTraceId}] Validation complete: ${data.valid ? 'VALID' : 'INVALID'}`);
        return {
            valid: data.valid,
            discount_value: data.discount_value,
            discount_type: data.discount_type,
            description: data.description,
            error: data.error
        };

    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.error(`[Action][${activeTraceId}] Timeout calling finance service`);
            return { valid: false, error: 'Validatie duurde te lang, probeer het opnieuw' };
        }
        console.error(`[Action][${activeTraceId}] Fatal error calling finance service:`, error.message);
        return { valid: false, error: 'Kon geen verbinding maken met de validatie service' };
    }
}
