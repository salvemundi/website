import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        console.log('[trip-email/payment-request] Received request');
        const body = await request.json();
        console.log('[trip-email/payment-request] Request body:', body);
        const { signupId, tripId, paymentType } = body;

        if (!signupId || !tripId || !paymentType) {
            console.log('[trip-email/payment-request] Missing required fields');
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (!['deposit', 'final'].includes(paymentType)) {
            return NextResponse.json(
                { error: 'Invalid payment type' },
                { status: 400 }
            );
        }

        // Use internal email service URL from environment
        const emailServiceUrl = process.env.EMAIL_SERVICE_URL || process.env.EMAIL_API_ENDPOINT || 'http://email-api:3001';
        const directusUrl = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_API_URL || 'http://localhost:8055';
        const directusToken = process.env.DIRECTUS_API_TOKEN || process.env.DIRECTUS_API_KEY || process.env.NEXT_PUBLIC_DIRECTUS_API_KEY;
        const frontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.salvemundi.nl';

        if (!directusToken) {
            throw new Error('DIRECTUS_API_TOKEN or DIRECTUS_API_KEY not configured');
        }

        console.log(`[trip-email/payment-request] Loading signup ${signupId} and trip ${tripId}`);
        console.log(`[trip-email/payment-request] Using directusUrl: ${directusUrl}`);
        console.log(`[trip-email/payment-request] Using emailServiceUrl: ${emailServiceUrl}`);
        console.log(`[trip-email/payment-request] Using frontendUrl: ${frontendUrl}`);

        // Fetch signup data from Directus using internal API proxy with token
        console.log(`[trip-email/payment-request] Fetching signup via internal API`);
        const signupResponse = await fetch(`${frontendUrl}/api/items/trip_signups/${signupId}?fields=id,first_name,middle_name,last_name,email,role,status,deposit_paid,full_payment_paid`, {
            headers: {
                'Authorization': `Bearer ${directusToken}`,
            }
        }).catch(err => {
            console.error(`[trip-email/payment-request] Fetch error for signup:`, err);
            throw err;
        });

        if (!signupResponse.ok) {
            const errorText = await signupResponse.text();
            console.error(`[trip-email/payment-request] Failed to fetch signup: ${signupResponse.status} ${signupResponse.statusText}`, errorText);
            throw new Error(`Failed to fetch signup: ${signupResponse.statusText}`);
        }

        const signupData = await signupResponse.json();
        const tripSignup = signupData.data;

        // Fetch trip data from Directus using internal API proxy with token
        console.log(`[trip-email/payment-request] Fetching trip via internal API`);
        const tripResponse = await fetch(`${frontendUrl}/api/items/trips/${tripId}?fields=id,name,event_date,base_price,deposit_amount,crew_discount,is_bus_trip`, {
            headers: {
                'Authorization': `Bearer ${directusToken}`,
            }
        });

        if (!tripResponse.ok) {
            throw new Error(`Failed to fetch trip: ${tripResponse.statusText}`);
        }

        const tripData = await tripResponse.json();
        const trip = tripData.data;

        console.log(`[trip-email/payment-request] Signup loaded:`, tripSignup?.email);
        console.log(`[trip-email/payment-request] Trip loaded:`, trip?.name);

        if (!tripSignup || !trip) {
            return NextResponse.json(
                { error: 'Signup or trip not found' },
                { status: 404 }
            );
        }

        // Log payment status warnings (but don't block the email)
        if (paymentType === 'deposit' && tripSignup.deposit_paid) {
            console.warn(`[trip-email/payment-request] Warning: Sending deposit request to ${tripSignup.email} who already paid deposit`);
        }

        if (paymentType === 'final' && !tripSignup.deposit_paid) {
            console.warn(`[trip-email/payment-request] Warning: Sending final payment request to ${tripSignup.email} who hasn't paid deposit yet`);
        }

        if (paymentType === 'final' && tripSignup.full_payment_paid) {
            console.warn(`[trip-email/payment-request] Warning: Sending final payment request to ${tripSignup.email} who already paid in full`);
        }

        console.log(`[trip-email/payment-request] Sending ${paymentType} payment request email to ${tripSignup.email}`);

        // Send email via email service
        try {
            await sendTripPaymentRequestEmail(emailServiceUrl, tripSignup, trip, paymentType, frontendUrl);
        } catch (emailError: any) {
            console.error(`[trip-email/payment-request] Email service error:`, emailError);
            throw new Error(`Failed to send email via email service: ${emailError.message}`);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[trip-email/payment-request] Error:', error);
        console.error('[trip-email/payment-request] Error stack:', error.stack);
        return NextResponse.json(
            { error: error.message || 'Failed to send email', details: error.toString() },
            { status: 500 }
        );
    }
}

async function sendTripPaymentRequestEmail(emailServiceUrl: string, tripSignup: any, trip: any, paymentType: string, frontendUrl: string) {
    const fullName = `${tripSignup.first_name} ${tripSignup.middle_name ? tripSignup.middle_name + ' ' : ''}${tripSignup.last_name}`;
    const amount = paymentType === 'deposit' ? Number(trip.deposit_amount) || 0 : 0; // Final amount calculated on frontend
    const paymentUrl = `${frontendUrl}/reis/${paymentType === 'deposit' ? 'aanbetaling' : 'restbetaling'}/${tripSignup.id}`;

    const emailHtml = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7B2CBF;">Betaalverzoek voor ${trip.name}</h2>
            <p>Beste ${fullName},</p>
            <p>Het is tijd om ${paymentType === 'deposit' ? 'de aanbetaling' : 'de restbetaling'} te doen voor je deelname aan <strong>${trip.name}</strong>.</p>
            
            <div style="background-color: #f3f3f3; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                ${paymentType === 'deposit' ? `
                    <p style="font-size: 16px; margin: 0 0 10px 0;">Aanbetalingsbedrag:</p>
                    <p style="font-size: 32px; font-weight: bold; color: #7B2CBF; margin: 0;">€${amount.toFixed(2)}</p>
                ` : `
                    <p style="font-size: 16px; margin: 0 0 10px 0;">Restbetaling</p>
                    <p style="font-size: 14px; color: #666; margin: 0;">Het exacte bedrag zie je na het invullen van je activiteiten</p>
                `}
            </div>

            ${paymentType === 'deposit' ? `
                <p>Na betaling van de aanbetaling kun je:</p>
                <ul>
                    <li>Je voorkeuren opgeven (allergieën, dieetwensen, etc.)</li>
                    <li>Activiteiten selecteren</li>
                    ${trip.is_bus_trip ? '<li>Aangeven of je wilt rijden (indien je een rijbewijs hebt)</li>' : ''}
                </ul>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
                <a href="${paymentUrl}" style="display: inline-block; background: linear-gradient(135deg, #7B2CBF 0%, #FF6B35 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 25px; font-weight: bold; font-size: 16px;">
                    Ga naar betalen
                </a>
            </div>

            <p style="color: #666; font-size: 14px;">
                <strong>Let op:</strong> Deze link is persoonlijk en alleen bedoeld voor jouw aanmelding.
            </p>

            <p style="margin-top: 20px;">Tot snel!</p>
            <p style="margin-top: 10px;"><strong>Het Salve Mundi Reis Team</strong></p>
        </div>
    `;

    // Build the email service URL, avoiding double /send-email
    const emailUrl = emailServiceUrl.endsWith('/send-email') 
        ? emailServiceUrl 
        : `${emailServiceUrl}/send-email`;
    
    console.log(`[sendTripPaymentRequestEmail] Sending to email service: ${emailUrl}`);
    
    const response = await fetch(emailUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            to: tripSignup.email,
            subject: `Betaalverzoek: ${trip.name}`,
            html: emailHtml
        })
    }).catch(err => {
        console.error(`[sendTripPaymentRequestEmail] Fetch error:`, err);
        console.error(`[sendTripPaymentRequestEmail] Attempted URL: ${emailUrl}`);
        throw new Error(`Network error connecting to email service: ${err.message}`);
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send email: ${errorText}`);
    }

    console.log(`✅ Trip payment request (${paymentType}) sent to ${tripSignup.email}`);
}
