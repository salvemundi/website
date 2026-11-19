import 'server-only';

import {
    fetchWithTimeout,
    getFinanceServiceUrl,
    getInternalHeaders,
} from '@/server/internal/activiteiten/activiteiten.utils';
import { safeConsoleError } from '@/server/utils/logger';

export interface FinancePaymentRequest {
    amount: number;
    description: string;
    productName: string;
    registrationId: number;
    registrationType: 'webshop_preorder';
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
    userId: string | null;
    redirectUrl: string;
    idempotencyKey: string;
}

export interface FinancePaymentResult {
    checkoutUrl?: string;
    mollieId?: string;
    accessToken?: string;
}

export interface FinanceApiClient {
    requestPayment(request: FinancePaymentRequest): Promise<FinancePaymentResult>;
}

interface FinanceCreateApiResponse {
    checkoutUrl?: string;
    mollie_id?: string;
    access_token?: string;
}

interface FinanceErrorPayload {
    error?: string;
    message?: string;
}

export class FinanceConfigError extends Error {
    constructor(message = 'Betaalservice niet geconfigureerd.') {
        super(message);
        this.name = 'FinanceConfigError';
    }
}

export class FinanceApiError extends Error {
    readonly retryable: boolean;

    constructor(message: string, retryable: boolean) {
        super(message);
        this.name = 'FinanceApiError';
        this.retryable = retryable;
    }
}

const MAX_PAYMENT_RETRIES = 2;
const RETRY_DELAY_MS = 150;

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export class HttpFinanceApiClient implements FinanceApiClient {
    async requestPayment(request: FinancePaymentRequest): Promise<FinancePaymentResult> {
        const financeServiceUrl = getFinanceServiceUrl();
        if (!financeServiceUrl) {
            throw new FinanceConfigError();
        }

        let lastError: unknown;

        for (let attempt = 0; attempt <= MAX_PAYMENT_RETRIES; attempt += 1) {
            try {
                const response = await fetchWithTimeout(`${financeServiceUrl}/api/finance/create`, {
                    method: 'POST',
                    headers: {
                        ...getInternalHeaders(),
                        'Idempotency-Key': request.idempotencyKey,
                    },
                    body: JSON.stringify({
                        amount: request.amount,
                        description: request.description,
                        productName: request.productName,
                        registrationId: request.registrationId,
                        registrationType: request.registrationType,
                        email: request.email,
                        firstName: request.firstName,
                        lastName: request.lastName,
                        phoneNumber: request.phoneNumber,
                        userId: request.userId,
                        redirectUrl: request.redirectUrl,
                        idempotencyKey: request.idempotencyKey,
                    }),
                });

                if (!response.ok) {
                    const errData = (await response.json().catch(() => ({}))) as FinanceErrorPayload;
                    const retryable = response.status >= 500 || response.status === 429;
                    safeConsoleError('[FinanceApiClient.ts][requestPayment] Finance service error:', errData);
                    throw new FinanceApiError(
                        errData.message || errData.error || 'Betaalverzoek mislukt.',
                        retryable
                    );
                }

                const data = (await response.json()) as FinanceCreateApiResponse;
                return {
                    checkoutUrl: data.checkoutUrl,
                    mollieId: data.mollie_id,
                    accessToken: data.access_token,
                };
            } catch (error: unknown) {
                lastError = error;

                if (error instanceof FinanceApiError && !error.retryable) {
                    throw error;
                }

                if (attempt < MAX_PAYMENT_RETRIES) {
                    await sleep(RETRY_DELAY_MS * (attempt + 1));
                    continue;
                }
            }
        }

        if (lastError instanceof FinanceApiError) {
            throw lastError;
        }

        safeConsoleError('[FinanceApiClient.ts][requestPayment]', lastError);
        throw new FinanceApiError('Interne fout bij starten betaling.', true);
    }
}
