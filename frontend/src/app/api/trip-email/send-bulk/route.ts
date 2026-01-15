import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tripName, recipients, subject, message } = body;

        if (!tripName || !recipients || !subject || !message) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Forward to payment-api notification service
        const paymentApiUrl = process.env.PAYMENT_API_URL || 'http://localhost:3002';
        const emailServiceUrl = process.env.EMAIL_SERVICE_URL || 'http://localhost:3001';

        const response = await fetch(`${paymentApiUrl}/trip-email/send-bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emailServiceUrl,
                tripName,
                recipients,
                subject,
                message
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to send email: ${errorText}`);
        }

        const result = await response.json();

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error sending bulk email:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send email' },
            { status: 500 }
        );
    }
}
