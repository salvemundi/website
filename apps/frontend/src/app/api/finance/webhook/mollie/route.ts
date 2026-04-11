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
        
        return NextResponse.json({ error: 'Service not configured' }, { status: 500 });
    }

    try {
        const formData = await request.formData();
        const id = formData.get('id');
        const idStr = typeof id === 'string' ? id : null;

        if (!idStr || !idStr.startsWith('tr_')) {
            
            return NextResponse.json({ error: 'Invalid payment ID' }, { status: 400 });
        }

        const response = await fetch(`${financeServiceUrl}/api/finance/webhook/mollie`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Forward the internal token for authentication
                'Authorization': `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`,
            },
            body: JSON.stringify({ id }),
        });

        const text = await response.text();
        return new NextResponse(text, { status: response.status });
    } catch (error) {
        
        // Return 200 to Mollie to prevent retries for internal errors
        return NextResponse.json({ received: true }, { status: 200 });
    }
}
