const axios = require('axios');

async function sendWelcomeEmail(emailServiceUrl, email, firstName, credentials) {
    if (!emailServiceUrl) return;

    const subject = `Welkom bij Salve Mundi! 🎉 - Je accountgegevens`;
    const html = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7B2CBF;">Welkom bij Salve Mundi, ${firstName}!</h2>
            <p>Je inschrijving is goed ontvangen. We hebben direct een account voor je aangemaakt.</p>
            
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
    `;

    try {
        // Normalize: strip /send-email if already present, then add it once
        let baseUrl = emailServiceUrl.replace(/\/$/, '').replace(/\/send-email$/, '');
        const endpoint = baseUrl + '/send-email';
        console.log('[AdminAPI Notifications] sendWelcomeEmail POST ->', endpoint);
        const response = await axios.post(endpoint, {
            to: email,
            subject: subject,
            html: html
        }, { timeout: 10000 });
        console.log(`[AdminAPI] Welcome email sent to ${email}. Response status:`, response.status);
    } catch (error) {
        console.error(`[AdminAPI] Failed to send welcome email to ${email}:`, error.response?.data || error.message);
    }
}

async function sendApprovalNotificationEmail(emailServiceUrl, email, firstName, hasNewCredentials = false, credentials = null) {
    if (!emailServiceUrl) return;

    const subject = `Je lidmaatschap bij Salve Mundi is goedgekeurd! 🎉`;
    
    let credentialsSection = '';
    if (hasNewCredentials && credentials) {
        credentialsSection = `
            <div style="background-color: #f3f3f3; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Je inloggegevens:</h3>
                <p><strong>Gebruikersnaam:</strong> ${credentials.upn}</p>
                <p><strong>Tijdelijk Wachtwoord:</strong> ${credentials.password}</p>
            </div>

            <p>Log in op <a href="https://myaccount.microsoft.com/" style="color: #7B2CBF;">Microsoft My Account</a> om je wachtwoord direct te wijzigen.</p>
        `;
    } else {
        credentialsSection = `
            <p>Je kunt nu inloggen met je bestaande accountgegevens op de <a href="https://salvemundi.nl" style="color: #7B2CBF;">Salve Mundi website</a>.</p>
        `;
    }

    const html = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7B2CBF;">Goed nieuws, ${firstName}!</h2>
            <p>Je inschrijving voor het lidmaatschap bij Salve Mundi is goedgekeurd en je account is geactiveerd.</p>
            
            ${credentialsSection}
            
            <p>Met je account heb je toegang tot:</p>
            <ul style="color: #555;">
                <li>De Salve Mundi website en ledenportaal</li>
                <li>Inschrijvingen voor activiteiten en evenementen</li>
                <li>Toegang tot Microsoft 365 diensten</li>
            </ul>

            <p style="margin-top: 20px;">Welkom bij de vereniging! We kijken ernaar uit je te zien bij onze activiteiten.</p>
            <p style="margin-top: 10px;">Met vriendelijke groet,</p>
            <p style="margin-top: 0;"><strong>S.A. Salve Mundi</strong></p>
        </div>
    `;

    try {
        // Normalize: strip /send-email if already present, then add it once
        let baseUrl = emailServiceUrl.replace(/\/$/, '').replace(/\/send-email$/, '');
        const endpoint = baseUrl + '/send-email';
        console.log('[AdminAPI Notifications] sendApprovalNotificationEmail POST ->', endpoint);
        const response = await axios.post(endpoint, {
            to: email,
            subject: subject,
            html: html
        }, { timeout: 10000 });
        console.log(`[AdminAPI] Approval notification email sent to ${email}. Response status:`, response.status);
    } catch (error) {
        console.error(`[AdminAPI] Failed to send approval notification email to ${email}:`, error.response?.data || error.message);
    }
}

module.exports = {
    sendWelcomeEmail,
    sendApprovalNotificationEmail
};
