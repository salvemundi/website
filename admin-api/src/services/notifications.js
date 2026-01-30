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
        await axios.post(`${emailServiceUrl}/send-email`, {
            to: email,
            subject: subject,
            html: html
        }, { timeout: 10000 });
        console.log(`[AdminAPI] Welcome email sent to ${email}`);
    } catch (error) {
        console.error(`[AdminAPI] Failed to send welcome email:`, error.response?.data || error.message);
    }
}

module.exports = {
    sendWelcomeEmail
};
