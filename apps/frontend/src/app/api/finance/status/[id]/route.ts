import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const FINANCE_SERVICE_URL = process.env.FINANCE_SERVICE_URL || 'http://finance-service:3001';

    try {
        const response = await fetch(`${FINANCE_SERVICE_URL}/api/finance/status/${id}`, {
            cache: 'no-store'
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Status check failed' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (err) {
        
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
