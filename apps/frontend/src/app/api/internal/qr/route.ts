import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { timingSafeCompare } from '@salvemundi/validations/security';
import { renderTicketQrPng } from '@/server/internal/qr/qr-server';
import { safeConsoleError } from '@/server/utils/logger';

const qrRequestSchema = z.object({
    value: z.string().trim().min(1).max(1000),
    size: z.number().int().min(120).max(1200).optional(),
});

export async function POST(request: NextRequest) {
    const token = (process.env.INTERNAL_SERVICE_TOKEN || '').replace(/^"|"$/g, '').trim();
    const authHeader = request.headers.get('authorization') || '';

    if (!token || !timingSafeCompare(authHeader, `Bearer ${token}`)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload: unknown;
    try {
        payload = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = qrRequestSchema.safeParse(payload);
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    try {
        const png = await renderTicketQrPng(parsed.data.value, parsed.data.size ?? 440);
        return new NextResponse(new Uint8Array(png), {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'private, no-store',
            },
        });
    } catch (error: unknown) {
        safeConsoleError('[api/internal/qr][POST]', error);
        return NextResponse.json({ error: 'Failed to render QR code' }, { status: 500 });
    }
}
