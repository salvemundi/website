import { NextRequest, NextResponse } from 'next/server';
import { safeConsoleError } from '@/server/utils/logger';

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
                'x-webhook-secret': process.env.MOLLIE_WEBHOOK_SECRET || '',
                'Authorization': `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`,
            },
            body: JSON.stringify({ id })
        });

        const text = await response.text();
        return new NextResponse(text, { status: response.status });
    } catch (error) {
        safeConsoleError('[MollieWebhook][POST]', error);
        return NextResponse.json({ received: true }, { status: 200 });
    }
}