import axios from 'axios';

export const sendWelcomeEmail = async (emailServiceUrl, email, firstName, credentials) => {
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
};
