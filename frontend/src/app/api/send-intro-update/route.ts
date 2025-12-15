import { NextRequest, NextResponse } from 'next/server';

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

        // Fetch intro signups (participants and parents) from Directus using server-side env vars
        const directusUrl = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://admin.salvemundi.nl';
        const directusToken = process.env.DIRECTUS_API_KEY || process.env.NEXT_PUBLIC_DIRECTUS_API_KEY;

        if (!directusToken) {
            console.error('❌ Directus API key not configured (process.env.DIRECTUS_API_KEY)');
            return NextResponse.json({ error: 'Directus API key not configured' }, { status: 500 });
        }

        let participantEmails: string[] = [];
        let parentEmails: string[] = [];

        try {
            const participantsResponse = await fetch(
                `${directusUrl.replace(/\/$/, '')}/items/intro_signups?fields=email&limit=-1`,
                {
                    headers: {
                        'Authorization': `Bearer ${directusToken}`,
                        'Accept': 'application/json'
                    }
                }
            );

            const parentsResponse = await fetch(
                `${directusUrl.replace(/\/$/, '')}/items/intro_parent_signups?fields=email&limit=-1`,
                {
                    headers: {
                        'Authorization': `Bearer ${directusToken}`,
                        'Accept': 'application/json'
                    }
                }
            );

            if (!participantsResponse.ok || !parentsResponse.ok) {
                const pText = await participantsResponse.text().catch(() => 'participants fetch failed');
                const rText = await parentsResponse.text().catch(() => 'parents fetch failed');
                console.error('❌ Directus responses', { participantsStatus: participantsResponse.status, parentsStatus: parentsResponse.status, pText, rText });
                return NextResponse.json({ error: 'Failed to fetch intro signups from Directus' }, { status: 500 });
            }

            const participantsData = await participantsResponse.json();
            const parentsData = await parentsResponse.json();

            participantEmails = (participantsData.data || []).map((p: any) => p.email).filter(Boolean);
            parentEmails = (parentsData.data || []).map((p: any) => p.email).filter(Boolean);
        } catch (error) {
            console.error('❌ Failed to fetch intro signups from Directus:', error);
            return NextResponse.json({ error: 'Failed to fetch intro signups from Directus' }, { status: 500 });
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

        // Get email API endpoint from environment; support multiple env var names used in this repo
        const configuredEndpoint = (
            process.env.EMAIL_API_URL || process.env.EMAIL_API_ENDPOINT || process.env.NEXT_PUBLIC_EMAIL_API_ENDPOINT || process.env.NEXT_PUBLIC_EMAIL_API_URL || 'http://email-api:3001'
        ).replace(/\/$/, '');

        // Resolve blogImage to an absolute URL so email clients can load it
        let resolvedBlogImage: string | null = null;
        if (blogImage) {
            if (/^https?:\/\//i.test(String(blogImage))) {
                resolvedBlogImage = String(blogImage);
            } else {
                // If client generated a relative '/api/...' path (dev), convert to Directus URL
                const directusBase = directusUrl.replace(/\/$/, '');
                const img = String(blogImage);
                if (img.startsWith('/api')) {
                    // strip '/api' and prefix directus base
                    resolvedBlogImage = `${directusBase}${img.replace(/^\/api/, '')}`;
                } else if (img.startsWith('/assets') || img.startsWith('/')) {
                    resolvedBlogImage = `${directusBase}${img}`;
                } else {
                    resolvedBlogImage = `${directusBase}/${img}`;
                }
            }
        }

        // Try the configured endpoint first, then fall back to localhost for local dev
        const endpointsToTry = [configuredEndpoint, 'http://localhost:3001'];

        let response: Response | null = null;
        let lastError: any = null;

        for (const base of endpointsToTry) {
            try {
                // Ensure target URL uses the /send-intro-update path regardless of base path
                let target: string;
                try {
                    const u = new URL(base);
                    u.pathname = '/send-intro-update';
                    target = u.toString();
                } catch (uErr) {
                    // If base isn't a full URL (unlikely), fall back to string concat
                    target = `${base.replace(/\/$/, '')}/send-intro-update`;
                }

                console.log('📧 Posting intro update to email service at:', target);
                response = await fetch(target, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        blogTitle,
                        blogExcerpt,
                        blogUrl,
                        blogImage: resolvedBlogImage || null,
                        subscribers: allEmails.map(email => ({ email }))
                    }),
                });

                // If fetch succeeded (got a response), stop trying other endpoints
                break;
            } catch (err: any) {
                lastError = err;
                const code = err?.cause?.code || err?.code || err?.name;
                console.warn(`Failed to reach email service at ${base}:`, code || err.message || err);
                // try next endpoint
            }
        }

        if (!response) {
            console.error('❌ All email service endpoints failed', lastError);
            return NextResponse.json(
                { error: 'Unable to connect to email service. Check EMAIL_API_ENDPOINT or run email-api locally.' },
                { status: 502 }
            );
        }

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'unable to read body');
            console.error('❌ Email API error:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            });
            return NextResponse.json(
                { error: `Email service returned status ${response.status}: ${response.statusText}`, details: errorText },
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
