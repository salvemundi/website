import { NextRequest, NextResponse } from 'next/server';
import { isRateLimited, getClientIp } from '@/shared/lib/rate-limit';


/**
 * API Route: /api/send-email
 * 
 * This backend route proxies email requests to avoid CORS issues.
 * The frontend calls this route, and this route calls the email service.
 */
export async function POST(request: NextRequest) {
    try {
        console.log('📧 /api/send-email: Request received');

        // 1. Rate Limiting (Prevent DoS/Spam)
        const ip = getClientIp(request);
        if (isRateLimited(`email_${ip}`, { windowMs: 60 * 1000, max: 5 })) {
            console.warn(`📧 /api/send-email: Rate limit exceeded for IP: ${ip}`);
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        // 2. Secret Token Verification (Prevent unauthorized relay)
        // If NEXT_PUBLIC_INTERNAL_API_SECRET is set, we require it in the headers.
        const secret = process.env.NEXT_PUBLIC_INTERNAL_API_SECRET;
        const incomingSecret = request.headers.get('x-internal-api-secret');

        if (secret && incomingSecret !== secret) {
            console.error('📧 /api/send-email: Unauthorized access attempt (invalid secret)');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();


        const { to, from, fromName, subject, html, attachments } = body;

        console.log('📧 /api/send-email: Email details:', {
            to,
            from: from || 'default',
            subject,
            hasHtml: !!html,
            htmlLength: html ? html.length : 0,
            attachmentsCount: attachments?.length || 0
        });

        if (!to || !subject || !html) {
            console.error('❌ /api/send-email: Missing required fields');
            return NextResponse.json(
                { error: 'Missing required fields: to, subject, html' },
                { status: 400 }
            );
        }



        // Prioritize the server-side internal Docker URL, then public URL, then localhost fallback
        const emailApiEndpoint = process.env.EMAIL_API_ENDPOINT || process.env.NEXT_PUBLIC_EMAIL_API_URL || 'http://localhost:3001/send-email';

        console.log('📧 /api/send-email: Forwarding to email-api:', emailApiEndpoint);

        // Debug: log attachments summary so we can verify QR payloads are forwarded
        if (attachments && Array.isArray(attachments) && attachments.length > 0) {
            console.log('📎 /api/send-email: Processing', attachments.length, 'attachment(s)');
            try {
                const summary = attachments.map((a: any) => ({
                    name: a.name,
                    contentType: a.contentType,
                    isInline: Boolean(a.isInline),
                    contentId: a.contentId || null,
                    bytesLength: a.contentBytes ? String(a.contentBytes).length : 0,
                    preview: a.contentBytes ? String(a.contentBytes).slice(0, 40) + (String(a.contentBytes).length > 40 ? '...' : '') : null,
                }));
                console.log('📎 /api/send-email: Attachments summary:', JSON.stringify(summary, null, 2));
            } catch (e) {
                console.warn('⚠️ /api/send-email: Unable to summarize attachments:', e);
            }
        } else {
            console.log('📎 /api/send-email: No attachments to process');
        }

        // Call the actual email service from the backend (no CORS issues here)
        const response = await fetch(emailApiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.INTERNAL_API_KEY || '',
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
            console.error('❌ /api/send-email: Email API returned error:', {
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

        const responseData = await response.json().catch(() => ({ success: true }));
        console.log('✅ /api/send-email: Email sent successfully via email-api');
        console.log('📧 /api/send-email: Response from email-api:', responseData);
        return NextResponse.json({ success: true, data: responseData });

    } catch (error: any) {
        console.error('❌ /api/send-email: Unexpected error:', {
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
