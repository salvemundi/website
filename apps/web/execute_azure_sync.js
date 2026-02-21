import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const PROVISIONING_CLIENT_ID = process.env.ENTRA_PROVISIONING_CLIENT_ID;
const TENANT_ID = process.env.NEXT_PUBLIC_ENTRA_TENANT_ID;
const PROVISIONING_CLIENT_SECRET = process.env.ENTRA_PROVISIONING_CLIENT_SECRET;
const DIRECTUS_TOKEN = 'tnDrdaB_OkA5u3GrLTUt_CJqLzTUy_TN';
const DIRECTUS_URL = 'https://admin.salvemundi.nl';

async function getGraphAccessToken() {
    const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
        client_id: PROVISIONING_CLIENT_ID,
        scope: 'https://graph.microsoft.com/.default',
        client_secret: PROVISIONING_CLIENT_SECRET,
        grant_type: 'client_credentials'
    });
    const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
    });
    const data = await res.json();
    return data.access_token;
}

const normalize = (name) => {
    if (!name) return '';
    return name.split('|')[0]
        .replace(/commissie/i, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .trim()
        .toLowerCase();
};

const cleanDisplayName = (azureName) => {
    if (!azureName) return '';
    return azureName.split('||')[0].split('|')[0].trim();
};

async function mutateDirectus(method, endpoint, body) {
    const res = await fetch(`${DIRECTUS_URL}${endpoint}`, {
        method,
        headers: {
            'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Directus API Error [${method} ${endpoint}]: ${res.status} ${text}`);
    }
    // DELETE requests to Directus usually return 204 No Content
    if (res.status === 204) return null;
    return res.json();
}

async function run() {
    try {
        const token = await getGraphAccessToken();

        // Fetch Azure Groups
        const azureRes = await fetch(`https://graph.microsoft.com/v1.0/groups?$select=id,displayName,mail`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const azureData = await azureRes.json();
        const azureGroups = (azureData.value || []).filter(g => g.mail && g.mail.includes('@salvemundi.nl'));

        // Fetch Directus Committees
        const dirRes = await fetch(`${DIRECTUS_URL}/items/committees?fields=id,name,email,users.id`, {
            headers: { 'Authorization': `Bearer ${DIRECTUS_TOKEN}` }
        });
        const dirData = await dirRes.json();
        const directusCommittees = dirData.data || [];

        console.log("--- PHASE 1: EXACT MATCHES & DEDUPLICATION ---");

        const groups = {};

        directusCommittees.forEach(dc => {
            const normDc = normalize(dc.name);
            const match = azureGroups.find(ag => normalize(ag.displayName) === normDc);

            if (match) {
                if (!groups[match.id]) {
                    groups[match.id] = {
                        azureGroup: match,
                        directusRecords: []
                    };
                }
                groups[match.id].directusRecords.push(dc);
            }
        });

        // Delete Redundant Records first
        console.log("\nDeleting redundant IDs 214 and 215...");
        // Failsafe specific check to ensure we only delete 214 & 215
        for (const dc of directusCommittees) {
            if (dc.id === 214 || dc.id === 215) {
                console.log(`Deleting Directus Committee ID: ${dc.id} (${dc.name})`);
                await mutateDirectus('DELETE', `/items/committees/${dc.id}`);
            }
        }

        console.log("\n--- PHASE 2: SYNC PRIMARIES ---");
        let successfulPatches = 0;

        for (const groupId of Object.keys(groups)) {
            const group = groups[groupId];

            // Re-sort to pick primary (same logic as analysis script)
            group.directusRecords.sort((a, b) => {
                const aMembers = a.users ? a.users.length : 0;
                const bMembers = b.users ? b.users.length : 0;
                if (bMembers !== aMembers) return bMembers - aMembers;
                return a.id - b.id;
            });

            const primary = group.directusRecords[0];
            const cleanName = cleanDisplayName(group.azureGroup.displayName);

            console.log(`Syncing Primary ID ${primary.id} - Target Name: "${cleanName}", Group ID: ${group.azureGroup.id}`);

            const payload = {
                entra_group_id: group.azureGroup.id,
                email: group.azureGroup.mail,
                name: cleanName
            };

            await mutateDirectus('PATCH', `/items/committees/${primary.id}`, payload);
            successfulPatches++;
        }

        console.log(`\n✅ Sync complete! Patched ${successfulPatches} unique committees.`);

    } catch (err) {
        console.error("\n❌ Fatal Error:", err);
    }
}
run();
