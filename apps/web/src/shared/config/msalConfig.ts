import { Configuration, LogLevel, RedirectRequest } from '@azure/msal-browser';

const getRedirectUri = () => {
    if (typeof window === 'undefined') return '';

    // Check if we are on localhost/IP
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(window.location.origin);

    // If on localhost, ALWAYS use the hardcoded origin to avoid trailing slash mismatches
    if (isLocalhost) {
        return 'http://localhost:5173/';
    }

    // Dynamic redirect for our known environments
    // This overrides the environment variable to ensure we always stay on the same domain
    const hostname = window.location.hostname;
    if (
        hostname === 'salvemundi.nl' ||
        hostname === 'www.salvemundi.nl' ||
        hostname === 'dev.salvemundi.nl' ||
        hostname === 'preprod.salvemundi.nl'
    ) {
        return `${window.location.origin}/`;
    }

    // Otherwise use the env var or the current origin as fallback
    // Ensure we always have a trailing slash if that's what Azure expects
    const base = process.env.NEXT_PUBLIC_AUTH_REDIRECT_URI || window.location.origin;
    return base.endsWith('/') ? base : `${base}/`;
};

const redirectUri = getRedirectUri();
// console.log('[msalConfig] Resolved Redirect URI:', redirectUri);
const postLogoutRedirectUri = redirectUri;

// Helpful hint for LAN/IP testing where Microsoft requires HTTPS
if (typeof window !== 'undefined') {
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(window.location.origin);
    if (!isLocalhost && window.location.protocol !== 'https:') {
        // HTTPS requirement hint removed from logs
    }
}

// MSAL configuration
// console.log('[msalConfig] Loading configuration...');
// console.log('[msalConfig] Env NEXT_PUBLIC_ENTRA_CLIENT_ID:', process.env.NEXT_PUBLIC_ENTRA_CLIENT_ID);

const clientId = process.env.NEXT_PUBLIC_ENTRA_CLIENT_ID || 'YOUR_CLIENT_ID';
// console.log('[msalConfig] Resolved Client ID:', clientId);

const tenantId = process.env.NEXT_PUBLIC_ENTRA_TENANT_ID || 'common';


export const msalConfig: Configuration = {
    auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
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
