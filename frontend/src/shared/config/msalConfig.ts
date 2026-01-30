import { Configuration, LogLevel, RedirectRequest } from '@azure/msal-browser';

const getRedirectUri = () => {
    if (typeof window === 'undefined') return '';

    // Check if we are on localhost/IP
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(window.location.origin);

    // If on localhost, ALWAYS use the current origin to avoid being redirected to prod
    if (isLocalhost) {
        return window.location.origin;
    }

    // Otherwise use the env var or the current origin
    return process.env.NEXT_PUBLIC_AUTH_REDIRECT_URI || window.location.origin;
};

const redirectUri = getRedirectUri();
const postLogoutRedirectUri = redirectUri;

// Helpful hint for LAN/IP testing where Microsoft requires HTTPS
if (typeof window !== 'undefined') {
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(window.location.origin);
    if (!isLocalhost && window.location.protocol !== 'https:') {
        // HTTPS requirement hint removed from logs
    }
}

// MSAL configuration
export const msalConfig: Configuration = {
    auth: {
        clientId: process.env.NEXT_PUBLIC_ENTRA_CLIENT_ID || 'YOUR_CLIENT_ID', // Replace with your Entra ID client ID
        authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_ENTRA_TENANT_ID || 'common'}`,
        redirectUri,
        postLogoutRedirectUri,
    },
    cache: {
        cacheLocation: 'localStorage',
        storeAuthStateInCookie: true, // Set to true for better persistence across environments
    },
    system: {
        loggerOptions: {
            loggerCallback: (_level: LogLevel, _message: string, containsPii: boolean) => {
                // Disable MSAL logging in browser console for privacy and cleanliness
                if (containsPii) return;
                return;
            },
            logLevel: LogLevel.Warning,
        },
    },
};

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest: RedirectRequest = {
    scopes: ['User.Read', 'openid', 'profile', 'email'],
};

// Add the endpoints here for Microsoft Graph API services you'd like to use.
export const graphConfig = {
    graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
};
