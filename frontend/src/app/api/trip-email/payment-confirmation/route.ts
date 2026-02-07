import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        console.log('[trip-email/payment-confirmation] Received request');
        const body = await request.json();
        console.log('[trip-email/payment-confirmation] Request body:', body);
        const { signupId, tripId, paymentType } = body;

        if (!signupId) {
            console.log('[trip-email/payment-confirmation] Missing required fields');
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const emailServiceUrl = process.env.EMAIL_SERVICE_URL || process.env.EMAIL_API_ENDPOINT || 'http://email-api:3001';
        const directusToken = process.env.DIRECTUS_API_TOKEN || process.env.DIRECTUS_API_KEY || process.env.NEXT_PUBLIC_DIRECTUS_API_KEY;
        const frontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.salvemundi.nl';

        if (!directusToken) {
            throw new Error('DIRECTUS_API_TOKEN or DIRECTUS_API_KEY not configured');
        }

        console.log(`[trip-email/payment-confirmation] Loading signup ${signupId} and trip ${tripId || 'unknown'}`);

        // Fetch signup
        const signupResponse = await fetch(`${frontendUrl}/api/items/trip_signups/${signupId}?fields=id,first_name,middle_name,last_name,email,role,status,deposit_paid,full_payment_paid,deposit_paid_at,full_payment_paid_at,trip_id`, {
            headers: { 'Authorization': `Bearer ${directusToken}` }
        });

        if (!signupResponse.ok) {
            const txt = await signupResponse.text();
            console.error('[trip-email/payment-confirmation] Failed to fetch signup', txt);
            throw new Error('Failed to fetch signup');
        }

        const signupData = await signupResponse.json();
        const tripSignup = signupData.data;

        // If tripId wasn't provided, try to derive it from the signup
        let effectiveTripId = tripId;
        if (!effectiveTripId) {
            effectiveTripId = tripSignup.trip_id;
            console.log('[trip-email/payment-confirmation] Derived tripId from signup:', effectiveTripId);
        }

        // Fetch trip
        const tripResponse = await fetch(`${frontendUrl}/api/items/trips/${effectiveTripId}?fields=id,name,event_date,start_date,end_date,base_price,deposit_amount,crew_discount,is_bus_trip`, {
            headers: { 'Authorization': `Bearer ${directusToken}` }
        });

        if (!tripResponse.ok) {
            const txt = await tripResponse.text();
            console.error('[trip-email/payment-confirmation] Failed to fetch trip', txt);
            throw new Error('Failed to fetch trip');
        }

        const tripData = await tripResponse.json();
        const trip = tripData.data;

        if (!tripSignup || !trip) {
            return NextResponse.json({ error: 'Signup or trip not found' }, { status: 404 });
        }

        // Determine payment type if not provided (attempt from signup flags)
        const pType = paymentType || (tripSignup.full_payment_paid ? 'final' : (tripSignup.deposit_paid ? 'deposit' : 'deposit'));

        console.log(`[trip-email/payment-confirmation] Sending ${pType} confirmation to ${tripSignup.email}`);

        await sendTripPaymentConfirmationEmail(emailServiceUrl, tripSignup, trip, pType);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[trip-email/payment-confirmation] Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to send confirmation' }, { status: 500 });
    }
}

async function sendTripPaymentConfirmationEmail(emailServiceUrl: string, tripSignup: any, trip: any, paymentType: string = 'deposit') {
    const fullName = `${tripSignup.first_name} ${tripSignup.middle_name ? tripSignup.middle_name + ' ' : ''}${tripSignup.last_name}`;
    // Normalize numeric values
    const depositAmount = Number(trip.deposit_amount) || 0;

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
            <h2 style="color: #2E7D32;">✓ Betaling ontvangen!</h2>
            <p>Beste ${tripSignup.first_name},</p>
            <p>We hebben je ${paymentType === 'deposit' ? 'aanbetaling' : 'restbetaling'} voor <strong>${trip.name}</strong> ontvangen. Bedankt!</p>

            ${paymentType === 'deposit' ? `
                <div style="background-color: #E3F2FD; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3; margin: 20px 0;">
                    <strong>📋 Volgende stap:</strong><br>
                    Je kunt nu je voorkeuren opgeven en activiteiten selecteren. We sturen je later een betaalverzoek voor de restbetaling.
                </div>
            ` : `
                <div style="background-color: #E8F5E9; padding: 15px; border-radius: 8px; border-left: 4px solid #4CAF50; margin: 20px 0;">
                    <strong>🎉 Je bent helemaal klaar!</strong><br>
                    Je hebt alle betalingen voldaan. We sturen je enkele weken voor vertrek meer informatie over de reis.
                </div>
            `}

            <div style="background-color: #f3f3f3; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Reisdetails:</h3>
                <p style="margin: 5px 0;"><strong>Reis:</strong> ${trip.name}</p>
                <p style="margin: 5px 0;"><strong>Datum:</strong> ${dateDisplay}</p>
                <p style="margin: 5px 0;"><strong>Deelnemer:</strong> ${fullName}</p>
                ${paymentType === 'deposit' ? `<p style="margin: 5px 0;"><strong>Aanbetalingsbedrag:</strong> €${depositAmount.toFixed(2)}</p>` : ''}
            </div>

            <p>We kijken ernaar uit!</p>
            <p style="margin-top: 10px;"><strong>De ReisCommissie</strong></p>
        </div>
    `;

    const emailUrl = emailServiceUrl.endsWith('/send-email') ? emailServiceUrl : `${emailServiceUrl}/send-email`;
    console.log(`[sendTripPaymentConfirmationEmail] Sending to email service: ${emailUrl}`);

    const response = await fetch(emailUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.INTERNAL_API_KEY || '',
        },
        body: JSON.stringify({ to: tripSignup.email, subject: `Betaling ontvangen: ${trip.name}`, html: emailHtml })
    }).catch(err => {
        console.error('[sendTripPaymentConfirmationEmail] Fetch error:', err);
        throw new Error(`Network error connecting to email service: ${err.message}`);
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[sendTripPaymentConfirmationEmail] Email service responded:', errorText);
        throw new Error(`Failed to send confirmation email: ${errorText}`);
    }

    console.log(`✅ Trip payment confirmation (${paymentType}) sent to ${tripSignup.email}`);
}
