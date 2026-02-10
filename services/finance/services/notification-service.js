const axios = require('axios');
const QRCode = require('qrcode');
const directusService = require('./directus-service');

function formatTripDate(trip) {
    if (!trip) return 'Datum n.t.b.';
    const start = trip.start_date || trip.event_date;
    const end = trip.end_date;

    if (!start) return 'Datum n.t.b.';

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const startDate = new Date(start);

    if (isNaN(startDate.getTime())) return 'Datum n.t.b.';

    if (end && end !== start) {
        const endDate = new Date(end);
        if (!isNaN(endDate.getTime())) {
            return `${startDate.toLocaleDateString('nl-NL', options)} t/m ${endDate.toLocaleDateString('nl-NL', options)}`;
        }
    }

    return startDate.toLocaleDateString('nl-NL', options);
}

async function sendConfirmationEmail(directusUrl, directusToken, emailServiceUrl, metadata, description) {
    if (!metadata || !metadata.email || metadata.email === 'null') {
        console.log('[NotificationService] Skipping email: no valid email address');
        return;
    }

    console.log('[NotificationService] Starting sendConfirmationEmail for:', metadata.email);
    console.log('[NotificationService] Metadata:', JSON.stringify(metadata, null, 2));

    try {
        let attachments = [];
        let qrHtml = '';
        let participantName = null;
        let activityName = description;
        if (activityName.startsWith('Inschrijving ')) {
            activityName = activityName.substring('Inschrijving '.length);
        } else if (activityName.startsWith('Betaling Inschrijving - ')) {
            activityName = activityName.substring('Betaling Inschrijving - '.length);
        }

        let eventDetails = null;

        if (metadata.registrationId) {
            console.log('[NotificationService] Fetching registration with ID:', metadata.registrationId);
            // Determine collection based on registration type
            const collection = metadata.registrationType === 'pub_crawl_signup' ? 'pub_crawl_signups' : 'event_signups';

            // Fetch registration info including possible event IDs and amount_tickets for pub crawl
            const fields = collection === 'pub_crawl_signups'
                ? 'qr_token,participant_name,name,event_id,pub_crawl_event_id,amount_tickets,name_initials'
                : 'qr_token,participant_name,name,event_id,pub_crawl_event_id';

            const registration = await directusService.getDirectusItem(
                directusUrl,
                directusToken,
                collection,
                metadata.registrationId,
                fields
            );

            console.log('[NotificationService] Registration fetched:', {
                hasRegistration: !!registration,
                qr_token: registration?.qr_token || 'MISSING',
                participant_name: registration?.participant_name || registration?.name || 'unknown'
            });

            if (registration) {
                participantName = registration.participant_name || registration.name;

                // Use QR token from metadata if available (preferred), otherwise from registration
                const qrTokenToUse = metadata.qrToken || registration.qr_token;
                console.log('[NotificationService] QR Token source:', {
                    fromMetadata: !!metadata.qrToken,
                    fromRegistration: !!registration.qr_token,
                    using: qrTokenToUse ? 'FOUND' : 'NONE'
                });

                // Try to fetch event details (either from 'events' or 'pub_crawl_events')
                const eventId = registration.event_id || registration.pub_crawl_event_id;
                const eventCollection = registration.pub_crawl_event_id ? 'pub_crawl_events' : 'events';

                if (eventId) {
                    try {
                        // event_id might be a number or an object depending on Directus config
                        const eid = typeof eventId === 'object' ? eventId.id : eventId;
                        eventDetails = await directusService.getDirectusItem(
                            directusUrl,
                            directusToken,
                            eventCollection,
                            eid,
                            'name,event_date,event_time,price_members,price_non_members,date'
                        );
                    } catch (err) {
                        console.warn("[NotificationService] Failed to fetch event details for richer email:", err.message);
                    }
                }

                // Use qrTokenToUse instead of registration.qr_token
                if (qrTokenToUse) {
                    console.log('[NotificationService] ✅ QR token found:', qrTokenToUse);

                    // Generate single QR code for all registrations
                    console.log('[NotificationService] Generating QR code with token:', qrTokenToUse);

                    const qrDataUrl = await QRCode.toDataURL(qrTokenToUse, {
                        color: { dark: '#7B2CBF', light: '#FFFFFF' },
                        width: 300
                    });
                    const base64Data = qrDataUrl.split(',')[1];
                    console.log('[NotificationService] QR code generated, base64 length:', base64Data.length);

                    const contentId = 'qrcode-image';
                    attachments.push({
                        name: 'ticket-qr.png',
                        contentType: 'image/png',
                        contentBytes: base64Data,
                        isInline: true,
                        contentId: contentId
                    });

                    const isPubCrawl = collection === 'pub_crawl_signups';
                    const ticketCount = isPubCrawl ? (registration.amount_tickets || 1) : 1;

                    qrHtml = `
                        <div style="margin: 20px 0; text-align: center;">
                            <h3 style="color: #7B2CBF; text-align: center; margin-bottom: 20px;">Jouw Toegangsticket${ticketCount > 1 ? 's' : ''}</h3>
                            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 12px; border: 2px dashed #7B2CBF; display: inline-block;">
                                <img src="cid:${contentId}" alt="QR Ticket" style="width: 200px; height: 200px; border-radius: 8px;" />
                                <p style="font-size: 11px; color: #999; margin-bottom: 0;">Ticket ID: ${qrTokenToUse}</p>
                                ${ticketCount > 1 ? `<p style="font-size: 13px; color: #7B2CBF; margin-top: 10px; font-weight: bold;">Geldig voor ${ticketCount} personen</p>` : ''}
                            </div>
                        </div>
                    `;

                    console.log('[NotificationService] ✅ QR code attachment added');
                } else {
                    console.warn('[NotificationService] ⚠️ No QR token found in metadata or registration!');
                }
            } else {
                // No registration found, but we might still have QR token in metadata
                if (metadata.qrToken) {
                    console.log('[NotificationService] ✅ QR token found in metadata (no registration):', metadata.qrToken);
                    console.log('[NotificationService] Generating QR code...');
                    const qrDataUrl = await QRCode.toDataURL(metadata.qrToken, {
                        color: { dark: '#7B2CBF', light: '#FFFFFF' },
                        width: 300
                    });
                    const base64Data = qrDataUrl.split(',')[1];

                    console.log('[NotificationService] QR code generated, base64 length:', base64Data.length);

                    attachments.push({
                        name: 'ticket-qr.png',
                        contentType: 'image/png',
                        contentBytes: base64Data,
                        isInline: true,
                        contentId: 'qrcode-image'
                    });

                    console.log('[NotificationService] ✅ QR attachment added to attachments array (from metadata)');

                    qrHtml = `
                        <div style="margin: 20px 0; text-align: center; background-color: #f9f9f9; padding: 20px; border-radius: 12px; border: 2px dashed #7B2CBF;">
                            <p style="font-weight: bold; color: #7B2CBF; margin-top: 0;">Jouw Toegangsticket</p>
                            <img src="cid:qrcode-image" alt="QR Ticket" style="width: 200px; height: 200px; border-radius: 8px;" />
                            <p style="font-size: 11px; color: #999; margin-bottom: 0;">Ticket ID: ${metadata.qrToken}</p>
                        </div>
                    `;
                } else {
                    console.warn('[NotificationService] ⚠️ No registration found and no QR token in metadata!');
                }
            }
        }

        const greetingName = participantName || 'deelnemer';

        console.log('[NotificationService] Preparing to send email with', attachments.length, 'attachment(s)');
        if (attachments.length > 0) {
            console.log('[NotificationService] Attachments:', attachments.map(a => ({
                name: a.name,
                contentType: a.contentType,
                isInline: a.isInline,
                contentId: a.contentId,
                bytesLength: a.contentBytes?.length || 0
            })));
        }

        // Build extra details if event details were found
        let detailsHtml = '';
        if (eventDetails) {
            const rawDate = eventDetails.event_date || eventDetails.date;
            const dateStr = rawDate ? new Date(rawDate).toLocaleDateString('nl-NL', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : null;

            const timeStr = eventDetails.event_time ? eventDetails.event_time.substring(0, 5) : null;

            detailsHtml = `
                <div style="background-color: #F5F5DC; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Evenement:</strong> ${eventDetails.name || activityName}</p>
                    ${dateStr ? `<p style="margin: 5px 0;"><strong>Datum:</strong> ${dateStr}</p>` : ''}
                    ${timeStr ? `<p style="margin: 5px 0;"><strong>Tijd:</strong> ${timeStr}</p>` : ''}
                </div>
            `;
        }

        // 1. Send Email to Participant
        if (metadata.registrationType !== 'pub_crawl_signup') {
            console.log('[NotificationService] Sending confirmation email to participant...');
            console.log('[NotificationService] Email details:', {
                to: metadata.email,
                subject: `Ticket: ${activityName}`,
                attachmentsCount: attachments.length
            });

            await axios.post(`${emailServiceUrl}/send-email`, {
                to: metadata.email,
                subject: `Ticket: ${activityName}`,
                html: `
                    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.5;">
                        <h2 style="color: #7B2CBF; border-bottom: 2px solid #7B2CBF; padding-bottom: 10px;">Bedankt voor je inschrijving!</h2>
                        <p>Beste ${greetingName},</p>
                        <p>Je betaling voor <strong>${activityName}</strong> is succesvol ontvangen. Je inschrijving is nu definitief.</p>
                        
                        ${detailsHtml}
                        
                        ${qrHtml ? `
                            <p>Hieronder vind je je persoonlijke QR-code. Laat deze scannen bij de commissieleden voor toegang.</p>
                            ${qrHtml}
                        ` : ''}
                        
                        <p style="margin-top: 25px;">Veel plezier!</p>
                        <p style="margin-top: 10px; margin-bottom: 0;">Met vriendelijke groet,</p>
                        <p style="margin-top: 0;"><strong>S.A. Salve Mundi</strong></p>
                        
                        <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px; font-size: 12px; color: #888; text-align: center;">
                            <p>Dit is een automatische bevestiging van je betaling.</p>
                        </div>
                    </div>
                `,
                attachments: attachments
            }, { headers: { 'x-api-key': process.env.INTERNAL_API_KEY }, timeout: 10000 });

            console.log(`[NotificationService] ✅ Confirmation email sent to ${metadata.email} for ${activityName}`);
        } else {
            console.log(`[NotificationService] Skipping participant email for pub_crawl_signup (will be sent by frontend with tickets)`);
        }

        // 2. Notify Organization (Best effort)
        try {
            const orgEmail = process.env.EMAIL_FROM || 'noreply@salvemundi.nl';
            await axios.post(`${emailServiceUrl}/send-email`, {
                to: orgEmail,
                subject: `Nieuwe betaling: ${activityName} - ${greetingName}`,
                html: `
                    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #7B2CBF;">Nieuwe betaalde aanmelding</h2>
                        <p>Er is een nieuwe betaalde aanmelding binnengekomen voor een activiteit:</p>
                        <div style="background-color: #f3f3f3; padding: 15px; border-radius: 8px;">
                            <p><strong>Activiteit:</strong> ${activityName}</p>
                            <p><strong>Deelnemer:</strong> ${greetingName}</p>
                            <p><strong>E-mail:</strong> ${metadata.email}</p>
                            <p><strong>Bedrag paid:</strong> ${metadata.amount || 'onbekend'}</p>
                        </div>
                    </div>
                `
            }, { headers: { 'x-api-key': process.env.INTERNAL_API_KEY }, timeout: 10000 });
            console.log(`[NotificationService] Organization notified for ${activityName}`);
        } catch (orgErr) {
            console.warn("[NotificationService] Failed to notify organization:", orgErr.message);
        }

    } catch (error) {
        console.error("❌ Failed to send confirmation email:", error.message);
    }
}

async function sendWelcomeEmail(emailServiceUrl, email, firstName, credentials) {
    try {
        await axios.post(`${emailServiceUrl}/send-email`, {
            to: email,
            subject: `Welkom bij Salve Mundi! - Je accountgegevens`,
            html: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #7B2CBF;">Welkom bij Salve Mundi, ${firstName}!</h2>
                    <p>Je inschrijving en betaling zijn goed ontvangen. We hebben direct een account voor je aangemaakt.</p>
                    
                    <div style="background-color: #f3f3f3; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Je inloggegevens:</h3>
                        <p><strong>Gebruikersnaam:</strong> ${credentials.upn}</p>
                        <p><strong>Tijdelijk Wachtwoord:</strong> ${credentials.password}</p>
                    </div>

                    <p>Log in op <a href="https://myaccount.microsoft.com/" style="color: #7B2CBF;">Microsoft My Account</a> om je wachtwoord direct te wijzigen.</p>
                    <p>Met dit account heb je toegang tot de Salve Mundi website en andere diensten.</p>

                    <p style="margin-top: 20px;">Tot snel bij onze activiteiten!</p>
                    <p style="margin-top: 10px;">Met vriendelijke groet,</p>
                    <p style="margin-top: 0;"><strong>S.A. Salve Mundi</strong></p>
                </div>
            `
        }, { headers: { 'x-api-key': process.env.INTERNAL_API_KEY }, timeout: 10000 });
        console.log(`[NotificationService] ✅ Welcome email sent to ${email}`);

    } catch (error) {
        console.error("❌ Failed to send welcome email:", error.message);
    }
}

// Trip-specific email functions
async function sendTripSignupConfirmation(emailServiceUrl, tripSignup, trip) {
    try {
        const fullName = `${tripSignup.first_name} ${tripSignup.middle_name ? tripSignup.middle_name + ' ' : ''}${tripSignup.last_name}`;

        await axios.post(`${emailServiceUrl}/send-email`, {
            to: tripSignup.email,
            subject: `Aanmelding ontvangen: ${trip.name}`,
            html: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #7B2CBF;">Bedankt voor je aanmelding!</h2>
                    <p>Beste ${tripSignup.first_name},</p>
                    <p>Je aanmelding voor <strong>${trip.name}</strong> is succesvol ontvangen${tripSignup.status === 'waitlist' ? ' en je staat op de <strong>wachtlijst</strong>' : ''}.</p>
                    
                    ${tripSignup.status === 'waitlist' ? `
                        <div style="background-color: #FFF3CD; padding: 15px; border-radius: 8px; border-left: 4px solid #FFC107; margin: 20px 0;">
                            <strong>⚠️ Wachtlijst</strong><br>
                            Je staat momenteel op de wachtlijst. We laten je weten zodra er een plek vrijkomt!
                        </div>
                    ` : `
                        <div style="background-color: #f3f3f3; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Volgende stappen:</h3>
                            <ol style="margin: 0; padding-left: 20px;">
                                <li style="margin-bottom: 10px;">Je ontvangt binnenkort een betaalverzoek voor de aanbetaling van <strong>€${trip.deposit_amount.toFixed(2)}</strong></li>
                                <li style="margin-bottom: 10px;">Na betaling van de aanbetaling kun je je voorkeuren opgeven en activiteiten selecteren</li>
                                <li>De restbetaling volgt dichter bij de reisdatum</li>
                            </ol>
                        </div>
                    `}
                    
                    <div style="background-color: #E8F5E9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #2E7D32;">Reisdetails:</h3>
                        <p style="margin: 5px 0;"><strong>Reis:</strong> ${trip.name}</p>
                        <p style="margin: 5px 0;"><strong>Datum:</strong> ${formatTripDate(trip)}</p>
                        <p style="margin: 5px 0;"><strong>Totaalprijs:</strong> €${trip.base_price.toFixed(2)}${tripSignup.role === 'crew' ? ` (excl. crew korting van €${trip.crew_discount.toFixed(2)})` : ''}</p>
                        <p style="margin: 5px 0;"><strong>Aanbetaling:</strong> €${trip.deposit_amount.toFixed(2)}</p>
                    </div>

                    <p style="color: #666; font-size: 14px; margin-top: 30px;">
                        Heb je vragen? Neem dan contact met ons op via <a href="mailto:info@salvemundi.nl" style="color: #7B2CBF;">info@salvemundi.nl</a>
                    </p>

                    <p style="margin-top: 20px;">We kijken ernaar uit om samen met jou op reis te gaan!</p>
                    <p style="margin-top: 10px;"><strong>De ReisCommissie</strong></p>
                </div>
            `
        }, { headers: { 'x-api-key': process.env.INTERNAL_API_KEY }, timeout: 10000 });

        console.log(`✅ Trip signup confirmation sent to ${tripSignup.email}`);
    } catch (error) {
        console.error("❌ Failed to send trip signup confirmation:", error.message);
    }
}

async function sendTripPaymentRequest(emailServiceUrl, tripSignup, trip, paymentType = 'deposit') {
    try {
        const fullName = `${tripSignup.first_name} ${tripSignup.middle_name ? tripSignup.middle_name + ' ' : ''}${tripSignup.last_name}`;
        const amount = paymentType === 'deposit' ? trip.deposit_amount : 0; // Final amount calculated on frontend
        const paymentUrl = `${process.env.FRONTEND_URL || 'https://salvemundi.nl'}/reis/${paymentType === 'deposit' ? 'aanbetaling' : 'restbetaling'}/${tripSignup.id}`;

        await axios.post(`${emailServiceUrl}/send-email`, {
            to: tripSignup.email,
            subject: `Betaalverzoek: ${trip.name}`,
            html: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #7B2CBF;">Betaalverzoek voor ${trip.name}</h2>
                    <p>Beste ${tripSignup.first_name},</p>
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
                    <p style="margin-top: 10px;"><strong>De ReisCommissie</strong></p>
                </div>
            `
        }, { headers: { 'x-api-key': process.env.INTERNAL_API_KEY }, timeout: 10000 });

        console.log(`✅ Trip payment request (${paymentType}) sent to ${tripSignup.email}`);
    } catch (error) {
        console.error(`❌ Failed to send trip payment request (${paymentType}):`, error.message);
    }
}

async function sendTripPaymentConfirmation(emailServiceUrl, tripSignup, trip, paymentType = 'deposit') {
    console.log('[NotificationService] Starting sendTripPaymentConfirmation');
    console.log('[NotificationService] Trip signup:', { id: tripSignup.id, email: tripSignup.email });
    console.log('[NotificationService] Trip:', { id: trip.id, name: trip.name });
    console.log('[NotificationService] Payment type:', paymentType);

    try {
        const fullName = `${tripSignup.first_name} ${tripSignup.middle_name ? tripSignup.middle_name + ' ' : ''}${tripSignup.last_name}`;

        console.log('[NotificationService] Sending email to:', tripSignup.email);
        console.log('[NotificationService] Email service URL:', emailServiceUrl);

        // Try to fetch selected activities for this signup so we can include them in the email
        let activitiesHtml = '';
        try {
            if (tripSignup.id) {
                const selected = await directusService.getTripSignupActivities(process.env.DIRECTUS_URL, process.env.DIRECTUS_API_TOKEN, tripSignup.id);
                console.log('[NotificationService] Selected activities count:', selected.length);
                if (selected && selected.length > 0) {
                    // Map activity objects to readable list. trip_activity_id may be expanded object
                    const names = selected.map(s => {
                        const a = s.trip_activity_id;
                        if (!a) return 'Onbekende activiteit';
                        let name = a.name || a.title || `Activiteit ${a.id || ''}`;

                        // Add options if present
                        if (s.selected_options && Array.isArray(s.selected_options) && a.options) {
                            const optNames = [];
                            s.selected_options.forEach(optName => {
                                const optDef = a.options.find(o => o.name === optName);
                                if (optDef) optNames.push(optName);
                            });
                            if (optNames.length > 0) {
                                name += ` (+ ${optNames.join(', ')})`;
                            }
                        }
                        return name;
                    }).map(n => (n || '').trim()).filter(Boolean);

                    // Remove duplicates while preserving order
                    const uniqueNames = Array.from(new Set(names));

                    activitiesHtml = `
                        <div style="background-color: #FFF7E6; padding: 12px; border-radius: 8px; margin: 20px 0;">
                            <h4 style="margin: 0 0 8px 0;">Geselecteerde activiteiten</h4>
                            <ul style="margin:0; padding-left: 18px;">
                                ${uniqueNames.map(n => `<li>${n}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                }
            }
        } catch (actErr) {
            console.warn('[NotificationService] Failed to fetch selected activities:', actErr.message || actErr);
        }

        await axios.post(`${emailServiceUrl}/send-email`, {
            to: tripSignup.email,
            subject: `Betaling ontvangen: ${trip.name}`,
            html: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2E7D32;">✓ Betaling ontvangen!</h2>
                    <p>Beste ${tripSignup.first_name},</p>
                    <p>We hebben je ${paymentType === 'deposit' ? 'aanbetaling' : 'restbetaling'} voor <strong>${trip.name}</strong> ontvangen. Bedankt!</p>
                    
                    ${paymentType === 'deposit' ? `
                        <div style="background-color: #E3F2FD; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3; margin: 20px 0;">
                             Hieronder zie je de activiteiten die je tijdens de aanmelding hebt geselecteerd.
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
                        <p style="margin: 5px 0;"><strong>Datum:</strong> ${formatTripDate(trip)}</p>
                        <p style="margin: 5px 0;"><strong>Deelnemer:</strong> ${fullName}</p>
                    </div>

                    ${activitiesHtml}
                    <p>We kijken ernaar uit!</p>
                    <p style="margin-top: 10px;"><strong>De ReisCommissie</strong></p>
                </div>
            `
        }, { headers: { 'x-api-key': process.env.INTERNAL_API_KEY }, timeout: 10000 });

        console.log(`✅ [NotificationService] Trip payment confirmation (${paymentType}) sent successfully to ${tripSignup.email}`);
    } catch (error) {
        console.error(`❌ [NotificationService] Failed to send trip payment confirmation (${paymentType}):`, error.message);
        if (error.response) {
            console.error(`❌ [NotificationService] Response status:`, error.response.status);
            console.error(`❌ [NotificationService] Response data:`, error.response.data);
        }
        throw error; // Re-throw to let caller know it failed
    }
}

async function sendTripStatusUpdate(emailServiceUrl, tripSignup, trip, newStatus, oldStatus) {
    try {
        const statusMessages = {
            confirmed: { title: 'Je aanmelding is bevestigd! ✓', color: '#4CAF50', message: 'Je deelname aan de reis is bevestigd.' },
            waitlist: { title: 'Je staat op de wachtlijst', color: '#FFC107', message: 'Je staat op de wachtlijst. We laten het je weten zodra er een plek vrijkomt.' },
            cancelled: { title: 'Je aanmelding is geannuleerd', color: '#F44336', message: 'Je aanmelding is geannuleerd. Neem contact met ons op als dit niet klopt.' },
        };

        const statusInfo = statusMessages[newStatus] || { title: 'Status update', color: '#7B2CBF', message: `Je status is gewijzigd naar: ${newStatus}` };

        await axios.post(`${emailServiceUrl}/send-email`, {
            to: tripSignup.email,
            subject: `Status update: ${trip.name}`,
            html: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: ${statusInfo.color};">${statusInfo.title}</h2>
                    <p>Beste ${tripSignup.first_name},</p>
                    <p>${statusInfo.message}</p>
                    
                    <div style="background-color: #f3f3f3; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Reis:</strong> ${trip.name}</p>
                        <p style="margin: 5px 0;"><strong>Datum:</strong> ${formatTripDate(trip)}</p>
                        <p style="margin: 5px 0;"><strong>Status:</strong> ${newStatus}</p>
                    </div>

                    <p>Heb je vragen? Neem dan contact met ons op via <a href="mailto:info@salvemundi.nl" style="color: #7B2CBF;">info@salvemundi.nl</a></p>

                    <p style="margin-top: 20px;">Met vriendelijke groet,</p>
                    <p style="margin-top: 10px;"><strong>De ReisCommissie</strong></p>
                </div>
            `
        }, { headers: { 'x-api-key': process.env.INTERNAL_API_KEY }, timeout: 10000 });

        console.log(`✅ Trip status update sent to ${tripSignup.email}: ${oldStatus} → ${newStatus}`);
    } catch (error) {
        console.error("❌ Failed to send trip status update:", error.message);
    }
}

async function sendTripBulkEmail(emailServiceUrl, recipients, subject, message, tripName) {
    try {
        const recipientEmails = recipients.map(r => r.email).filter(Boolean);

        if (recipientEmails.length === 0) {
            console.warn('No valid recipient emails for bulk email');
            return { success: false, error: 'No valid recipients' };
        }

        await axios.post(`${emailServiceUrl}/send-email`, {
            to: recipientEmails.join(','), // Send to multiple recipients
            subject: subject,
            html: `
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
            `
        }, { headers: { 'x-api-key': process.env.INTERNAL_API_KEY }, timeout: 30000 });

        console.log(`✅ Bulk email sent to ${recipientEmails.length} recipients for trip: ${tripName}`);
        return { success: true, count: recipientEmails.length };
    } catch (error) {
        console.error("❌ Failed to send bulk email:", error.message);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendConfirmationEmail,
    sendWelcomeEmail,
    sendTripSignupConfirmation,
    sendTripPaymentRequest,
    sendTripPaymentConfirmation,
    sendTripStatusUpdate,
    sendTripBulkEmail
};