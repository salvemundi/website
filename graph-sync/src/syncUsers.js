// Real-time bidirectional sync between Entra ID <-> Directus

import 'dotenv/config';
import axios from 'axios';
import express from 'express';
import bodyParser from 'body-parser';
import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';

const app = express();
const PORT = process.env.PORT || 3001;

// Define your known group IDs
const GROUP_IDS = {
    COMMISSIE_LEIDER: 'fc3b226a-62f8-437a-a7fa-7c631e48aaff',
    BESTUUR: 'b16d93c7-42ef-412e-afb3-f6cbe487d0e0',
    ICT: 'a4aeb401-882d-4e1e-90ee-106b7fdb23cc',
    CommitteeMember: '5848f0ed-59c4-4ae2-8683-3d9a221ac189'

    // add any others you care about
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
    CommitteeMember: '5848f0ed-59c4-4ae2-8683-3d9a221ac189'
};

// Hardcode committee groups here (names or IDs). If you provide names, they will be
// resolved to IDs after the global group map is built. Example:
// const HARDCODE_COMMITTEE_GROUPS = ['Actieve Leden', '5848f0ed-59c4-4ae2-8683-3d9a221ac189'];
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
let COMMITTEE_GROUP_IDS = (process.env.COMMITTEE_GROUP_IDS && process.env.COMMITTEE_GROUP_IDS.split(',').map(s => s.trim()).filter(Boolean)) || [GROUP_IDS.CommitteeMember];

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
    errors: [], // [{ email: string, error: string, timestamp: string }]
    missingData: [], // [{ email: string, reason: string }]
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
    // Preserve explicit special-group roles first
    if (Array.isArray(groupIds) && groupIds.length > 0) {
        if (groupIds.includes(GROUP_IDS.ICT)) return ROLE_IDS.ADMIN;
        if (groupIds.includes(GROUP_IDS.BESTUUR)) return ROLE_IDS.BESTUUR;
        if (groupIds.includes(GROUP_IDS.COMMISSIE_LEIDER)) return ROLE_IDS.COMMISSIE_LEIDER;
        // If the user is member of any configured committee group, treat them as a committee member
        for (const gid of groupIds) {
            if (COMMITTEE_GROUP_IDS.includes(gid)) return ROLE_IDS.CommitteeMember;
        }
    }

    // No Entra groups found -> don't force a role change
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

async function updateDirectusUserFromGraph(userId, selectedFields = null) {
    const lockKey = `entra-${userId}`;
    if (!acquireLock(lockKey)) {
        return;
    }

    try {
        const client = await getGraphClient();

        const u = await client.api(`/users/${userId}`)
            .version('beta')
            .select('id,displayName,givenName,surname,mail,userPrincipalName,mobilePhone,customSecurityAttributes')
            .get();

        const attributes = u.customSecurityAttributes?.SalveMundiLidmaatschap;
        console.log(`[${new Date().toISOString()}] [SYNC] User keys for ${u.mail || u.id}:`, Object.keys(u).join(', '));
        console.log(`[${new Date().toISOString()}] [SYNC] Full customSecurityAttributes for ${u.mail || u.id}:`, u.customSecurityAttributes ? JSON.stringify(u.customSecurityAttributes) : 'UNDEFINED');
        console.log(`[${new Date().toISOString()}] [SYNC] SalveMundiLidmaatschap attributes:`, attributes ? JSON.stringify(attributes) : 'NULL');

        let membershipExpiry = null;
        if (attributes?.VerloopdatumStr) {
            const v = attributes.VerloopdatumStr; // yyyyMMdd
            if (v && v.length === 8) {
                membershipExpiry = `${v.substring(0, 4)}-${v.substring(4, 6)}-${v.substring(6, 8)}`;
                console.log(`[${new Date().toISOString()}] [SYNC] Parsed expiry: ${membershipExpiry}`);
            }
        }

        const missingFields = [];
        const isSelected = (field) => !selectedFields || selectedFields.includes(field);

        if (isSelected('membership_expiry') && !membershipExpiry) missingFields.push('Lidmaatschap vervaldatum');
        if (isSelected('first_name') && !u.givenName) missingFields.push('Voornaam');
        if (isSelected('last_name') && !u.surname) missingFields.push('Achternaam');
        if (isSelected('display_name') && !u.displayName) missingFields.push('Display naam');
        if (isSelected('phone_number') && !u.mobilePhone) missingFields.push('Mobiel nummer');

        if (missingFields.length > 0) {
            syncStatus.missingDataCount++;
            syncStatus.missingData.push({
                email: (u.mail || u.userPrincipalName || 'Unknown').toLowerCase(),
                reason: `Missende velden: ${missingFields.join(', ')}`
            });
        }

        // log removed

        const groupResp = await client.api(`/users/${userId}/memberOf/microsoft.graph.group`)
            .select('id,displayName,mailNickname')
            .get();

        const groups = groupResp.value || [];
        // log removed

        const email = (u.mail || u.userPrincipalName || '').toLowerCase();
        const role = getRoleIdByGroupMembership(groups.map(g => g.id));

        const existingRes = await axios.get(
            `${process.env.DIRECTUS_URL}/users?filter[email][_eq]=${encodeURIComponent(email)}&fields=id,email,first_name,last_name,phone_number,status,role,membership_expiry,fontys_email`,
            { headers: DIRECTUS_HEADERS }
        );

        const existingUser = existingRes.data?.data?.[0] || null;

        const payload = {
            email,
            first_name: u.givenName || (u.displayName ? u.displayName.split(' ')[0] : 'Unknown'),
            last_name: u.surname || (u.displayName ? u.displayName.split(' ').slice(-1).join(' ') : 'Unknown'),
            fontys_email: email.includes('@student.fontys.nl') ? email : null,
            phone_number: formatDutchMobile(u.mobilePhone),
            status: 'active',
            // Only include role when it was explicitly determined from Entra groups
            ...(role ? { role } : {}),
            membership_expiry: membershipExpiry,
        };

        let directusUserId;

        if (existingUser) {
            directusUserId = existingUser.id;
            const changes = hasChanges(existingUser, payload, selectedFields);
            console.log(`[${new Date().toISOString()}] [SYNC] User ${email} exists (ID: ${directusUserId}). Has changes: ${changes}`);

            if (changes) {
                // Only send selected fields in patch if we are being selective
                let finalPayload = payload;
                if (selectedFields) {
                    finalPayload = { email }; // Always keep email for context
                    selectedFields.forEach(f => {
                        if (payload[f] !== undefined) finalPayload[f] = payload[f];
                    });
                }

                try {
                    console.log(`[${new Date().toISOString()}] [SYNC] Patching user ${email} with:`, JSON.stringify(finalPayload));
                    await axios.patch(`${process.env.DIRECTUS_URL}/users/${directusUserId}`, finalPayload, { headers: DIRECTUS_HEADERS });
                    console.log(`[${new Date().toISOString()}] ✅ [SYNC] Successfully patched user ${email}`);
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
        // Membership status is determined by the "Actieve Leden" group, which is managed by the Nachtwacht script
        // The Nachtwacht script checks membership_expiry and moves users between Actief/Verlopen groups
        try {
            const isInActieveLeden = groups.some(g => g.id === GROUP_IDS.ACTIEVE_LEDEN);
            await setDirectusMembershipStatus(directusUserId, isInActieveLeden ? 'active' : 'none');
        } catch (e) {
            console.error('❌ [SYNC] Error setting membership_status after committee sync:', e.response?.data || e.message);
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

    // Start in background
    runBulkSync(selectedFields);

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

async function runBulkSync(selectedFields = null) {
    console.log(`[${new Date().toISOString()}] 🚀 [INIT] Bulk sync STARTING... (Fields: ${selectedFields ? selectedFields.join(', ') : 'ALL'})`);
    syncStatus = {
        active: true,
        status: 'running',
        total: 0,
        processed: 0,
        errorCount: 0,
        missingDataCount: 0,
        errors: [],
        missingData: [],
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
        let nextLink = '/users?$select=id,displayName,givenName,surname,mail,userPrincipalName,mobilePhone,customSecurityAttributes&$top=100';

        console.log(`[${new Date().toISOString()}] 📥 [INIT] Fetching users from Microsoft Graph...`);
        while (nextLink) {
            const response = await client.api(nextLink).version('beta').get();
            users = users.concat(response.value);
            nextLink = response['@odata.nextLink'] ? response['@odata.nextLink'].replace('https://graph.microsoft.com/v1.0', '') : null;
            console.log(`[${new Date().toISOString()}] 📥 [INIT] Fetched batch. Total users so far: ${users.length}`);
        }

        syncStatus.total = users.length;
        console.log(`[${new Date().toISOString()}] ✅ [INIT] Total users to process: ${users.length}`);

        for (let i = 0; i < users.length; i += 10) {
            const batch = users.slice(i, i + 10);
            console.log(`[${new Date().toISOString()}] ⚙️ [INIT] Processing batch ${Math.floor(i / 10) + 1}/${Math.ceil(users.length / 10)}...`);

            await Promise.all(batch.map(async (u) => {
                const userEmail = (u.mail || u.userPrincipalName || 'Unknown').toLowerCase();

                if (shouldExcludeUser(userEmail)) {
                    // console.log(`[${new Date().toISOString()}] ⏭️ [INIT] Skipping excluded user: ${userEmail}`);
                    return;
                }

                try {
                    await updateDirectusUserFromGraph(u.id, selectedFields);
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

app.listen(PORT, async () => {
    // startup logs removed
    try {
        await buildGlobalGroupNameMap();
    } catch (error) {
        console.error('❌ [INIT] Group map build error:', error.response?.data || error.message);
    }
});
