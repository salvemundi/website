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

        // Get email API endpoint from environment
        const emailApiEndpoint = process.env.NEXT_PUBLIC_EMAIL_API_ENDPOINT || 'https://api.salvemundi.nl/send-email';

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
            console.error('Email API error:', errorText);
            return NextResponse.json(
                { error: `Email service returned status ${response.status}` },
                { status: response.status }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Email API route error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send email' },
            { status: 500 }
        );
    }
}
