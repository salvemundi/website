// Real-time bidirectional sync between Entra ID <-> Directus

import 'dotenv/config';
import axios from 'axios';
import express from 'express';
import bodyParser from 'body-parser';
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import 'isomorphic-fetch';

const app = express();
const PORT = process.env.PORT || 3001;

// Define your known group IDs (entra)
const GROUP_IDS = {
    COMMISSIE_LEIDER: '91d77972-2695-4b7b-a0a0-df7d6523a087',
    BESTUUR: 'b16d93c7-42ef-412e-afb3-f6cbe487d0e0',
    ICT: 'a4aeb401-882d-4e1e-90ee-106b7fdb23cc',
    Intro: '516f03f9-be0a-4514-9da8-396415f59d0b',
    CommitteeMember: '5848f0ed-59c4-4ae2-8683-3d9a221ac189',
    ACTIEVE_LEDEN: process.env.GROUP_ID_ACTIEF || '2e17c12a-28d6-49ae-981a-8b5b8d88db8a', // Leden_Actief_Lidmaatschap
};

// Manual override mapping (optional) – if you want to force certain group IDs to specific names
const GROUP_NAME_MAP = {
    'fc3b226a-62f8-437a-a7fa-7c631e48aaff': 'Commissie Leider',
    'b16d93c7-42ef-412e-afb3-f6cbe487d0e0': 'Bestuur',
    'a4aeb401-882d-4e1e-90ee-106b7fdb23cc': 'ICTCommissie',
};

const ROLE_IDS = {
    COMMISSIE_LEIDER: 'fc3b226a-62f8-437a-a7fa-7c631e48aaff',
    BESTUUR: 'a0e51e23-15ef-4e04-a188-5c483484b0be',
    ADMIN: 'd671fd7a-cfcb-4bdc-afb8-1a96bc2d5d50',
    Intro: '877cbf0e-ed15-4d45-b164-8f251ffd278f',
    CommitteeMember: '5848f0ed-59c4-4ae2-8683-3d9a221ac189'
};

// Hardcode committee groups here (names or IDs). If you provide names, they will be
// resolved to IDs after the global group map is built. Example:
// const HARDCODE_COMMITTEE_GROUPS = ['Leden_Actief_Lidmaatschap', '5848f0ed-59c4-4ae2-8683-3d9a221ac189'];
const HARDCODE_COMMITTEE_GROUPS = [
    'd4686b83-4679-46ed-9fd8-c6ff3c6a265f',   //activiteiten commissie
    '0ac8627d-07f8-43fd-a629-808572e95098',   //feest commissie
    'b907ae11-2067-49ac-b8a7-0ce166eabbcb',   //kamp commissie
    '8d6c181e-3527-4a0b-aacb-5f758b4d14f5',   //kas commissie
    '0140644c-be1e-438f-9db1-9c082283abf2',   //marketing commissie
    '3ec890d7-93b7-416d-8470-c2cb8cbad8ba',   //media commissie
    '4c027a6d-0307-4aee-b719-23d67bcd0959',   //reis commissie
    'ee4c4407-6d61-483e-a98c-77c5e20bd7ba',   //studie commissie
];

// Which Entra group IDs should cause a user to receive the "CommitteeMember" role in Directus.
// You can also override this via the COMMITTEE_GROUP_IDS environment variable (comma separated list).
// This variable may be replaced after building the global group name map if `HARDCODE_COMMITTEE_GROUPS` contains names.
// Initialize with the hardcoded committee groups directly instead of just the default CommitteeMember group
let COMMITTEE_GROUP_IDS = (process.env.COMMITTEE_GROUP_IDS && process.env.COMMITTEE_GROUP_IDS.split(',').map(s => s.trim()).filter(Boolean)) || HARDCODE_COMMITTEE_GROUPS;

console.log(`[INIT] COMMITTEE_GROUP_IDS (${COMMITTEE_GROUP_IDS.length}): ${COMMITTEE_GROUP_IDS.join(',')}`);

const DIRECTUS_HEADERS = {
    Authorization: `Bearer ${process.env.DIRECTUS_API_TOKEN}`,
};

const EXCLUDED_EMAILS = [
    'youtube@salvemundi.nl',
    'github@salvemundi.nl',
    'intern@salvemundi.nl',
    'ik.ben.de.website@salvemundi.nl',
    'voorzitter@salvemundi.nl',
    'twitch@salvemundi.nl',
    'secretaris@salvemundi.nl',
    'penningmeester@salvemundi.nl',
    'noreply@salvemundi.nl',
    'extern@salvemundi.nl',
    'commissaris.administratie@salvemundi.nl',
    // mediarequests@salvemundi.nl


    // Voeg hier meer emails toe die overgeslagen moeten worden
];

function shouldExcludeUser(email) {
    if (!email) return true;
    const lowerEmail = email.toLowerCase();

    // Exact match check
    if (EXCLUDED_EMAILS.includes(lowerEmail)) return true;

    // Pattern checks (optioneel)
    if (lowerEmail.startsWith('test-')) return true;

    return false;
}

const syncLock = new Map();
const LOCK_TTL = 5000;

let syncStatus = {
    active: false,
    status: 'idle', // 'idle', 'running', 'completed', 'failed'
    total: 0,
    processed: 0,
    errorCount: 0,
    missingDataCount: 0,
    warningCount: 0,
    successCount: 0,
    excludedCount: 0,
    errors: [], // [{ email: string, error: string, timestamp: string }]
    missingData: [], // [{ email: string, reason: string }]
    warnings: [], // [{ type: string, email: string, message: string }]
    successfulUsers: [], // [{ email: string }]
    excludedUsers: [], // [{ email: string }]
    startTime: null,
    endTime: null,
    lastRunSuccess: null
};

function acquireLock(key) {
    const now = Date.now();
    const existing = syncLock.get(key);
    if (existing && (now - existing) < LOCK_TTL) return false;
    syncLock.set(key, now);
    setTimeout(() => syncLock.delete(key), LOCK_TTL);
    return true;
}

function formatDutchMobile(raw) {
    if (!raw) return '';
    if (raw.startsWith('06')) return raw;
    if (raw.startsWith('316')) return '0' + raw.slice(2);
    return raw;
}

// Directus membership helpers
async function setDirectusMembershipStatus(userId, status) {
    if (!userId) return;
    try {
        await axios.patch(
            `${process.env.DIRECTUS_URL}/users/${encodeURIComponent(userId)}`,
            { membership_status: status },
            { headers: DIRECTUS_HEADERS }
        );
    } catch (err) {
        console.error(`❌ [DIRECTUS] Failed to set membership_status for ${userId}:`, err.response?.data || err.message);
    }
}

async function userHasAnyMemberships(userId) {
    if (!userId) return false;
    try {
        // Check committee memberships
        const cmUrl = `${process.env.DIRECTUS_URL}/items/committee_members?filter[user_id][_eq]=${encodeURIComponent(userId)}&limit=1`;
        const cmRes = await axios.get(cmUrl, { headers: DIRECTUS_HEADERS });
        if ((cmRes.data?.data || []).length > 0) return true;

        // Try club_members (some setups store memberships there). If the endpoint/field doesn't exist, ignore errors.
        try {
            const clubUrl = `${process.env.DIRECTUS_URL}/items/club_members?filter[user_id][_eq]=${encodeURIComponent(userId)}&limit=1`;
            const clubRes = await axios.get(clubUrl, { headers: DIRECTUS_HEADERS });
            if ((clubRes.data?.data || []).length > 0) return true;
        } catch (e) {
            // Not all installations expose user_id on club_members — that's fine.
        }

        return false;
    } catch (err) {
        console.error(`❌ [DIRECTUS] Error checking memberships for ${userId}:`, err.response?.data || err.message);
        return false;
    }
}

async function getGraphClient() {

    const tokenResponse = await axios.post(
        `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`,
        new URLSearchParams({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            scope: 'https://graph.microsoft.com/.default',
            grant_type: 'client_credentials',
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const token = tokenResponse.data.access_token;
    return Client.init({ authProvider: done => done(null, token) });
}

// Build global groupId -> name map
let groupNameMapGlobal = {};
let groupIdByNameGlobal = {};

async function buildGlobalGroupNameMap() {
    const client = await getGraphClient();
    let allGroups = [];
    let nextLink = `/groups?$select=id,displayName,mailNickname&$top=100`;

    while (nextLink) {
        const response = await client.api(nextLink).get();
        const groups = response.value || [];
        allGroups = allGroups.concat(groups);

        nextLink = response['@odata.nextLink'] ? response['@odata.nextLink'].replace('https://graph.microsoft.com/v1.0', '') : null;
    }



    allGroups.forEach(g => {
        const name = g.displayName || g.mailNickname || g.id;
        groupNameMapGlobal[g.id] = name;
        if (name) groupIdByNameGlobal[name] = g.id;
    });

    // If the user provided HARDCODE_COMMITTEE_GROUPS as names or ids, resolve them to ids now.
    if (Array.isArray(HARDCODE_COMMITTEE_GROUPS) && HARDCODE_COMMITTEE_GROUPS.length > 0) {
        const resolved = [];
        for (const entry of HARDCODE_COMMITTEE_GROUPS) {
            if (!entry) continue;
            // If entry looks like a GUID, accept it as an id directly
            if (/^[0-9a-fA-F-]{36}$/.test(entry)) {
                resolved.push(entry);
                continue;
            }
            // Try to resolve by name via the global map
            const foundId = groupIdByNameGlobal[entry];
            if (foundId) resolved.push(foundId);
        }
        if (resolved.length > 0) {
            COMMITTEE_GROUP_IDS = resolved;
            console.log(`[INIT] Resolved HARDCODE_COMMITTEE_GROUPS to ids: ${COMMITTEE_GROUP_IDS.join(',')}`);
        } else {
            console.log('[INIT] No HARDCODE_COMMITTEE_GROUPS resolved to ids; falling back to COMMITTEE_GROUP_IDS/env/default');
        }
    }


}

function getRoleIdByGroupMembership(groupIds) {
    // Minimal logging: only print a concise input summary
    console.log(`[ROLE] groups=${groupIds?.length || 0}, committees=${COMMITTEE_GROUP_IDS.length}`);

    // Preserve explicit special-group roles first
    if (Array.isArray(groupIds) && groupIds.length > 0) {
        if (groupIds.includes(GROUP_IDS.ICT)) return ROLE_IDS.ADMIN;
        if (groupIds.includes(GROUP_IDS.BESTUUR)) return ROLE_IDS.BESTUUR;
        if (groupIds.includes(GROUP_IDS.COMMISSIE_LEIDER)) return ROLE_IDS.COMMISSIE_LEIDER;
        if (groupIds.includes(GROUP_IDS.Intro)) {
            console.log(`[ROLE] ✅ User is in Intro group (${GROUP_IDS.Intro}) -> Assigning Intro role`);
            return ROLE_IDS.Intro;
        }
        // If the user is member of any configured committee group, treat them as a committee member
        for (const gid of groupIds) {
            if (COMMITTEE_GROUP_IDS.includes(gid)) return ROLE_IDS.CommitteeMember;
        }
    } else {
        console.log(`[ROLE] ⚠️ No groups provided or empty array`);
    }

    // No Entra groups found -> don't force a role change
    console.log(`[ROLE] ❌ No matching role found -> returning null (no role change)`);
    return null;
}

function hasChanges(existing, newData, selectedFields = null) {
    const defaultFields = ['first_name', 'last_name', 'phone_number', 'fontys_email', 'role', 'status', 'membership_expiry'];
    const fieldsToCheck = selectedFields ? selectedFields.filter(f => defaultFields.includes(f)) : defaultFields;

    // Only consider a field changed if the new payload actually contains that field.
    // This avoids treating omitted fields (for example: role intentionally omitted when not determined)
    // as a change for existing users.
    const fieldChanged = (field) => {
        if (!(field in newData)) return false; // skip comparison when newData doesn't provide the field
        return existing[field] !== newData[field];
    };

    return fieldsToCheck.some(fieldChanged);
}

// Committee logic
async function getOrCreateCommitteeForGroup(group) {
    const baseUrl = `${process.env.DIRECTUS_URL}/items/committees`;
    const groupId = group.id;
    const displayName = group.displayName;
    const mailNickname = group.mailNickname;

    const mappedOverride = GROUP_NAME_MAP[groupId];
    const fromGlobalMap = groupNameMapGlobal[groupId];
    const desiredName = mappedOverride || fromGlobalMap || displayName || mailNickname || groupId;



    try {
        const searchUrl = `${baseUrl}?filter[name][_eq]=${encodeURIComponent(desiredName)}&limit=1`;
        const searchRes = await axios.get(searchUrl, { headers: DIRECTUS_HEADERS });
        const found = searchRes.data?.data?.[0];
        if (found) {

            return { id: found.id, name: found.name };
        }
    } catch (error) {
        console.error('❌ [DIRECTUS] Error looking up committee by name:', error.response?.data || error.message);
    }


    try {
        const createRes = await axios.post(baseUrl, { name: desiredName }, { headers: DIRECTUS_HEADERS });

        return { id: createRes.data.data.id, name: desiredName };
    } catch (error) {
        console.error('❌ [DIRECTUS] Error creating committee:', error.response?.data || error.message);
        throw error;
    }
}

async function ensureUserInCommittee(userId, committeeId) {
    const baseUrl = `${process.env.DIRECTUS_URL}/items/committee_members`;


    try {
        const checkUrl = `${baseUrl}?filter[user_id][_eq]=${encodeURIComponent(userId)}&filter[committee_id][_eq]=${encodeURIComponent(committeeId)}&limit=1`;
        const checkRes = await axios.get(checkUrl, { headers: DIRECTUS_HEADERS });
        const existing = checkRes.data?.data || [];
        if (existing.length > 0) {

            return;
        }
    } catch (error) {
        console.error('❌ [MEMBER] Error checking membership:', error.response?.data || error.message);
    }


    try {
        const createRes = await axios.post(
            `${process.env.DIRECTUS_URL}/items/committee_members`,
            { committee_id: committeeId, user_id: userId, is_visible: true, is_leader: false },
            { headers: DIRECTUS_HEADERS }
        );

        // Ensure user's membership status is set to active
        try {
            await setDirectusMembershipStatus(userId, 'active');
        } catch (e) {
            console.error('❌ [MEMBER] Error setting membership status after add:', e.response?.data || e.message);
        }
    } catch (error) {
        console.error(`❌ [MEMBER] Error adding user ${userId} to committee ${committeeId}:`, error.response?.data || error.message);
    }
}

async function removeUserFromMissingCommittees(userId, currentCommitteeNames) {
    const cmUrl = `${process.env.DIRECTUS_URL}/items/committee_members`;
    const cUrl = `${process.env.DIRECTUS_URL}/items/committees`;



    try {
        const params = new URLSearchParams();
        params.append('filter[user_id][_eq]', userId);
        params.append('fields', 'id,committee_id');
        params.append('limit', '-1');
        const url = `${cmUrl}?${params.toString()}`;
        const res = await axios.get(url, { headers: DIRECTUS_HEADERS });
        const memberships = res.data?.data || [];


        for (const m of memberships) {
            const membershipId = m.id;
            const committeeId = m.committee_id;
            if (!committeeId) {

                continue;
            }
            let committeeName = null;
            try {
                const cres = await axios.get(`${cUrl}/${committeeId}?fields=id,name`, { headers: DIRECTUS_HEADERS });
                committeeName = cres.data?.data?.name || null;
            } catch (error) {
                console.error(`❌ [MEMBER] Error fetching committee ${committeeId}:`, error.response?.data || error.message);
            }
            if (!committeeName) {

                continue;
            }
            if (!currentCommitteeNames.has(committeeName)) {

                try {
                    await axios.delete(`${cmUrl}/${membershipId}`, { headers: DIRECTUS_HEADERS });

                } catch (error) {
                    console.error(`❌ [MEMBER] Error deleting membership id=${membershipId}:`, error.response?.data || error.message);
                }
                // continue loop — we'll check remaining memberships after processing all deletions
            } else {

            }
        }
        // After removing stale memberships, ensure membership_status reflects remaining memberships
        try {
            const still = await userHasAnyMemberships(userId);
            if (!still) {
                await setDirectusMembershipStatus(userId, 'none');
            }
        } catch (e) {
            console.error('❌ [MEMBER] Error updating membership_status after removals:', e.response?.data || e.message);
        }
    } catch (error) {
        console.error('❌ [MEMBER] Error fetching/removing memberships:', error.response?.data || error.message);
    }
}

async function syncCommitteesForUserFromGroups(directusUserId, groups) {
    if (!groups || groups.length === 0) {

        await removeUserFromMissingCommittees(directusUserId, new Set());
        return;
    }



    const currentCommitteeNames = new Set();

    for (const g of groups) {
        const groupId = g.id;
        const committeeName = GROUP_NAME_MAP[groupId] || groupNameMapGlobal[groupId] || g.displayName || g.mailNickname || groupId;


        const result = await getOrCreateCommitteeForGroup(g);
        if (!result) {
            continue;
        }

        currentCommitteeNames.add(result.name);
        await ensureUserInCommittee(directusUserId, result.id);
    }

    await removeUserFromMissingCommittees(directusUserId, currentCommitteeNames);
}

async function findGraphUserByEmail(email) {
    const client = await getGraphClient();
    const res = await client
        .api(`/users?$filter=mail eq '${email}' or userPrincipalName eq '${email}'&$select=id,mail,userPrincipalName,displayName,givenName,surname,mobilePhone`)
        .get();
    const u = (res.value || [])[0] || null;
    return u;
}

async function getDirectusUserById(id) {
    const url = `${process.env.DIRECTUS_URL}/users/${id}?fields=id,email,first_name,last_name,phone_number,status,role`;
    const res = await axios.get(url, { headers: DIRECTUS_HEADERS });
    return res.data?.data || null;
}

async function getDirectusUserByEmail(email) {
    const url = `${process.env.DIRECTUS_URL}/users?filter[email][_eq]=${encodeURIComponent(email)}&limit=1&fields=id,email,first_name,last_name,phone_number,status,role`;
    const res = await axios.get(url, { headers: DIRECTUS_HEADERS });
    return res.data?.data?.[0] || null;
}

function getGroupIdForCommitteeName(name) {
    const override = Object.entries(GROUP_NAME_MAP).find(([gid, n]) => n === name);
    if (override) return override[0];
    const globalId = groupIdByNameGlobal[name];
    return globalId || null;
}

async function getDirectusCommitteeNamesForUser(directusUserId) {
    const url = `${process.env.DIRECTUS_URL}/items/committee_members?filter[user_id][_eq]=${encodeURIComponent(directusUserId)}&fields=committee_id.name&limit=-1`;
    const res = await axios.get(url, { headers: DIRECTUS_HEADERS });
    const rows = res.data?.data || [];
    return rows.map(r => r?.committee_id?.name).filter(Boolean);
}

async function syncGraphGroupsForUser(graphUserId, committeeNames) {
    const client = await getGraphClient();
    const desired = new Set();
    for (const name of committeeNames) {
        const gid = getGroupIdForCommitteeName(name);
        if (gid) desired.add(gid);
    }
    const resp = await client.api(`/users/${graphUserId}/memberOf/microsoft.graph.group`).select('id,displayName').get();
    const current = new Set((resp.value || []).map(g => g.id));
    const toAdd = Array.from(desired).filter(id => !current.has(id));
    const managedIds = new Set(Object.keys(GROUP_NAME_MAP).concat(Object.values(groupIdByNameGlobal)));
    const toRemove = Array.from(current).filter(id => managedIds.has(id) && !desired.has(id));
    for (const gid of toAdd) {
        try {
            await client.api(`/groups/${gid}/members/$ref`).post({ '@odata.id': `https://graph.microsoft.com/v1.0/directoryObjects/${graphUserId}` });
            // log removed
        } catch (error) {
            console.error('❌ [GRAPH] Add group member error:', error.response?.data || error.message);
        }
    }
    for (const gid of toRemove) {
        try {
            await client.api(`/groups/${gid}/members/${graphUserId}/$ref`).delete();
            // log removed
        } catch (error) {
            console.error('❌ [GRAPH] Remove group member error:', error.response?.data || error.message);
        }
    }
}

async function updateGraphUserFieldsFromDirectus(graphUserId, directusUser) {
    const client = await getGraphClient();
    const displayName = `${directusUser.first_name || ''} ${directusUser.last_name || ''}`.trim() || directusUser.email;
    const patch = {
        givenName: directusUser.first_name || null,
        surname: directusUser.last_name || null,
        displayName,
        mobilePhone: formatDutchMobile(directusUser.phone_number) || null,
    };
    Object.keys(patch).forEach(k => patch[k] === null && delete patch[k]);
    try {
        await client.api(`/users/${graphUserId}`).patch(patch);
        // log removed
    } catch (error) {
        console.error('❌ [GRAPH] Update user error:', error.response?.data || error.message);
    }
}

async function updateGraphUserFromDirectusByEmail(email) {
    const graphUser = await findGraphUserByEmail(email.toLowerCase());
    if (!graphUser) {
        return;
    }
    const lockKey = `entra-${graphUser.id}`;
    if (!acquireLock(lockKey)) {
        return;
    }
    const dUser = await getDirectusUserByEmail(email.toLowerCase());
    if (!dUser) {
        return;
    }
    await updateGraphUserFieldsFromDirectus(graphUser.id, dUser);
    const names = await getDirectusCommitteeNamesForUser(dUser.id);
    await syncGraphGroupsForUser(graphUser.id, names);
}

async function updateGraphUserFromDirectusById(directusUserId) {
    const dUser = await getDirectusUserById(directusUserId);
    if (!dUser || !dUser.email) {
        return;
    }
    await updateGraphUserFromDirectusByEmail(dUser.email);
}

async function updateDirectusUserFromGraph(userId, selectedFields = null, forceLink = false) {
    const lockKey = `entra-${userId}`;
    if (!acquireLock(lockKey)) {
        return;
    }

    try {
        const client = await getGraphClient();

        const u = await client.api(`/users/${userId}`)
            .version('beta')
            .select('id,displayName,givenName,surname,mail,userPrincipalName,mobilePhone,customSecurityAttributes,jobTitle,birthday,otherMails')
            .get();

        const attributes = u.customSecurityAttributes?.SalveMundiLidmaatschap;
        // Minimal logging: expiry and missing fields summary

        let membershipExpiry = null;
        let dateOfBirth = null;

        if (attributes?.VerloopdatumStr) {
            const v = attributes.VerloopdatumStr; // yyyyMMdd
            if (v && v.length === 8) {
                membershipExpiry = `${v.substring(0, 4)}-${v.substring(4, 6)}-${v.substring(6, 8)}`;
                console.log(`[SYNC] ${u.mail || u.id} expiry=${membershipExpiry}`);
            }
        } else if (attributes?.Verloopdatum) {
            // Fallback attribute without the 'Str' suffix
            const v = attributes.Verloopdatum; // yyyyMMdd
            if (v && v.length === 8) {
                membershipExpiry = `${v.substring(0, 4)}-${v.substring(4, 6)}-${v.substring(6, 8)}`;
                console.log(`[SYNC] ${u.mail || u.id} expiry (fallback)=${membershipExpiry}`);
            }
        }

        // Try to get birthday from Entra
        if (u.birthday) {
            const rawDob = new Date(u.birthday).toISOString().split('T')[0];
            // Ignore default/empty dates like year 1
            if (!rawDob.startsWith('0001-')) {
                dateOfBirth = rawDob;
            }
        } else if (attributes?.Geboortedatum) {
            const v = attributes.Geboortedatum; // Assuming yyyyMMdd if it's a string
            if (v && v.length === 8) {
                dateOfBirth = `${v.substring(0, 4)}-${v.substring(4, 6)}-${v.substring(6, 8)}`;
            }
        }

        const email = (u.mail || u.userPrincipalName || '').toLowerCase();
        const otherEmails = (u.otherMails || []).map(e => e.toLowerCase());
        const allEmails = Array.from(new Set([email, ...otherEmails])).filter(Boolean);

        const firstName = u.givenName || (u.displayName ? u.displayName.split(' ')[0] : '').trim();
        const lastName = u.surname || (u.displayName ? u.displayName.split(' ').slice(1).join(' ') : '').trim();

        const missingFields = [];
        const isSelected = (field) => !selectedFields || selectedFields.includes(field);

        // Use derived names for missing‑field checks
        const derivedFirstName = firstName;
        const derivedLastName = lastName;

        if (isSelected('membership_expiry') && !membershipExpiry) missingFields.push('Lidmaatschap vervaldatum');
        if (isSelected('first_name') && !derivedFirstName) missingFields.push('Voornaam');
        if (isSelected('last_name') && !derivedLastName) missingFields.push('Achternaam');
        if (isSelected('display_name') && !u.displayName) missingFields.push('Display naam');
        if (isSelected('phone_number') && !u.mobilePhone) missingFields.push('Mobiel nummer');

        if (missingFields.length > 0) {
            syncStatus.missingDataCount++;
            syncStatus.missingData.push({
                email: email || 'unknown',
                reason: `Missende velden: ${missingFields.join(', ')}`
            });
            console.log(`[SYNC] ${u.mail || u.id} missing=${missingFields.join(';')}`);
        }

        // log removed

        const groupResp = await client.api(`/users/${userId}/memberOf/microsoft.graph.group`)
            .select('id,displayName,mailNickname')
            .get();

        const groups = groupResp.value || [];
        // Concise per-user log: email, #groups, role decision
        const groupIds = groups.map(g => g.id);
        const role = getRoleIdByGroupMembership(groupIds);
        console.log(`[SYNC] ${email} groups=${groups.length} -> role=${role || 'none'}`);


        // Priority 1: Search by entra_id
        const entraIdRes = await axios.get(
            `${process.env.DIRECTUS_URL}/users?filter[entra_id][_eq]=${encodeURIComponent(userId)}&fields=id,email,first_name,last_name,phone_number,status,role,membership_expiry,fontys_email,date_of_birth,title,entra_id`,
            { headers: DIRECTUS_HEADERS }
        );
        const existingByEntra = entraIdRes.data?.data?.[0] || null;

        // Priority 2: Search by all known emails (for warnings/manual linking)
        const emailList = allEmails.join(',');
        const emailRes = await axios.get(
            `${process.env.DIRECTUS_URL}/users?filter[email][_in]=${encodeURIComponent(emailList)}&fields=id,email,first_name,last_name,phone_number,status,role,membership_expiry,fontys_email,date_of_birth,title,entra_id`,
            { headers: DIRECTUS_HEADERS }
        );
        const existingByEmail = emailRes.data?.data || [];

        let existingUser = existingByEntra;
        let warning = null;

        if (!existingUser && existingByEmail.length > 0) {
            // Case: Found by email but not by entra_id
            if (existingByEmail.length === 1) {
                const user = existingByEmail[0];
                if (!user.entra_id) {
                    warning = {
                        type: 'LINK_REQUIRED',
                        email: email,
                        directusId: user.id,
                        message: `Account gevonden op e-mail, maar heeft nog geen Entra ID gekoppeld.`
                    };
                } else {
                    warning = {
                        type: 'CONFLICT',
                        email: email,
                        directusId: user.id,
                        message: `E-mail match gevonden, maar dit account is al gekoppeld aan een andere Entra ID: ${user.entra_id}`
                    };
                }
            } else {
                warning = {
                    type: 'MULTIPLE_ACCOUNTS',
                    email: email,
                    message: `Meerdere Directus accounts gevonden voor dit e-mailadres.`
                };
            }
        }

        if (warning) {
            // If no linked account exists and we have a warning, we skip to prevent further duplication
            // UNLESS it's a LINK_REQUIRED case (single email match with no entra_id), in which case we link automatically
            if (!existingUser) {
                if ((forceLink || warning?.type === 'LINK_REQUIRED') && existingByEmail.length === 1) {
                    console.log(`[SYNC] 🔗 Auto-linking ${email} (ID: ${existingByEmail[0].id}) to Entra ID ${userId}`);
                    existingUser = existingByEmail[0];
                    // Don't add warning since we're successfully linking
                } else {
                    // Only add warning if we're NOT force linking or it's not a simple link
                    syncStatus.warningCount++;
                    syncStatus.warnings.push(warning);
                    console.log(`[SYNC] ⚠️ Warning for ${email}: ${warning.message}`);
                    console.log(`[SYNC] Skipping ${email} to prevent further duplication. Manual resolution required.`);
                    return;
                }
            } else {
                // User already exists by entra_id but has a warning (e.g., email mismatch)
                syncStatus.warningCount++;
                syncStatus.warnings.push(warning);
                console.log(`[SYNC] ⚠️ Warning for ${email}: ${warning.message}`);
            }
        }

        // Check for duplicate accounts AFTER linking (case-insensitive email check)
        // This catches cases like "Ruben.Dijs@..." and "ruben.dijs@..." existing simultaneously
        if (existingUser && existingByEmail.length > 1) {
            const duplicateWarning = {
                type: 'DUPLICATE_DETECTED',
                email: email,
                message: `Meerdere accounts gevonden voor ${email}. Handmatig opschonen vereist. IDs: ${existingByEmail.map(u => u.id).join(', ')}`
            };
            syncStatus.warningCount++;
            syncStatus.warnings.push(duplicateWarning);
            console.log(`[SYNC] ⚠️ Duplicate accounts detected for ${email}: ${existingByEmail.length} accounts found`);
        }

        // Check if multiple Directus accounts share the same entra_id
        if (existingByEntra && userId) {
            const multipleEntraRes = await axios.get(
                `${process.env.DIRECTUS_URL}/users?filter[entra_id][_eq]=${encodeURIComponent(userId)}&fields=id,email`,
                { headers: DIRECTUS_HEADERS }
            );
            const accountsWithSameEntra = multipleEntraRes.data?.data || [];

            if (accountsWithSameEntra.length > 1) {
                const entraIdWarning = {
                    type: 'DUPLICATE_ENTRA_ID',
                    email: email,
                    message: `Meerdere accounts gekoppeld aan Entra ID ${userId}. Emails: ${accountsWithSameEntra.map(u => u.email).join(', ')}`
                };
                syncStatus.warningCount++;
                syncStatus.warnings.push(entraIdWarning);
                console.log(`[SYNC] ⚠️ Multiple accounts with same entra_id ${userId}: ${accountsWithSameEntra.length} accounts`);
            }
        }
        const payload = {
            email,
            entra_id: userId,
            first_name: firstName || (existingUser?.first_name || null),
            last_name: lastName || (existingUser?.last_name || null),
            fontys_email: email.includes('@student.fontys.nl') ? email : (existingUser?.fontys_email || null),
            phone_number: formatDutchMobile(u.mobilePhone) || (existingUser?.phone_number || null),
            status: 'active',
            ...(role ? { role } : {}),
            membership_expiry: membershipExpiry || (existingUser?.membership_expiry || null),
            date_of_birth: dateOfBirth || (
                (existingUser?.date_of_birth && !existingUser.date_of_birth.startsWith('0001-') && !existingUser.date_of_birth.startsWith('1-01-'))
                    ? existingUser.date_of_birth
                    : null
            ),
            title: u.jobTitle || (existingUser?.title || null),
        };

        console.log(`[SYNC] 📦 Payload for ${email} includes role: ${role ? 'YES (' + role + ')' : 'NO (role field omitted)'}`);

        // Temporary debug: if user has groups but role was not determined, log group details once
        if ((!role || role === null) && Array.isArray(groups) && groups.length > 0) {
            try {
                const gsummary = groups.map(g => `${g.displayName || g.mailNickname || 'unknown'}(${g.id})`).join('; ');
                console.log(`[DEBUG] ${email} groups present but no role determined: ${gsummary}`);
            } catch (e) {
                console.log('[DEBUG] Could not summarize groups for', email);
            }
        }

        let directusUserId;

        if (existingUser) {
            directusUserId = existingUser.id;
            // Normalize existing role value (Directus may return object or id)
            let existingRoleNormalized = null;
            try {
                if (existingUser.role && typeof existingUser.role === 'object') {
                    existingRoleNormalized = existingUser.role.id || existingUser.role;
                } else {
                    existingRoleNormalized = existingUser.role || null;
                }
            } catch (e) {
                existingRoleNormalized = existingUser.role || null;
            }

            console.log(`[SYNC] Existing user ${email}: current role = ${existingRoleNormalized || 'null'}, new role = ${role || 'null (no change)'}`);

            // Build finalPayload early so we can force role inclusion when there's a mismatch
            let finalPayload = payload;
            if (selectedFields) {
                finalPayload = { email }; // Always keep email for context
                selectedFields.forEach(f => {
                    if (payload[f] !== undefined) finalPayload[f] = payload[f];
                });
            }

            // Detect role mismatch between Directus and Entra and force role in payload when needed
            const existingRoleVal = existingRoleNormalized || null;
            const roleMismatch = Boolean(role && existingRoleVal !== role);
            if (roleMismatch) {
                finalPayload.role = role;
                console.log(`[SYNC] ⚠️ Role mismatch for ${email}: existing=${existingRoleVal}, new=${role}. Forcing role in payload.`);
            }

            // Force update if we're adding entra_id to an existing user (linking)
            const entraIdMissing = !existingUser.entra_id && payload.entra_id;
            if (entraIdMissing) {
                finalPayload.entra_id = payload.entra_id;
                console.log(`[SYNC] 🔗 Adding entra_id to existing user ${email}: ${payload.entra_id}`);
            }

            const changes = hasChanges(existingUser, finalPayload, selectedFields) || roleMismatch || entraIdMissing;
            console.log(`[${new Date().toISOString()}] [SYNC] User ${email} exists (ID: ${directusUserId}). Has changes: ${changes}${entraIdMissing ? ' (entra_id linking)' : ''}`);

            if (changes) {
                try {
                    console.log(`[${new Date().toISOString()}] [SYNC] Patching user ${email} with:`, JSON.stringify(finalPayload));
                    const patchRes = await axios.patch(`${process.env.DIRECTUS_URL}/users/${directusUserId}`, finalPayload, { headers: DIRECTUS_HEADERS });
                    console.log(`[${new Date().toISOString()}] ✅ [SYNC] Successfully patched user ${email}. Directus response:`, patchRes.data || '(no body)');
                } catch (patchErr) {
                    console.error(`[${new Date().toISOString()}] ❌ [SYNC] Failed to patch user ${email}:`, patchErr.response?.data || patchErr.message);
                    throw patchErr;
                }
            }
        } else {
            // Always normalize email & external_identifier to lowercase
            const lowercaseEmail = (email || '').toLowerCase();

            // log removed
            payload.email = lowercaseEmail;
            payload.provider = 'microsoft';
            payload.external_identifier = lowercaseEmail;

            const createRes = await axios.post(
                `${process.env.DIRECTUS_URL}/users`,
                payload,
                { headers: DIRECTUS_HEADERS }
            );

            directusUserId = createRes.data.data.id;
            // log removed
        }

        // --- PHOTO SYNC: Entra -> Directus ---
        // We'll compare Graph photo ETag to a stored `photo_etag` on the Directus user.
        // If different (or missing), download the binary and upload to Directus files, then patch the user.avatar and photo_etag.
        async function getGraphPhotoMeta(gUserId) {
            try {
                const client = await getGraphClient();
                const meta = await client.api(`/users/${gUserId}/photo`).get();
                return meta || null;
            } catch (err) {
                // 404 or no photo will end up here; return null so caller can handle removal
                return null;
            }
        }

        async function downloadGraphPhotoBinary(gUserId, token) {
            try {
                const url = `https://graph.microsoft.com/v1.0/users/${gUserId}/photo/$value`;
                const res = await axios.get(url, { responseType: 'arraybuffer', headers: { Authorization: `Bearer ${token}` } });
                return res.data;
            } catch (err) {
                return null;
            }
        }

        async function syncPhotoEntraToDirectus(gUserId, dUserId) {
            try {
                // Fetch Directus user (including stored photo_etag and avatar)
                const d = await axios.get(`${process.env.DIRECTUS_URL}/users/${encodeURIComponent(dUserId)}?fields=id,avatar,photo_etag`, { headers: DIRECTUS_HEADERS });
                const dUser = d.data?.data || {};

                // Get Graph photo metadata (may contain @odata.mediaEtag)
                const client = await getGraphClient();
                let graphMeta = null;
                try {
                    graphMeta = await client.api(`/users/${gUserId}/photo`).get();
                } catch (e) {
                    graphMeta = null;
                }

                const graphEtag = graphMeta?.['@odata.mediaEtag'] || null;

                // If both tags exist and match, skip
                if (graphEtag && dUser.photo_etag && dUser.photo_etag === graphEtag) {
                    // log removed
                    return;
                }

                // If Graph has no photo (deleted), remove Directus avatar if present
                if (!graphMeta) {
                    if (dUser.avatar) {
                        try {
                            await axios.patch(`${process.env.DIRECTUS_URL}/users/${encodeURIComponent(dUserId)}`, { avatar: null, photo_etag: null }, { headers: DIRECTUS_HEADERS });
                            // log removed
                        } catch (err) {
                            console.error('❌ [PHOTO] Failed to remove Directus avatar:', err.response?.data || err.message);
                        }
                    } else {
                        // log removed
                    }
                    return;
                }

                // Need token to download binary
                const tokenRes = await axios.post(
                    `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`,
                    new URLSearchParams({
                        client_id: process.env.CLIENT_ID,
                        client_secret: process.env.CLIENT_SECRET,
                        scope: 'https://graph.microsoft.com/.default',
                        grant_type: 'client_credentials',
                    }),
                    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
                );
                const token = tokenRes.data.access_token;

                const bin = await downloadGraphPhotoBinary(gUserId, token);
                if (!bin) {
                    return;
                }

                // Upload to Directus files
                const FormData = (await import('form-data')).default;
                const form = new FormData();
                form.append('file', Buffer.from(bin), { filename: `${gUserId}.jpg` });
                const uploadRes = await axios.post(`${process.env.DIRECTUS_URL}/files`, form, { headers: { ...DIRECTUS_HEADERS, ...form.getHeaders() } });
                const fileId = uploadRes.data?.data?.id;
                if (!fileId) {
                    console.error('❌ [PHOTO] Directus file upload failed, no file id returned');
                    return;
                }

                // Patch Directus user with new avatar and etag
                try {
                    await axios.patch(`${process.env.DIRECTUS_URL}/users/${encodeURIComponent(dUserId)}`, { avatar: fileId, photo_etag: graphEtag }, { headers: DIRECTUS_HEADERS });
                    // log removed
                } catch (err) {
                    console.error('❌ [PHOTO] Failed to patch Directus user with avatar:', err.response?.data || err.message);
                }
            } catch (err) {
                console.error('❌ [PHOTO] syncPhotoEntraToDirectus error:', err.response?.data || err.message);
            }
        }

        try {
            await syncPhotoEntraToDirectus(u.id, directusUserId);
        } catch (e) {
            console.error('❌ [PHOTO] Error during photo sync:', e.response?.data || e.message);
        }

        await syncCommitteesForUserFromGroups(directusUserId, groups);
        // Membership status is determined by:
        // 1. Being in the "Leden_Actief_Lidmaatschap" group in Entra ID (managed by Nachtwacht script)
        // 2. Having a future membership_expiry date (fallback for sync delays)
        try {
            const today = new Date().toISOString().split('T')[0];
            const isInActieveLeden = groups.some(g =>
                g.id === GROUP_IDS.ACTIEVE_LEDEN ||
                g.displayName === 'Leden_Actief_Lidmaatschap' ||
                g.mailNickname === 'Leden_Actief_Lidmaatschap'
            );

            // If expiry date is in the future, the user is active regardless of group sync status
            const isExpiryActive = membershipExpiry && membershipExpiry >= today;
            const isMember = isInActieveLeden || isExpiryActive;

            console.log(`[SYNC] ${email} membership: active=${isMember} (group=${isInActieveLeden}, expiry=${isExpiryActive}, expiryDate=${membershipExpiry})`);

            // PROTECTION: If membership determination is null/false but the user is ALREADY active in Directus,
            // do not override to 'none' if we couldn't find any expiry attributes. 
            // This prevents race conditions during new registrations.
            if (!isMember && existingUser?.membership_status === 'active' && !membershipExpiry && !isInActieveLeden) {
                console.log(`[SYNC] 🛡️ Protecting 'active' status for ${email} (no new data to justify removal)`);
            } else {
                await setDirectusMembershipStatus(directusUserId, isMember ? 'active' : 'none');
            }
        } catch (e) {
            console.error('❌ [SYNC] Error setting membership_status after committee sync:', e.response?.data || e.message);
        }

        // Track successful sync if no errors, warnings, or missing data for this user
        const hasIssues = syncStatus.errors.some(err => err.email === email) ||
            syncStatus.warnings.some(warn => warn.email === email) ||
            syncStatus.missingData.some(item => item.email === email);

        if (!hasIssues) {
            syncStatus.successCount++;
            syncStatus.successfulUsers.push({ email });
        }
    } catch (error) {
        console.error(`❌ [SYNC] Error syncing Entra user ${userId}:`, error.response?.data || error.message);
        throw error;
    }
}

// Webhook endpoints
app.get('/webhook/entra', (req, res) => {
    const token = req.query.validationToken;
    if (token) return res.status(200).send(token);
    res.sendStatus(200);
});

app.post('/webhook/entra', bodyParser.json(), async (req, res) => {
    const notifications = req.body?.value || [];
    // webhook received; logging removed
    res.sendStatus(202);

    for (const notif of notifications) {
        if (notif.resource && notif.resource.includes('/users/')) {
            const userId = notif.resource.split('/users/')[1].split('/')[0];
            // handling Entra user change; logging removed
            await updateDirectusUserFromGraph(userId);
        }
    }
});

app.post('/webhook/directus', bodyParser.json(), async (req, res) => {
    try {
        const collection = req.body?.collection;
        const payload = req.body?.payload || req.body?.data || {};
        const itemId = req.body?.item || (Array.isArray(req.body?.keys) ? req.body.keys[0] : null);
        res.sendStatus(202);
        if (collection === 'users') {
            const email = payload?.email;
            if (email) {
                // Directus user change (email); logging removed
                await updateGraphUserFromDirectusByEmail(email);
            } else if (itemId) {
                // Directus user change (id); logging removed
                await updateGraphUserFromDirectusById(itemId);
            }
        }
        if (collection === 'committee_members') {
            const userId = payload?.user_id || (payload?.user && payload.user.id) || null;
            if (userId) {
                // Directus committee change for user; logging removed
                await updateGraphUserFromDirectusById(userId);
            }
        }
    } catch (error) {
        console.error('❌ [WEBHOOK] Directus webhook error:', error.response?.data || error.message);
        res.sendStatus(500);
    }
});

// Initial bulk sync endpoint
app.get('/sync/status', (req, res) => {
    res.json(syncStatus);
});

app.post('/sync/initial', bodyParser.json(), async (req, res) => {
    if (syncStatus.active) {
        return res.status(409).json({ error: 'Sync already in progress' });
    }

    const selectedFields = req.body?.fields || null;
    const forceLink = req.body?.forceLink || false;
    const activeOnly = req.body?.activeOnly || false;

    // Start in background
    runBulkSync(selectedFields, forceLink, activeOnly);

    res.status(202).json({ success: true, message: 'Bulk sync started in background' });
});

// Sync a single user by Azure AD user ID
app.post('/sync/user', bodyParser.json(), async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'Missing userId parameter' });
        }

        console.log(`[${new Date().toISOString()}] 🔄 [SYNC] Manual sync requested for user: ${userId}`);

        // Sync this specific user from Entra to Directus
        await updateDirectusUserFromGraph(userId);

        console.log(`[${new Date().toISOString()}] ✅ [SYNC] Successfully synced user: ${userId}`);
        res.json({ success: true, message: `User ${userId} synced successfully` });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] ❌ [SYNC] Error syncing user:`, error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to sync user',
            details: error.response?.data || error.message
        });
    }
});

async function runBulkSync(selectedFields = null, forceLink = false, activeOnly = false) {
    console.log(`[${new Date().toISOString()}] 🚀 [INIT] Bulk sync STARTING... (Fields: ${selectedFields ? selectedFields.join(', ') : 'ALL'}, ActiveOnly: ${activeOnly})`);
    syncStatus = {
        active: true,
        status: 'running',
        total: 0,
        processed: 0,
        errorCount: 0,
        missingDataCount: 0,
        warningCount: 0,
        successCount: 0,
        excludedCount: 0,
        errors: [],
        missingData: [],
        warnings: [],
        successfulUsers: [],
        excludedUsers: [],
        selectedFields: selectedFields,
        startTime: new Date().toISOString(),
        endTime: null,
        lastRunSuccess: null
    };

    try {
        console.log(`[${new Date().toISOString()}] 🔍 [INIT] Building global group name map...`);
        await buildGlobalGroupNameMap();

        const client = await getGraphClient();
        let users = [];

        if (activeOnly) {
            // Fetch only members of the Leden_Actief_Lidmaatschap group
            console.log(`[${new Date().toISOString()}] 📥 [INIT] Fetching ACTIVE members only from group ${GROUP_IDS.ACTIEVE_LEDEN}...`);
            let nextLink = `/groups/${GROUP_IDS.ACTIEVE_LEDEN}/members?$select=id,displayName,givenName,surname,mail,userPrincipalName,mobilePhone&$top=100`;

            while (nextLink) {
                const response = await client.api(nextLink).version('beta').get();
                users = users.concat(response.value);
                nextLink = response['@odata.nextLink'] ? response['@odata.nextLink'].replace('https://graph.microsoft.com/v1.0', '').replace('https://graph.microsoft.com/beta', '') : null;
                console.log(`[${new Date().toISOString()}] 📥 [INIT] Fetched batch. Total active members so far: ${users.length}`);
            }
        } else {
            // Fetch all users
            let nextLink = '/users?$select=id,displayName,givenName,surname,mail,userPrincipalName,mobilePhone,customSecurityAttributes&$top=100';

            console.log(`[${new Date().toISOString()}] 📥 [INIT] Fetching users from Microsoft Graph...`);
            while (nextLink) {
                const response = await client.api(nextLink).version('beta').get();
                users = users.concat(response.value);
                nextLink = response['@odata.nextLink'] ? response['@odata.nextLink'].replace('https://graph.microsoft.com/v1.0', '') : null;
                console.log(`[${new Date().toISOString()}] 📥 [INIT] Fetched batch. Total users so far: ${users.length}`);
            }
        }

        syncStatus.total = users.length;
        console.log(`[${new Date().toISOString()}] ✅ [INIT] Total users to process: ${users.length}`);

        for (let i = 0; i < users.length; i += 10) {
            const batch = users.slice(i, i + 10);
            console.log(`[${new Date().toISOString()}] ⚙️ [INIT] Processing batch ${Math.floor(i / 10) + 1}/${Math.ceil(users.length / 10)}...`);

            await Promise.all(batch.map(async (u) => {
                const userEmail = (u.mail || u.userPrincipalName || 'Unknown').toLowerCase();

                if (shouldExcludeUser(userEmail)) {
                    syncStatus.excludedCount++;
                    syncStatus.excludedUsers.push({ email: userEmail });
                    syncStatus.processed++;
                    return;
                }
                try {
                    await updateDirectusUserFromGraph(u.id, selectedFields, forceLink);
                    syncStatus.processed++;
                } catch (err) {
                    syncStatus.errorCount++;
                    const errorMsg = err.response?.data || err.message;
                    console.error(`[${new Date().toISOString()}] ❌ [INIT] Failed for user ${userEmail}:`, errorMsg);
                    syncStatus.errors.push({
                        email: userEmail,
                        error: typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : String(errorMsg),
                        timestamp: new Date().toISOString()
                    });
                }
            }));
        }

        syncStatus.status = 'completed';
        syncStatus.lastRunSuccess = true;
        console.log(`[${new Date().toISOString()}] ✨ [INIT] Bulk sync COMPLETED. Processed: ${syncStatus.processed}, Errors: ${syncStatus.errorCount}`);
    } catch (error) {
        syncStatus.status = 'failed';
        syncStatus.lastRunSuccess = false;
        const mainError = error.response?.data || error.message;
        console.error(`[${new Date().toISOString()}] 🚨 [INIT] FATAL Bulk sync error:`, mainError);
        syncStatus.errors.push({
            email: 'SYSTEM',
            error: typeof mainError === 'object' ? JSON.stringify(mainError) : String(mainError),
            timestamp: new Date().toISOString()
        });
    } finally {
        syncStatus.active = false;
        syncStatus.endTime = new Date().toISOString();
    }
}

app.post('/sync/directus-to-entra', bodyParser.json(), async (req, res) => {
    try {
        await buildGlobalGroupNameMap();
        const url = `${process.env.DIRECTUS_URL}/users?limit=-1&fields=id,email`;
        const list = await axios.get(url, { headers: DIRECTUS_HEADERS });
        const users = list.data?.data || [];
        for (let i = 0; i < users.length; i += 20) {
            const batch = users.slice(i, i + 20);
            await Promise.all(batch.map(u => u.email ? updateGraphUserFromDirectusByEmail(u.email) : Promise.resolve()));
        }
        res.json({ success: true, processed: users.length });
    } catch (error) {
        console.error('❌ [SYNC] Directus→Entra bulk sync error:', error.response?.data || error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/sync/dob-fix', bodyParser.json(), async (req, res) => {
    console.log(`[${new Date().toISOString()}] 🚀 [FIX] Starting Date of Birth sync from Directus to Azure...`);

    // Check for simple auth via query or body secret if needed, but for now open as it is internal/admin tool
    res.json({ message: "Sync started. Check logs." });

    // Background process
    (async () => {
        try {
            console.log(`[FIX] Using Client ID: ${process.env.CLIENT_ID}`);

            // Bypass getGraphClient() and create a custom privileged client to ensure correct scopes
            const credential = new ClientSecretCredential(
                process.env.TENANT_ID,
                process.env.CLIENT_ID,
                process.env.CLIENT_SECRET
            );

            const client = Client.init({
                authProvider: async (done) => {
                    try {
                        const token = await credential.getToken(['https://graph.microsoft.com/.default']);
                        done(null, token.token);
                    } catch (err) {
                        console.error("Error getting token for FIX:", err);
                        done(err, null);
                    }
                }
            });

            // Fetch all users with date_of_birth from Directus
            const url = `${process.env.DIRECTUS_URL}/users?fields=id,email,first_name,last_name,date_of_birth,entra_id&filter[date_of_birth][_nnull]=true&limit=-1`;
            const response = await axios.get(url, { headers: DIRECTUS_HEADERS });
            const users = response.data?.data || [];

            console.log(`[FIX] Found ${users.length} users with dob in Directus.`);
            let success = 0, failed = 0, skipped = 0;

            for (const user of users) {
                if (!user.entra_id) {
                    skipped++;
                    continue;
                }
                if (!user.date_of_birth || user.date_of_birth.startsWith('0001-') || user.date_of_birth.startsWith('1-01-')) {
                    skipped++;
                    continue;
                }

                try {
                    // Clean up date: extract YYYY-MM-DD part if it includes time
                    let cleanDob = user.date_of_birth;
                    if (cleanDob.includes('T')) {
                        cleanDob = cleanDob.split('T')[0];
                    }

                    // DEBUG: Verify we can at least READ the user (checks User.Read.All)
                    try {
                        await client.api(`/users/${user.entra_id}`).select('id,userPrincipalName').get();
                    } catch (readErr) {
                        console.error(`❌ [FIX] READ Check Failed for ${user.email}: ${readErr.statusCode} - ${readErr.message}`);
                    }

                    // Proceed with PATCH
                    console.log(`[FIX] Attempting PATCH for ${user.email} (DOB: ${cleanDob})...`);
                    await client.api(`/users/${user.entra_id}`).patch({
                        birthday: `${cleanDob}T04:04:04Z`
                    });

                    success++;
                    if (success % 10 === 0) console.log(`[FIX] Progress: ${success} updated...`);

                } catch (e) {
                    console.error(`❌ [FIX] Failed for ${user.email} (${user.entra_id}):`);
                    console.error(`   Status: ${e.statusCode}`);
                    console.error(`   Code: ${e.body?.error?.code || e.code}`);
                    console.error(`   Message: ${e.body?.error?.message || e.message}`);
                    if (e.body) console.error(`   Full Body: ${JSON.stringify(e.body)}`);
                    failed++;
                }

                // Rate limit protection
                await new Promise(r => setTimeout(r, 100));
            }
            console.log(`[FIX] Complete. Success: ${success}, Failed: ${failed}, Skipped: ${skipped}`);
        } catch (e) {
            console.error(`[FIX] Fatal error: ${e.message}`);
        }
    })();
});

app.listen(PORT, async () => {
    // startup logs removed
    try {
        await buildGlobalGroupNameMap();
    } catch (error) {
        console.error('❌ [INIT] Group map build error:', error.response?.data || error.message);
    }
});
