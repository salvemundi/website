const axios = require('axios');
const QRCode = require('qrcode');
const directusService = require('./directus-service');

async function sendConfirmationEmail(directusUrl, directusToken, emailServiceUrl, metadata, description) {
    if (!metadata || !metadata.email || metadata.email === 'null') {
        return;
    }

    try {
        let attachments = [];
        let qrHtml = '';
        let participantName = null;
        let activityName = description;
        if (activityName.startsWith('Inschrijving ')) {
            activityName = activityName.substring('Inschrijving '.length);
        }

        let eventDetails = null;

        if (metadata.registrationId) {
            // Determine collection based on registration type
            const collection = metadata.registrationType === 'pub_crawl_signup' ? 'pub_crawl_signups' : 'event_signups';

            // Fetch registration info including possible event IDs
            const registration = await directusService.getDirectusItem(
                directusUrl,
                directusToken,
                collection,
                metadata.registrationId,
                'qr_token,participant_name,name,event_id,pub_crawl_event_id'
            );

            if (registration) {
                participantName = registration.participant_name || registration.name;

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

                if (registration.qr_token) {
                    const qrDataUrl = await QRCode.toDataURL(registration.qr_token, {
                        color: { dark: '#7B2CBF', light: '#FFFFFF' },
                        width: 300
                    });
                    const base64Data = qrDataUrl.split(',')[1];

                    attachments.push({
                        name: 'ticket-qr.png',
                        contentType: 'image/png',
                        contentBytes: base64Data,
                        isInline: true,
                        contentId: 'qrcode-image'
                    });

                    qrHtml = `
                        <div style="margin: 20px 0; text-align: center; background-color: #f9f9f9; padding: 20px; border-radius: 12px; border: 2px dashed #7B2CBF;">
                            <p style="font-weight: bold; color: #7B2CBF; margin-top: 0;">Jouw Toegangsticket</p>
                            <img src="cid:qrcode-image" alt="QR Ticket" style="width: 200px; height: 200px; border-radius: 8px;" />
                            <p style="font-size: 11px; color: #999; margin-bottom: 0;">Ticket ID: ${registration.qr_token}</p>
                        </div>
                    `;
                }
            }
        }

        const greetingName = participantName || 'deelnemer';

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
        await axios.post(`${emailServiceUrl}/send-email`, {
            to: metadata.email,
            subject: `Ticket: ${activityName}`,
            html: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.5;">
                    <h2 style="color: #7B2CBF; border-bottom: 2px solid #7B2CBF; padding-bottom: 10px;">Bedankt voor je inschrijving!</h2>
                    <p>Beste ${greetingName},</p>
                    <p>Je betaling voor <strong>${activityName}</strong> is succesvol ontvangen. Je inschrijving is nu definitief.</p>
                    
                    ${detailsHtml}
                    
                    <p>Hieronder vind je je persoonlijke QR-code. Laat deze scannen bij de commissieleden voor toegang.</p>
                    ${qrHtml}
                    
                    <p style="margin-top: 25px;">Veel plezier!</p>
                    <p style="margin-top: 10px; margin-bottom: 0;">Met vriendelijke groet,</p>
                    <p style="margin-top: 0;"><strong>S.A. Salve Mundi</strong></p>
                    
                    <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px; font-size: 12px; color: #888; text-align: center;">
                        <p>Dit is een automatische bevestiging van je betaling.</p>
                    </div>
                </div>
            `,
            attachments: attachments
        }, { timeout: 10000 });

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
            }, { timeout: 10000 });
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
        }, { timeout: 10000 });

    } catch (error) {
        console.error("❌ Failed to send welcome email:", error.message);
    }
}

module.exports = {
    sendConfirmationEmail,
    sendWelcomeEmail
};