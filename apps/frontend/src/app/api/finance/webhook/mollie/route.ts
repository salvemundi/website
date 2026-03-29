import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/finance/webhook/mollie
 *
 * Public endpoint — intentionally no auth check here, as Mollie sends this
 * without credentials. The finance-service verifies the payload via its own
 * MOLLIE_WEBHOOK_SECRET header check.
 *
 * Security: only forwards to the internal finance-service over the Docker
 * network (never exposed publicly). The finance-service itself validates
 * the request before processing.
 */
export async function POST(request: NextRequest) {
    const financeServiceUrl = process.env.FINANCE_SERVICE_URL;
    if (!financeServiceUrl) {
        console.error('[webhook/mollie] FINANCE_SERVICE_URL not configured');
        return NextResponse.json({ error: 'Service not configured' }, { status: 500 });
    }

    try {
        const body = await request.text();

        const response = await fetch(`${financeServiceUrl}/api/finance/webhook/mollie`, {
            method: 'POST',
            headers: {
                'Content-Type': request.headers.get('content-type') || 'application/x-www-form-urlencoded',
                // Forward any Mollie-specific headers
                ...(request.headers.get('x-webhook-secret') && {
                    'x-webhook-secret': request.headers.get('x-webhook-secret')!
                }),
            },
            body,
        });

        const text = await response.text();
        return new NextResponse(text, { status: response.status });
    } catch (error) {
        console.error('[webhook/mollie] Failed to forward to finance-service:', error);
        // Return 200 to Mollie to prevent retries for internal errors
        return NextResponse.json({ received: true }, { status: 200 });
    }
}
