import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const PAYMENT_API_URL = process.env.PAYMENT_API_URL || process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'http://payment-api:3002';

        console.log('[Proxy Debug] Incoming coupon validation request');
        console.log('[Proxy Debug] Target:', `${PAYMENT_API_URL}/api/coupons/validate`);
        console.log('[Proxy Debug] Payload:', JSON.stringify(body));

        const response = await fetch(`${PAYMENT_API_URL}/api/coupons/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        console.log('[Proxy Debug] Backend Response Status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Proxy Debug] Backend error text:', errorText);
            return NextResponse.json(
                { error: 'Backend error', details: errorText, status: response.status },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log('[Proxy Debug] Success data:', data);

        return NextResponse.json({
            ...data,
            _debug: { target: `${PAYMENT_API_URL}/api/coupons/validate` }
        });
    } catch (error: any) {
        console.error('[Proxy Debug] FATAL Error:', error);
        return NextResponse.json(
            { error: 'Proxy implementation error', details: error.message, stack: error.stack },
            { status: 500 }
        );
    }
}
