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

        // Use internal email service URL from environment
        const emailServiceUrl = process.env.EMAIL_SERVICE_URL || process.env.EMAIL_API_ENDPOINT || 'http://email-api:3001';
        const directusUrl = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_API_URL || 'http://localhost:8055';
        const directusToken = process.env.DIRECTUS_API_TOKEN;

        if (!directusToken) {
            throw new Error('DIRECTUS_API_TOKEN not configured');
        }

        console.log(`[trip-email/status-update] Loading signup ${signupId} and trip ${tripId}`);

        // Fetch signup data from Directus
        const signupResponse = await fetch(`${directusUrl}/items/trip_signups/${signupId}?fields=id,first_name,middle_name,last_name,email,role,status`, {
            headers: {
                'Authorization': `Bearer ${directusToken}`,
            }
        });

        if (!signupResponse.ok) {
            throw new Error(`Failed to fetch signup: ${signupResponse.statusText}`);
        }

        const signupData = await signupResponse.json();
        const tripSignup = signupData.data;

        // Fetch trip data from Directus
        const tripResponse = await fetch(`${directusUrl}/items/trips/${tripId}?fields=id,name,event_date,start_date,end_date,base_price,deposit_amount,crew_discount`, {
            headers: {
                'Authorization': `Bearer ${directusToken}`,
            }
        });

        if (!tripResponse.ok) {
            throw new Error(`Failed to fetch trip: ${tripResponse.statusText}`);
        }

        const tripData = await tripResponse.json();
        const trip = tripData.data;

        if (!tripSignup || !trip) {
            return NextResponse.json(
                { error: 'Signup or trip not found' },
                { status: 404 }
            );
        }

        console.log(`[trip-email/status-update] Sending status update email to ${tripSignup.email}`);

        // Send email via email service
        await sendTripStatusUpdateEmail(emailServiceUrl, tripSignup, trip, newStatus, oldStatus);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error sending status update email:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send email' },
            { status: 500 }
        );
    }
}

async function sendTripStatusUpdateEmail(emailServiceUrl: string, tripSignup: any, trip: any, newStatus: string, oldStatus: string) {
    const statusMessages: Record<string, { title: string; color: string; message: string }> = {
        confirmed: { title: 'Je aanmelding is bevestigd! ✓', color: '#4CAF50', message: 'Je deelname aan de reis is bevestigd.' },
        waitlist: { title: 'Je staat op de wachtlijst', color: '#FFC107', message: 'Je staat op de wachtlijst. We laten het je weten zodra er een plek vrijkomt.' },
        cancelled: { title: 'Je aanmelding is geannuleerd', color: '#F44336', message: 'Je aanmelding is geannuleerd. Neem contact met ons op als dit niet klopt.' },
    };

    const statusInfo = statusMessages[newStatus] || { title: 'Status update', color: '#7B2CBF', message: `Je status is gewijzigd naar: ${newStatus}` };

    // Date formatting logic
    const displayStartDate = trip.start_date || trip.event_date;
    let dateDisplay = 'Datum onbekend';

    if (displayStartDate) {
        const start = new Date(displayStartDate);
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

        if (trip.end_date) {
            const end = new Date(trip.end_date);
            dateDisplay = `${start.toLocaleDateString('nl-NL', options)} t/m ${end.toLocaleDateString('nl-NL', options)}`;
        } else {
            dateDisplay = start.toLocaleDateString('nl-NL', options);
        }
    }

    const emailHtml = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <h2 style="color: ${statusInfo.color};">${statusInfo.title}</h2>
            <p>Beste ${tripSignup.first_name},</p>
            <p>${statusInfo.message}</p>
            
            <div style="background-color: #f3f3f3; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Reis:</strong> ${trip.name}</p>
                <p style="margin: 5px 0;"><strong>Datum:</strong> ${dateDisplay}</p>
                <p style="margin: 5px 0;"><strong>Status:</strong> ${newStatus}</p>
            </div>

            <p>Heb je vragen? Neem dan contact met ons op via <a href="mailto:info@salvemundi.nl" style="color: #7B2CBF;">info@salvemundi.nl</a></p>

            <p style="margin-top: 20px;">Met vriendelijke groet,</p>
            <p style="margin-top: 10px;"><strong>De ReisCommissie</strong></p>
        </div>
    `;

    const response = await fetch(`${emailServiceUrl}/send-email`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            to: tripSignup.email,
            subject: `Status update: ${trip.name}`,
            html: emailHtml
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send email: ${errorText}`);
    }

    console.log(`✅ Trip status update email sent to ${tripSignup.email}: ${oldStatus} → ${newStatus}`);
}
