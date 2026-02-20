// src/shared/lib/ms-graph.ts

/**
 * Utility for server-side interaction with Microsoft Graph API
 * Uses the OAuth 2.0 Client Credentials Grant to act as the application.
 */

const CLIENT_ID = process.env.NEXT_PUBLIC_ENTRA_CLIENT_ID;
const TENANT_ID = process.env.NEXT_PUBLIC_ENTRA_TENANT_ID;
const CLIENT_SECRET = process.env.ENTRA_CLIENT_SECRET;

let accessToken: string | null = null;
let tokenExpiresAt: number | null = null;

async function getGraphAccessToken(): Promise<string> {
    // Return cached token if still valid (adding 5 mins buffer)
    if (accessToken && tokenExpiresAt && Date.now() < tokenExpiresAt - 300000) {
        return accessToken;
    }

    if (!CLIENT_ID || !TENANT_ID || !CLIENT_SECRET) {
        throw new Error('Missing Entra ID environment variables for MS Graph authentication');
    }

    const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        scope: 'https://graph.microsoft.com/.default',
        client_secret: CLIENT_SECRET,
        grant_type: 'client_credentials'
    });

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
    });

    if (!response.ok) {
        const err = await response.text();
        console.error('[ms-graph] Token fetch failed:', err);
        throw new Error('Kan niet authenticeren met Microsoft Graph');
    }

    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in * 1000);

    return data.access_token;
}

/**
 * Updates a user's phone number in Entra ID.
 */
export async function updateUserPhoneInEntra(entraId: string, phoneNumber: string): Promise<void> {
    const token = await getGraphAccessToken();

    const response = await fetch(`https://graph.microsoft.com/v1.0/users/${entraId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            // Using standard mobile profile field
            mobilePhone: phoneNumber
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error(`[ms-graph] Failed to update phone for ${entraId}:`, error);
        throw new Error('Kon telefoonnummer niet synchroniseren met Microsoft Entra ID');
    }
}

/**
 * Updates a user's Date of Birth via Custom Security Attributes in Entra ID.
 */
export async function updateUserDobInEntra(entraId: string, dob: string): Promise<void> {
    const token = await getGraphAccessToken();

    const attributeSetName = "SalveMundiLidmaatschap";
    const attributeName = "Geboortedatum";

    // Azure expects the format YYYYMMDD. Input is YYYY-MM-DD.
    const formattedDob = dob.replace(/-/g, '');

    const payload = {
        customSecurityAttributes: {
            [attributeSetName]: {
                "@odata.type": "#Microsoft.DirectoryServices.CustomSecurityAttributeValue",
                [attributeName]: formattedDob
            }
        }
    };

    const response = await fetch(`https://graph.microsoft.com/v1.0/users/${entraId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error(`[ms-graph] Failed to update DOB for ${entraId}:`, error);
        throw new Error('Kon geboortedatum niet synchroniseren met Microsoft Entra ID');
    }
}
