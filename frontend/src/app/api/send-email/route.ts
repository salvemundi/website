import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: /api/send-email
 * 
 * This backend route proxies email requests to avoid CORS issues.
 * The frontend calls this route, and this route calls the email service.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { to, from, fromName, subject, html, attachments } = body;

        if (!to || !subject || !html) {
            return NextResponse.json(
                { error: 'Missing required fields: to, subject, html' },
                { status: 400 }
            );
        }



        // Prioritize the server-side internal Docker URL, then public URL, then localhost fallback
        const emailApiEndpoint = process.env.EMAIL_API_ENDPOINT || process.env.NEXT_PUBLIC_EMAIL_API_URL || 'http://localhost:3001/send-email';

        console.log('📧 Sending email request to:', emailApiEndpoint);

        // Call the actual email service from the backend (no CORS issues here)
        const response = await fetch(emailApiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add any authentication headers if needed
                // 'Authorization': `Bearer ${process.env.EMAIL_API_KEY}`
            },
            body: JSON.stringify({
                to,
                from: from || process.env.NEXT_PUBLIC_EMAIL_FROM || 'noreply@salvemundi.nl',
                fromName: fromName || process.env.NEXT_PUBLIC_EMAIL_FROM_NAME || 'Salve Mundi',
                subject,
                html,
                attachments
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Email API error:', {
                status: response.status,
                statusText: response.statusText,
                endpoint: emailApiEndpoint,
                error: errorText
            });
            return NextResponse.json(
                { error: `Email service returned status ${response.status}: ${response.statusText}` },
                { status: response.status }
            );
        }

        console.log('✅ Email sent successfully');
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('❌ Email API route error:', {
            message: error.message,
            name: error.name,
            cause: error.cause,
            stack: error.stack
        });

        // Provide more specific error message for network / DNS errors
        const causeCode = error?.cause?.code;
        if (
            causeCode === 'ECONNREFUSED' ||
            causeCode === 'ENOTFOUND' ||
            (typeof error.message === 'string' && error.message.includes('fetch failed'))
        ) {
            const dnsNote = causeCode === 'ENOTFOUND' ? ' (DNS name not found)' : '';
            return NextResponse.json(
                { error: `Unable to connect to email service. Please check if the email-api service is running and EMAIL_API_ENDPOINT is correct${dnsNote}.` },
                { status: 502 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Failed to send email' },
            { status: 500 }
        );
    }
}
