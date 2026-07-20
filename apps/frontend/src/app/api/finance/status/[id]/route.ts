import { NextRequest, NextResponse } from 'next/server';
import { getInternalHeaders } from '@/server/internal/activiteiten/activiteiten.utils';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const FINANCE_SERVICE_URL = process.env.FINANCE_SERVICE_URL;

    try {
        const response = await fetch(`${FINANCE_SERVICE_URL}/api/finance/status/${id}`, {
            headers: getInternalHeaders(),
            cache: 'no-store'
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Status check failed' }, { status: response.status });
        }

        const data = (await response.json()) as { payment_status?: string };
        return NextResponse.json({
            status: data.payment_status || 'open',
            payment_status: data.payment_status || 'open'
        });
    } catch {

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
