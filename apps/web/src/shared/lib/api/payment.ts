import type { PaymentRequest, PaymentResponse } from './types';

export const paymentApi = {
    create: async (data: PaymentRequest): Promise<PaymentResponse> => {
        let baseUrl = process.env.NEXT_PUBLIC_PAYMENT_API_URL || '/api/payments';

        // Safety check: if baseUrl looks like an internal docker container and we are in browser, revert to proxy
        if ((baseUrl.includes('payment-api:') || baseUrl.includes('localhost:3002')) && typeof window !== 'undefined') {
            console.warn('[PaymentAPI] Detected internal URL in env var, reverting to /api/payments proxy to avoid connection failure.');
            baseUrl = '/api/payments';
        }

        console.log('[PaymentAPI] Sending request to:', `${baseUrl}/create`);

        try {
            const response = await fetch(`${baseUrl}/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Betaling aanmaken mislukt');
            }

            return await response.json();
        } catch (error) {
            console.error('Payment API Error:', error);
            throw error;
        }
    }
};
