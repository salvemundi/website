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

async function run() {
    try {
        const token = await getGraphAccessToken();

        // Fetch Azure Groups
        const azureRes = await fetch(`https://graph.microsoft.com/v1.0/groups?$select=id,displayName,mail`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!azureRes.ok) {
            const err = await azureRes.text();
            throw new Error(`Graph API Error: ${azureRes.status} ${err}`);
        }

        const azureData = await azureRes.json();
        const azureGroups = (azureData.value || []).filter(g => g.mail && g.mail.includes('@salvemundi.nl'));

        // Fetch Directus Committees
        const dirRes = await fetch(`${DIRECTUS_URL}/items/committees?fields=id,name,email`, {
            headers: { 'Authorization': `Bearer ${DIRECTUS_TOKEN}` }
        });
        const dirData = await dirRes.json();
        const directusCommittees = dirData.data || [];

        let out = "--- Azure Sync Dry Run with New Normalization ---\n\n";
        let matchCount = 0;
        let unmatched = [];

        directusCommittees.forEach(dc => {
            const normDc = normalize(dc.name);
            const match = azureGroups.find(ag => normalize(ag.displayName) === normDc);

            if (match) {
                out += `[MATCH] Directus: "${dc.name}" -> Azure: "${match.displayName}" (${match.mail}) [Azure ID: ${match.id}]\n`;
                matchCount++;
            } else {
                unmatched.push(`[NO MATCH] Directus: "${dc.name}" (Normalized: '${normDc}')`);
            }
        });

        out += `\n--- Summary ---\nMatched: ${matchCount}\nUnmatched: ${unmatched.length}\n\n--- Unmatched Exception Report ---\n`;
        out += unmatched.join('\n');

        fs.writeFileSync('azure_sync_dry_run_v2.txt', out);
        console.log("Dry run v2 complete. Check azure_sync_dry_run_v2.txt.");
    } catch (err) {
        console.error("Error running sync script v2:", err);
    }
}
run();
