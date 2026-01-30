const axios = require('axios');

async function sendWelcomeEmail(emailServiceUrl, email, firstName, credentials) {
    if (!emailServiceUrl) return;
    await axios.post(`${emailServiceUrl}`, {
        to: email,
        template: 'welcome-new-member',
        data: {
            firstName,
            username: credentials.upn || credentials.userPrincipalName,
            password: credentials.password,
            loginUrl: 'https://salvemundi.nl/login'
        }
    });
}

module.exports = {
    sendWelcomeEmail
};
