// src/shared/lib/ms-graph.ts

/**
 * Utility for server-side interaction with Microsoft Graph API
 * Uses the OAuth 2.0 Client Credentials Grant to act as the application.
 * Specifically uses a dedicated Provisioning App Registration for write operations.
 */

const PROVISIONING_CLIENT_ID = process.env.ENTRA_PROVISIONING_CLIENT_ID;
const TENANT_ID = process.env.NEXT_PUBLIC_ENTRA_TENANT_ID;
const PROVISIONING_CLIENT_SECRET = process.env.ENTRA_PROVISIONING_CLIENT_SECRET;

let accessToken: string | null = null;
let tokenExpiresAt: number | null = null;

async function getGraphAccessToken(): Promise<string> {
    // Return cached token if still valid (adding 5 mins buffer)
    if (accessToken && tokenExpiresAt && Date.now() < tokenExpiresAt - 300000) {
        return accessToken;
    }

    if (!PROVISIONING_CLIENT_ID || !TENANT_ID || !PROVISIONING_CLIENT_SECRET) {
        throw new Error('Missing Entra ID Provisioning environment variables for MS Graph authentication');
    }

    const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

    const params = new URLSearchParams({
        client_id: PROVISIONING_CLIENT_ID,
        scope: 'https://graph.microsoft.com/.default',
        client_secret: PROVISIONING_CLIENT_SECRET,
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
    console.log(`[ms-graph] Explicitly using Provisioning Identity (User.ReadWrite.All scope) to update phone for user ${entraId}`);
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
    console.log(`[ms-graph] Explicitly using Provisioning Identity (CustomSecAttributeAssignment.ReadWrite.All scope) to update Custom Security Attribute for user ${entraId}`);
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

/**
 * Adds a user to an Entra ID group (Committee).
 */
export async function addMemberToEntraGroup(groupId: string, userId: string): Promise<void> {
    console.log(`[ms-graph] Adding user ${userId} to group ${groupId}`);
    const token = await getGraphAccessToken();

    const response = await fetch(`https://graph.microsoft.com/v1.0/groups/${groupId}/members/$ref`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "@odata.id": `https://graph.microsoft.com/v1.0/directoryObjects/${userId}`
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error(`[ms-graph] Failed to add member to group ${groupId}:`, error);
        throw new Error('Kon lid niet toevoegen aan Microsoft Entra groep');
    }
}

/**
 * Removes a user from an Entra ID group (Committee).
 */
export async function removeMemberFromEntraGroup(groupId: string, userId: string): Promise<void> {
    console.log(`[ms-graph] Removing user ${userId} from group ${groupId}`);
    const token = await getGraphAccessToken();

    const response = await fetch(`https://graph.microsoft.com/v1.0/groups/${groupId}/members/${userId}/$ref`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        // If they are already not a member, Azure might return 404, which we can safely ignore
        if (response.status === 404) return;
        const error = await response.json().catch(() => ({}));
        console.error(`[ms-graph] Failed to remove member from group ${groupId}:`, error);
        throw new Error('Kon lid niet verwijderen uit Microsoft Entra groep');
    }
}

/**
 * Modifies an Entra ID group owner (Committee Leader)
 */
export async function updateEntraGroupOwner(groupId: string, userId: string, isOwner: boolean): Promise<void> {
    console.log(`[ms-graph] Setting owner status to ${isOwner} for user ${userId} in group ${groupId}`);
    const token = await getGraphAccessToken();

    if (isOwner) {
        // Add as owner
        const response = await fetch(`https://graph.microsoft.com/v1.0/groups/${groupId}/owners/$ref`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "@odata.id": `https://graph.microsoft.com/v1.0/directoryObjects/${userId}`
            })
        });

        if (!response.ok) {
            // Might already be an owner (400 Bad Request)
            if (response.status === 400) return;
            const error = await response.json().catch(() => ({}));
            console.error(`[ms-graph] Failed to add owner to group ${groupId}:`, error);
            throw new Error('Kon leider niet instellen als Microsoft Entra groep eigenaar');
        }
    } else {
        // Remove owner status
        const response = await fetch(`https://graph.microsoft.com/v1.0/groups/${groupId}/owners/${userId}/$ref`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 404) return;
            const error = await response.json().catch(() => ({}));
            console.error(`[ms-graph] Failed to remove owner from group ${groupId}:`, error);
            throw new Error('Kon leiderschap niet verwijderen uit Microsoft Entra groep');
        }
    }
}
