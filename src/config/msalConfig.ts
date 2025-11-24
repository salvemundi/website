import { Configuration, PopupRequest } from '@azure/msal-browser';

const redirectUri = import.meta.env.VITE_AUTH_REDIRECT_URI || window.location.origin;
const postLogoutRedirectUri = import.meta.env.VITE_AUTH_LOGOUT_REDIRECT_URI || redirectUri;

// Helpful hint for LAN/IP testing where Microsoft requires HTTPS
const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(window.location.origin);
if (!isLocalhost && window.location.protocol !== 'https:') {
  console.warn('Microsoft login needs HTTPS when you are not on localhost. Serve the dev server over HTTPS and set VITE_AUTH_REDIRECT_URI to that HTTPS origin (also add it to the Entra app redirect URIs).');
}

// MSAL configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_ENTRA_CLIENT_ID || 'YOUR_CLIENT_ID', // Replace with your Entra ID client ID
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_ENTRA_TENANT_ID || 'common'}`,
    redirectUri,
    postLogoutRedirectUri,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
};

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest: PopupRequest = {
  scopes: ['User.Read', 'openid', 'profile', 'email'],
};

// Add the endpoints here for Microsoft Graph API services you'd like to use.
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
};
