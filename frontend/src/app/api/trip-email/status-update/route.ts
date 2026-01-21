import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { signupId, tripId, newStatus, oldStatus } = body;

        if (!signupId || !tripId || !newStatus) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Forward to payment-api notification service
        const paymentApiUrl = process.env.PAYMENT_API_URL || 'http://localhost:3002';
        const emailServiceUrl = process.env.EMAIL_SERVICE_URL || 'http://localhost:3001';
        const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_API_URL || 'http://localhost:8055';

        const response = await fetch(`${paymentApiUrl}/trip-email/status-update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emailServiceUrl,
                directusUrl,
                signupId,
                tripId,
                newStatus,
                oldStatus
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to send status update email: ${errorText}`);
        }

        const result = await response.json();

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error sending status update email:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send email' },
            { status: 500 }
        );
    }
}
