import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'alive',
        message: 'Coupon validation proxy is reachable',
        usage: 'POST to this endpoint with { "couponCode": "YOUR_CODE" }'
    });
}

export async function POST(req: NextRequest) {
    const incomingTraceId = req.headers.get('X-Trace-Id');
    const correlationId = incomingTraceId || Math.random().toString(36).substring(7);
    console.warn(`[Proxy][${correlationId}] Starting validation proxy (Trace: ${incomingTraceId ? 'EXISTS' : 'NEW'})`);

    try {
        const body = await req.json();
        const PAYMENT_API_URL = process.env.PAYMENT_API_URL || process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'http://payment-api:3002';
        const targetUrl = `${PAYMENT_API_URL}/api/coupons/validate`;

        console.warn(`[Proxy][${correlationId}] Forwarding to payment-api: ${targetUrl}`);
        console.warn(`[Proxy][${correlationId}] Payload:`, JSON.stringify(body));

        try {
            const startTime = Date.now();
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Trace-Id': correlationId,
                    'X-Proxy-Correlation-ID': correlationId
                },
                body: JSON.stringify(body),
                // @ts-ignore
                signal: AbortSignal.timeout(5000)
            });

            const duration = Date.now() - startTime;
            console.warn(`[Proxy][${correlationId}] Backend responded in ${duration}ms, Status: ${response.status}`);

            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (p) {
                console.warn(`[Proxy][${correlationId}] FATAL: Backend returned non-JSON! Raw body: ${responseText}`);
                return NextResponse.json({
                    error: 'Backend returned invalid format',
                    status: response.status,
                    raw: responseText,
                    _proxied: true,
                    _correlationId: correlationId
                }, { status: 502 });
            }

            if (!response.ok) {
                console.warn(`[Proxy][${correlationId}] Backend validation failed! Error:`, data);
                return NextResponse.json({ ...data, _proxied: true, _correlationId: correlationId }, { status: response.status });
            }

            console.warn(`[Proxy][${correlationId}] Backend success! Data:`, JSON.stringify(data));
            return NextResponse.json({ ...data, _proxied: true, _correlationId: correlationId });

        } catch (fetchError: any) {
            console.error(`[Proxy][${correlationId}] Network/Fetch Error:`, fetchError.message);
            return NextResponse.json({
                error: 'Could not connect to payment-api',
                details: fetchError.message,
                _correlationId: correlationId
            }, { status: 503 });
        }
    } catch (error: any) {
        console.error(`[Proxy][${correlationId}] Internal Proxy error:`, error.message);
        return NextResponse.json({
            error: 'Proxy processing error',
            details: error.message,
            _correlationId: correlationId
        }, { status: 500 });
    }
}
