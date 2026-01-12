import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const correlationId = Math.random().toString(36).substring(7);
    console.log(`[Proxy][${correlationId}] Incoming coupon validation request`);

    try {
        const body = await req.json();
        const PAYMENT_API_URL = process.env.PAYMENT_API_URL || process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'http://payment-api:3002';

        const targetUrl = `${PAYMENT_API_URL}/api/coupons/validate`;

        console.log(`[Proxy][${correlationId}] Configured Payment API URL: ${PAYMENT_API_URL}`);
        console.log(`[Proxy][${correlationId}] Forwarding to: ${targetUrl}`);
        console.log(`[Proxy][${correlationId}] Payload:`, JSON.stringify(body));

        // Basic connectivity check log
        try {
            const startTime = Date.now();
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Proxy-Correlation-ID': correlationId
                },
                body: JSON.stringify(body),
                // Add a timeout to avoid hanging if backend is unreachable
                // @ts-ignore - signal might not be in all environments but works in modern Node/Edge
                signal: AbortSignal.timeout(5000)
            });

            const duration = Date.now() - startTime;
            console.log(`[Proxy][${correlationId}] Backend response received in ${duration}ms. Status: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[Proxy][${correlationId}] Backend returned error (${response.status}):`, errorText);

                return NextResponse.json(
                    {
                        error: 'Backend validation failed',
                        status: response.status,
                        details: errorText,
                        _debug: { target: targetUrl, correlationId }
                    },
                    { status: response.status }
                );
            }

            const data = await response.json();
            console.log(`[Proxy][${correlationId}] Successful response from backend:`, JSON.stringify(data));

            return NextResponse.json({
                ...data,
                _debug: { correlationId, proxied: true }
            });

        } catch (fetchError: any) {
            console.error(`[Proxy][${correlationId}] Fetch operation failed:`, {
                message: fetchError.message,
                name: fetchError.name,
                code: fetchError.code
            });
            throw fetchError;
        }

    } catch (error: any) {
        console.error(`[Proxy][${correlationId}] FATAL Proxy Error:`, error);
        return NextResponse.json(
            {
                error: 'Proxy implementation error',
                message: error.message,
                _debug: { correlationId }
            },
            { status: 500 }
        );
    }
}
