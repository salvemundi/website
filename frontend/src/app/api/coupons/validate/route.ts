import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'alive',
        message: 'Coupon validation proxy is reachable',
        usage: 'POST to this endpoint with { "couponCode": "YOUR_CODE" }'
    });
}

export async function POST(req: NextRequest) {
    const correlationId = Math.random().toString(36).substring(7);
    console.warn(`[Proxy][${correlationId}] Incoming coupon validation POST request`);

    try {
        const body = await req.json();
        const PAYMENT_API_URL = process.env.PAYMENT_API_URL || process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'http://payment-api:3002';

        const targetUrl = `${PAYMENT_API_URL}/api/coupons/validate`;

        console.warn(`[Proxy][${correlationId}] PAYMENT_API_URL: ${PAYMENT_API_URL}`);
        console.warn(`[Proxy][${correlationId}] Forwarding to: ${targetUrl}`);
        console.warn(`[Proxy][${correlationId}] Body:`, JSON.stringify(body));

        try {
            const startTime = Date.now();
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Proxy-Correlation-ID': correlationId
                },
                body: JSON.stringify(body),
                // @ts-ignore
                signal: AbortSignal.timeout(5000)
            });

            const duration = Date.now() - startTime;
            console.warn(`[Proxy][${correlationId}] Backend responded in ${duration}ms with status ${response.status}`);

            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (p) {
                console.warn(`[Proxy][${correlationId}] Backend returned non-JSON!`, responseText);
                return NextResponse.json({
                    error: 'Invalid backend response',
                    status: response.status,
                    details: responseText,
                    _proxied: true
                }, { status: response.status === 200 ? 502 : response.status });
            }

            if (!response.ok) {
                console.warn(`[Proxy][${correlationId}] Backend error!`, data);
                return NextResponse.json({ ...data, _proxied: true }, { status: response.status });
            }

            console.warn(`[Proxy][${correlationId}] Backend success!`, data);
            return NextResponse.json({ ...data, _proxied: true });

        } catch (fetchError: any) {
            console.error(`[Proxy][${correlationId}] Fetch Error:`, fetchError.message);
            return NextResponse.json({ error: 'Backend unreachable', details: fetchError.message }, { status: 503 });
        }
    } catch (error: any) {
        console.error(`[Proxy][${correlationId}] Internal Proxy error:`, error.message);
        return NextResponse.json({ error: 'Proxy internal error', details: error.message }, { status: 500 });
    }
}
