import { NextRequest, NextResponse } from 'next/server';
import { directusFetch } from '@/shared/lib/directus';

/**
 * API Route: /api/send-intro-update
 * 
 * This backend route fetches intro signup data from Directus and sends it to the email service.
 * This avoids CORS issues and removes the need for the email-api to access Directus directly.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        const { blogTitle, blogExcerpt, blogUrl, blogImage } = body;

        if (!blogTitle || !blogUrl) {
            return NextResponse.json(
                { error: 'Missing required fields: blogTitle, blogUrl' },
                { status: 400 }
            );
        }

        console.log('📧 Fetching intro signups from Directus...');

        // Fetch intro signups (participants and parents) from Directus
        let participantEmails: string[] = [];
        let parentEmails: string[] = [];

        try {
            // Fetch participant signups
            const participantsData = await directusFetch<Array<{ email: string }>>('/items/intro_signups?fields=email');
            participantEmails = (participantsData || []).map(p => p.email).filter(Boolean);

            // Fetch parent signups
            const parentsData = await directusFetch<Array<{ email: string }>>('/items/intro_parent_signups?fields=email');
            parentEmails = (parentsData || []).map(p => p.email).filter(Boolean);
        } catch (error) {
            console.error('❌ Failed to fetch intro signups from Directus:', error);
            return NextResponse.json(
                { error: 'Failed to fetch intro signups from Directus' },
                { status: 500 }
            );
        }

        // Combine and deduplicate emails
        const allEmails = [...new Set([...participantEmails, ...parentEmails])];

        console.log(`📊 Found ${participantEmails.length} participant emails, ${parentEmails.length} parent emails, ${allEmails.length} unique emails`);

        if (allEmails.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No intro signups found',
                sentCount: 0
            });
        }

        // Get email API endpoint from environment
        const emailApiEndpoint = process.env.EMAIL_API_ENDPOINT || 'http://email-api:3001';

        console.log('📧 Sending intro update to email service:', emailApiEndpoint);

        // Call the email service with the collected emails
        const response = await fetch(`${emailApiEndpoint}/send-intro-update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                blogTitle,
                blogExcerpt,
                blogUrl,
                blogImage,
                subscribers: allEmails.map(email => ({ email }))
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

        const result = await response.json();
        console.log(`✅ Intro update emails sent to ${result.sentCount || allEmails.length} subscribers`);
        
        return NextResponse.json({
            success: true,
            message: 'Intro update emails sent successfully',
            sentCount: result.sentCount || allEmails.length
        });

    } catch (error: any) {
        console.error('❌ API route error:', {
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
            { error: error.message || 'Failed to send intro update notifications' },
            { status: 500 }
        );
    }
}
