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

        if (metadata.registrationId) {
            const collection = metadata.registrationType === 'pub_crawl_signup' ? 'pub_crawl_signups' : 'event_signups';
            const registration = await directusService.getDirectusItem(
                directusUrl,
                directusToken,
                collection,
                metadata.registrationId,
                'qr_token,participant_name,name'
            );

            if (registration) {
                participantName = registration.participant_name || registration.name;

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
                        <div style="margin: 20px 0; text-align: center;">
                            <p>Jouw toegangsticket:</p>
                            <img src="cid:qrcode-image" alt="QR Ticket" style="width: 200px; height: 200px; border: 2px solid #7B2CBF; border-radius: 8px;" />
                            <p style="font-size: 12px; color: #666;">${registration.qr_token}</p>
                        </div>
                    `;
                }
            }
        }

        const greetingName = participantName || 'deelnemer';

        await axios.post(`${emailServiceUrl}/send-email`, {
            to: metadata.email,
            subject: `Ticket: ${description}`,
            html: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #7B2CBF;">Bedankt voor je inschrijving!</h2>
                    <p>Beste ${greetingName},</p>
                    <p>Je betaling voor <strong>${activityName}</strong> is succesvol ontvangen.</p>
                    <p>Hieronder vind je je persoonlijke QR-code. Laat deze scannen bij de commissieleden.</p>
                    ${qrHtml}
                    <p style="margin-top: 20px;">Tot dan!</p>
                    <p style="margin-top: 10px;">Met vriendelijke groet,</p>
                    <p style="margin-top: 0;"><strong>S.A. Salve Mundi</strong></p>
                </div>
            `,
            attachments: attachments
        }, { timeout: 10000 });


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