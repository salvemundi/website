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

        // Use internal email service URL from environment
        const emailServiceUrl = process.env.EMAIL_SERVICE_URL || process.env.EMAIL_API_ENDPOINT || 'http://email-api:3001';

        console.log(`[trip-email/send-bulk] Sending bulk email to ${recipients.length} recipients for trip: ${tripName}`);

        // Send bulk email
        const result = await sendTripBulkEmail(emailServiceUrl, recipients, subject, message, tripName);

        if (result.success) {
            return NextResponse.json({ success: true, count: result.count });
        } else {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }
    } catch (error: any) {
        console.error('Error sending bulk email:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send email' },
            { status: 500 }
        );
    }
}

async function sendTripBulkEmail(emailServiceUrl: string, recipients: any[], subject: string, message: string, tripName: string) {
    try {
        const recipientEmails = recipients.map(r => r.email).filter(Boolean);

        if (recipientEmails.length === 0) {
            console.warn('No valid recipient emails for bulk email');
            return { success: false, error: 'No valid recipients' };
        }

        const emailHtml = `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #7B2CBF;">${tripName}</h2>
                <div style="line-height: 1.6; color: #333;">
                    ${message.replace(/\n/g, '<br>')}
                </div>
                
                <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
                    Dit bericht is verzonden naar alle deelnemers van ${tripName}.
                </p>

                <p style="margin-top: 20px;">Met vriendelijke groet,</p>
                <p style="margin-top: 10px;"><strong>De ReisCommissie</strong></p>
            </div>
        `;

        const response = await fetch(`${emailServiceUrl}/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.INTERNAL_API_KEY || '',
            },
            body: JSON.stringify({
                to: recipientEmails.join(','), // Send to multiple recipients
                subject: subject,
                html: emailHtml
            }),
            signal: AbortSignal.timeout(30000) // 30 second timeout
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to send email: ${errorText}`);
        }

        console.log(`✅ Bulk email sent to ${recipientEmails.length} recipients for trip: ${tripName}`);
        return { success: true, count: recipientEmails.length };
    } catch (error: any) {
        console.error('❌ Failed to send bulk email:', error.message);
        return { success: false, error: error.message };
    }
}
