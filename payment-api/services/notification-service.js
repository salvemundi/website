// payment-api/services/notification-service.js

const axios = require('axios');
const QRCode = require('qrcode');
const directusService = require('./directus-service');

/**
 * Haalt QR token op en verstuurt bevestigingsmail met QR code als inline bijlage.
 */
async function sendConfirmationEmail(directusUrl, directusToken, emailServiceUrl, metadata, description) {
    if (!metadata || !metadata.email || metadata.email === 'null') {
        console.log("⚠️ No email found in metadata, skipping confirmation email.");
        return;
    }

    try {
        console.log(`📧 Preparing confirmation email for ${metadata.email}...`);
        
        let attachments = [];
        let qrHtml = '';
        let participantName = null;

        // 1. De beschrijving opschonen en hernoemen naar activityName
        let activityName = description;
        if (activityName.startsWith('Inschrijving ')) {
            // Verwijder 'Inschrijving ' + spatie
            activityName = activityName.substring('Inschrijving '.length);
        }

        // 2. Probeer de QR token en de naam op te halen
        if (metadata.registrationId) {
            const registration = await directusService.getDirectusRegistration(
                directusUrl, 
                directusToken, 
                metadata.registrationId
            );
            
            if (registration) {
                participantName = registration.participant_name;

                if (registration.qr_token) {
                    console.log(`Creating QR code for token: ${registration.qr_token}`);
                    
                    // Genereer QR als Data URL
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

        // Bepaal dynamische aanhef
        const greetingName = participantName || 'deelnemer';
        
        // 3. Verstuur de email via de email-api service
        await axios.post(`${emailServiceUrl}/send-email`, {
            to: metadata.email,
            // Onderwerp blijft de volledige beschrijving
            subject: `Ticket: ${description}`, 
            html: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #7B2CBF;">Bedankt voor je inschrijving!</h2>
                    <p>Beste ${greetingName},</p>
                    <p>Je betaling voor <strong>${activityName}</strong> is succesvol ontvangen.</p>
                    <p>Hieronder vind je je persoonlijke QR-code. Laat deze scannen bij de ingang.</p>
                    
                    ${qrHtml}
                    
                    <p style="margin-top: 20px;">Tot dan!</p>
                    <p style="margin-top: 10px;">Met vriendelijke groet,</p>
                    <p style="margin-top: 0;"><strong>S.A. Salve Mundi</strong></p>
                </div>
            `,
            attachments: attachments
        });
        
        console.log("✅ Confirmation email sent with QR.");
    } catch (error) {
        console.error("❌ Failed to send confirmation email:", error.message);
    }
}

module.exports = {
    sendConfirmationEmail
};