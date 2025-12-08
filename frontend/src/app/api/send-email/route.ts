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
        // Use EMAIL_API_ENDPOINT (server-side env var) instead of NEXT_PUBLIC_EMAIL_API_ENDPOINT
        // Default to internal Docker network address for container-to-container communication
        const emailApiEndpoint = process.env.EMAIL_API_ENDPOINT || 'http://email-api:3001/send-email';

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
        
        // Provide more specific error message for network errors
        if (error.cause?.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
            return NextResponse.json(
                { error: 'Unable to connect to email service. Please check if the email-api service is running.' },
                { status: 502 }
            );
        }
        
        return NextResponse.json(
            { error: error.message || 'Failed to send email' },
            { status: 500 }
        );
    }
}
