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
        const azureData = await azureRes.json();
        const azureGroups = (azureData.value || []).filter(g => g.mail && g.mail.includes('@salvemundi.nl'));

        // Fetch Directus Committees with their members count
        const dirRes = await fetch(`${DIRECTUS_URL}/items/committees?fields=id,name,email,users.id`, {
            headers: { 'Authorization': `Bearer ${DIRECTUS_TOKEN}` }
        });
        const dirData = await dirRes.json();
        const directusCommittees = dirData.data || [];

        let out = "--- Deduplication Report ---\n\n";

        // Group by normalized name (which maps to an Azure ID)
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

        let toMerge = [];

        Object.values(groups).forEach(group => {
            if (group.directusRecords.length > 1) {
                // Sort to find primary: most members first, then by earliest ID
                group.directusRecords.sort((a, b) => {
                    const aMembers = a.users ? a.users.length : 0;
                    const bMembers = b.users ? b.users.length : 0;
                    if (bMembers !== aMembers) return bMembers - aMembers;
                    return a.id - b.id; // Fallback to older record
                });

                const primary = group.directusRecords[0];
                const duplicates = group.directusRecords.slice(1);

                out += `[DUPLICATE DETECTED] Azure Group: ${group.azureGroup.displayName} (${group.azureGroup.mail})\n`;
                out += `  -> Primary Chosen: ID ${primary.id} - "${primary.name}" (${primary.users ? primary.users.length : 0} members)\n`;

                let totalMembersToMigrate = 0;
                duplicates.forEach(dup => {
                    const dupMembersCount = dup.users ? dup.users.length : 0;
                    totalMembersToMigrate += dupMembersCount;
                    out += `  -> Redundant Record (Will Delete): ID ${dup.id} - "${dup.name}" (${dupMembersCount} members to migrate to ID ${primary.id})\n`;
                });

                out += `  -> Total members to migrate internally in Directus junction table: ${totalMembersToMigrate}\n\n`;

                toMerge.push({
                    azureGroup: group.azureGroup.displayName,
                    primaryId: primary.id,
                    redundantIds: duplicates.map(d => d.id)
                });
            } else {
                const single = group.directusRecords[0];
                out += `[CLEAN] Azure Group: ${group.azureGroup.displayName} mapped 1:1 to Directus ID ${single.id} - "${single.name}"\n`;
            }
        });

        out += `\n--- Summary ---\n`;
        out += `Total Azure Groups matched: ${Object.keys(groups).length}\n`;
        out += `Groups needing deduplication in Directus: ${toMerge.length}\n`;

        fs.writeFileSync('azure_dedup_report.txt', out);
        console.log("Deduplication report written to azure_dedup_report.txt");

    } catch (err) {
        console.error("Error running dedup script:", err);
    }
}
run();
