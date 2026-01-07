import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const PAYMENT_API_URL = process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'http://payment-api:3002';

        console.log(`[Proxy] Forwarding coupon validation to: ${PAYMENT_API_URL}/api/coupons/validate`);

        const response = await fetch(`${PAYMENT_API_URL}/api/coupons/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`[Proxy] Coupon Validation Failed (${response.status}):`, data);
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[Proxy] Coupon Validation Error:', error);
        return NextResponse.json(
            { error: 'Interne fout bij coupon validatie' },
            { status: 500 }
        );
    }
}
