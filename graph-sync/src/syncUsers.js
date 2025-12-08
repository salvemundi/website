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
    COMMISSIE_LEIDER: '91d77972-2695-4b7b-a0a0-df7d6523a087',
    BESTUUR: 'b16d93c7-42ef-412e-afb3-f6cbe487d0e0',
    ICT: 'a4aeb401-882d-4e1e-90ee-106b7fdb23cc',
    // add any others you care about
};

// Manual override mapping (optional) – if you want to force certain group IDs to specific names
const GROUP_NAME_MAP = {
    '91d77972-2695-4b7b-a0a0-df7d6523a087': 'Commissie Leider',
    'b16d93c7-42ef-412e-afb3-f6cbe487d0e0': 'Bestuur',
    'a4aeb401-882d-4e1e-90ee-106b7fdb23cc': 'ICTCommissie',
    // add more mapping entries as needed
};

const ROLE_IDS = {
    ACTIEVE_LEDEN: '82fe4735-4724-48af-9d37-ee85e1c5441e',
    COMMISSIE_LEIDER: 'fc3b226a-62f8-437a-a7fa-7c631e48aaff',
    BESTUUR: 'a0e51e23-15ef-4e04-a188-5c483484b0be',
    ADMIN: 'd671fd7a-cfcb-4bdc-afb8-1a96bc2d5d50',
};

const DIRECTUS_HEADERS = {
    Authorization: `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`,
};

const syncLock = new Map();
const LOCK_TTL = 5000;

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
        console.log(`✅ [DIRECTUS] Set membership_status='${status}' for user ${userId}`);
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
    console.log('🔑 [GRAPH] Requesting token...');
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
    console.log('✅ [GRAPH] Token acquired');
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
        console.log(`📥 [GRAPH] Fetched ${groups.length} groups, total so far: ${allGroups.length}`);
        nextLink = response['@odata.nextLink'] ? response['@odata.nextLink'].replace('https://graph.microsoft.com/v1.0', '') : null;
    }

    console.log(`📊 [GRAPH] Total groups fetched: ${allGroups.length}`);

    allGroups.forEach(g => {
        const name = g.displayName || g.mailNickname || g.id;
        groupNameMapGlobal[g.id] = name;
        if (name) groupIdByNameGlobal[name] = g.id;
    });

    console.log('🧮 [GROUP-MAP] groupId → name:', groupNameMapGlobal);
}

function getRoleIdByGroupMembership(groupIds) {
    if (groupIds.includes(GROUP_IDS.ICT)) return ROLE_IDS.ADMIN;
    if (groupIds.includes(GROUP_IDS.BESTUUR)) return ROLE_IDS.BESTUUR;
    if (groupIds.includes(GROUP_IDS.COMMISSIE_LEIDER)) return ROLE_IDS.COMMISSIE_LEIDER;
    return ROLE_IDS.ACTIEVE_LEDEN;
}

function hasChanges(existing, newData) {
    const fields = ['first_name', 'last_name', 'phone_number', 'fontys_email', 'role', 'status'];
    return fields.some(field => existing[field] !== newData[field]);
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

    console.log(`🏛️ [COMMITTEE] Resolving committee for group id=${groupId}, using name='${desiredName}'`);

    try {
        const searchUrl = `${baseUrl}?filter[name][_eq]=${encodeURIComponent(desiredName)}&limit=1`;
        const searchRes = await axios.get(searchUrl, { headers: DIRECTUS_HEADERS });
        const found = searchRes.data?.data?.[0];
        if (found) {
            console.log(`🏛️ [COMMITTEE] Found existing committee '${desiredName}' (id=${found.id})`);
            return { id: found.id, name: found.name };
        }
    } catch (error) {
        console.error('❌ [DIRECTUS] Error looking up committee by name:', error.response?.data || error.message);
    }

    console.log(`🏗️ [COMMITTEE] Creating new committee with name '${desiredName}'`);
    try {
        const createRes = await axios.post(baseUrl, { name: desiredName }, { headers: DIRECTUS_HEADERS });
        console.log(`✅ [COMMITTEE] Created committee with name='${desiredName}', id=${createRes.data.data.id}`);
        return { id: createRes.data.data.id, name: desiredName };
    } catch (error) {
        console.error('❌ [DIRECTUS] Error creating committee:', error.response?.data || error.message);
        throw error;
    }
}

async function ensureUserInCommittee(userId, committeeId) {
    const baseUrl = `${process.env.DIRECTUS_URL}/items/committee_members`;
    console.log(`🔎 [MEMBER] Checking if user ${userId} is already in committee ${committeeId}`);

    try {
        const checkUrl = `${baseUrl}?filter[user_id][_eq]=${encodeURIComponent(userId)}&filter[committee_id][_eq]=${encodeURIComponent(committeeId)}&limit=1`;
        const checkRes = await axios.get(checkUrl, { headers: DIRECTUS_HEADERS });
        const existing = checkRes.data?.data || [];
        if (existing.length > 0) {
            console.log(`⏭️ [MEMBER] User ${userId} already in committee ${committeeId} (membership id=${existing[0].id})`);
            return;
        }
    } catch (error) {
        console.error('❌ [MEMBER] Error checking membership:', error.response?.data || error.message);
    }

    console.log(`➕ [MEMBER] Adding user ${userId} to committee ${committeeId}`);
    try {
        const createRes = await axios.post(
            `${process.env.DIRECTUS_URL}/items/committee_members`,
            { committee_id: committeeId, user_id: userId, is_visible: true, is_leader: false },
            { headers: DIRECTUS_HEADERS }
        );
        console.log(`✅ [MEMBER] Added membership id=${createRes.data.data.id} for user ${userId}`);
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

    console.log(`🧹 [MEMBER] Removing stale memberships for user ${userId}. Allowed committee names:`, Array.from(currentCommitteeNames));

    try {
        const params = new URLSearchParams();
        params.append('filter[user_id][_eq]', userId);
        params.append('fields', 'id,committee_id');
        params.append('limit', '-1');
        const url = `${cmUrl}?${params.toString()}`;
        const res = await axios.get(url, { headers: DIRECTUS_HEADERS });
        const memberships = res.data?.data || [];
        console.log(`📋 [MEMBER] User ${userId} has ${memberships.length} committee membership(s)`);

        for (const m of memberships) {
            const membershipId = m.id;
            const committeeId = m.committee_id;
            if (!committeeId) {
                console.log(`⚠️ [MEMBER] membership id=${membershipId} missing committee_id, skipping`);
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
                console.log(`⚠️ [MEMBER] Committee id=${committeeId} name missing, skipping removal logic`);
                continue;
            }
            if (!currentCommitteeNames.has(committeeName)) {
                console.log(`❌ [MEMBER] Removing membership id=${membershipId} for user ${userId} from committee '${committeeName}'`);
                try {
                    await axios.delete(`${cmUrl}/${membershipId}`, { headers: DIRECTUS_HEADERS });
                    console.log(`✅ [MEMBER] Deleted membership id=${membershipId}`);
                } catch (error) {
                    console.error(`❌ [MEMBER] Error deleting membership id=${membershipId}:`, error.response?.data || error.message);
                }
                // continue loop — we'll check remaining memberships after processing all deletions
            } else {
                console.log(`✅ [MEMBER] Keeping membership id=${membershipId} for committee '${committeeName}'`);
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
        console.log(`🏛️ [COMMITTEE] No groups for user ${directusUserId}, removing all memberships`);
        await removeUserFromMissingCommittees(directusUserId, new Set());
        return;
    }

    console.log(`🏛️ [COMMITTEE] Syncing committees for user ${directusUserId}, ${groups.length} group(s)`);

    const currentCommitteeNames = new Set();

    for (const g of groups) {
        const groupId = g.id;
        const committeeName = GROUP_NAME_MAP[groupId] || groupNameMapGlobal[groupId] || g.displayName || g.mailNickname || groupId;
        console.log(`➡️ [COMMITTEE] Group id=${groupId} → committeeName='${committeeName}'`);

        const result = await getOrCreateCommitteeForGroup(g);
        if (!result) {
            console.log(`⚠️ [COMMITTEE] Could not resolve committee for group id=${groupId}`);
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
            console.log(`✅ [GRAPH] Added user ${graphUserId} to group ${gid}`);
        } catch (error) {
            console.error('❌ [GRAPH] Add group member error:', error.response?.data || error.message);
        }
    }
    for (const gid of toRemove) {
        try {
            await client.api(`/groups/${gid}/members/${graphUserId}/$ref`).delete();
            console.log(`✅ [GRAPH] Removed user ${graphUserId} from group ${gid}`);
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
        console.log(`✅ [GRAPH] Updated fields for user ${graphUserId}`);
    } catch (error) {
        console.error('❌ [GRAPH] Update user error:', error.response?.data || error.message);
    }
}

async function updateGraphUserFromDirectusByEmail(email) {
    const graphUser = await findGraphUserByEmail(email.toLowerCase());
    if (!graphUser) {
        console.log(`⚠️ [GRAPH] No user found for email ${email}`);
        return;
    }
    const lockKey = `entra-${graphUser.id}`;
    if (!acquireLock(lockKey)) {
        console.log(`⏭️ [LOCK] Skipping ${email} (already syncing)`);
        return;
    }
    const dUser = await getDirectusUserByEmail(email.toLowerCase());
    if (!dUser) {
        console.log(`⚠️ [DIRECTUS] No Directus user for email ${email}`);
        return;
    }
    await updateGraphUserFieldsFromDirectus(graphUser.id, dUser);
    const names = await getDirectusCommitteeNamesForUser(dUser.id);
    await syncGraphGroupsForUser(graphUser.id, names);
}

async function updateGraphUserFromDirectusById(directusUserId) {
    const dUser = await getDirectusUserById(directusUserId);
    if (!dUser || !dUser.email) {
        console.log(`⚠️ [DIRECTUS] Missing Directus user or email for id ${directusUserId}`);
        return;
    }
    await updateGraphUserFromDirectusByEmail(dUser.email);
}

async function updateDirectusUserFromGraph(userId) {
    const lockKey = `entra-${userId}`;
    if (!acquireLock(lockKey)) {
        console.log(`⏭️ [LOCK] Skipping ${userId} (already syncing)`);
        return;
    }

    console.log(`🚦 [SYNC] Starting Entra → Directus for userId=${userId}`);

    try {
        const client = await getGraphClient();

        const u = await client.api(`/users/${userId}`)
            .select('id,displayName,givenName,surname,mail,userPrincipalName,mobilePhone')
            .get();

        console.log(`📥 [GRAPH] Fetched user id=${u.id}, displayName='${u.displayName}'`);

        const groupResp = await client.api(`/users/${userId}/memberOf/microsoft.graph.group`)
            .select('id,displayName,mailNickname')
            .get();

        const groups = groupResp.value || [];
        console.log(`📚 [GRAPH] User ${u.userPrincipalName} is in ${groups.length} group(s)`);

        const email = (u.mail || u.userPrincipalName || '').toLowerCase();
        const role = getRoleIdByGroupMembership(groups.map(g => g.id));

        const existingRes = await axios.get(
            `${process.env.DIRECTUS_URL}/users?filter[email][_eq]=${encodeURIComponent(email)}`,
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
            role,
        };

        let directusUserId;

        if (existingUser) {
            directusUserId = existingUser.id;
            console.log(`👤 [DIRECTUS] Existing user id=${directusUserId}, email=${existingUser.email}`);
            if (hasChanges(existingUser, payload)) {
                console.log(`✏️ [DIRECTUS] Updating user ${email}`);
                await axios.patch(`${process.env.DIRECTUS_URL}/users/${directusUserId}`, payload, { headers: DIRECTUS_HEADERS });
                console.log(`✅ [DIRECTUS] Updated user ${email}`);
            } else {
                console.log(`⏭️ [DIRECTUS] No changes for user ${email}`);
            }
        } else {
            // Always normalize email & external_identifier to lowercase
            const lowercaseEmail = (email || '').toLowerCase();

            console.log(`✨ [DIRECTUS] Creating user ${lowercaseEmail}`);
            payload.email = lowercaseEmail;
            payload.provider = 'microsoft';
            payload.external_identifier = lowercaseEmail;

            const createRes = await axios.post(
                `${process.env.DIRECTUS_URL}/users`,
                payload,
                { headers: DIRECTUS_HEADERS }
            );

            directusUserId = createRes.data.data.id;
            console.log(`✅ [DIRECTUS] Created user id=${directusUserId}`);
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
                    console.log(`⏭️ [PHOTO] No change for user ${gUserId} (etag matches)`);
                    return;
                }

                // If Graph has no photo (deleted), remove Directus avatar if present
                if (!graphMeta) {
                    if (dUser.avatar) {
                        try {
                            await axios.patch(`${process.env.DIRECTUS_URL}/users/${encodeURIComponent(dUserId)}`, { avatar: null, photo_etag: null }, { headers: DIRECTUS_HEADERS });
                            console.log(`🗑️ [PHOTO] Removed Directus avatar for user ${dUserId} because Entra photo is missing`);
                        } catch (err) {
                            console.error('❌ [PHOTO] Failed to remove Directus avatar:', err.response?.data || err.message);
                        }
                    } else {
                        console.log(`⏭️ [PHOTO] No Entra photo and no Directus avatar for user ${dUserId}`);
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
                    console.log(`⚠️ [PHOTO] Unable to download photo for Graph user ${gUserId}`);
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
                    console.log(`✅ [PHOTO] Uploaded and set avatar (file id=${fileId}) for Directus user ${dUserId}`);
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

        console.log(`🏛️ [COMMITTEE] Starting committee sync for user id=${directusUserId} (${email})`);
        await syncCommitteesForUserFromGroups(directusUserId, groups);
        console.log(`🏁 [COMMITTEE] Finished committee sync for user id=${directusUserId} (${email})`);
        // Ensure membership_status aligns with current memberships
        try {
            const has = (groups && groups.length > 0) || await userHasAnyMemberships(directusUserId);
            await setDirectusMembershipStatus(directusUserId, has ? 'active' : 'none');
        } catch (e) {
            console.error('❌ [SYNC] Error setting membership_status after committee sync:', e.response?.data || e.message);
        }
    } catch (error) {
        console.error(`❌ [SYNC] Error syncing Entra user ${userId}:`, error.response?.data || error.message);
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
    console.log(`🔔 [WEBHOOK] Received ${notifications.length} notification(s)`);
    res.sendStatus(202);

    for (const notif of notifications) {
        if (notif.resource && notif.resource.includes('/users/')) {
            const userId = notif.resource.split('/users/')[1].split('/')[0];
            console.log(`🔔 [WEBHOOK] Handling Entra user change userId=${userId}`);
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
                console.log(`🔔 [WEBHOOK] Directus user change email=${email}`);
                await updateGraphUserFromDirectusByEmail(email);
            } else if (itemId) {
                console.log(`🔔 [WEBHOOK] Directus user change id=${itemId}`);
                await updateGraphUserFromDirectusById(itemId);
            }
        }
        if (collection === 'committee_members') {
            const userId = payload?.user_id || (payload?.user && payload.user.id) || null;
            if (userId) {
                console.log(`🔔 [WEBHOOK] Directus committee change for user ${userId}`);
                await updateGraphUserFromDirectusById(userId);
            }
        }
    } catch (error) {
        console.error('❌ [WEBHOOK] Directus webhook error:', error.response?.data || error.message);
        res.sendStatus(500);
    }
});

// Initial bulk sync endpoint
app.post('/sync/initial', async (req, res) => {
    try {
        console.log('🚀 [INIT] Building global group map and starting initial bulk sync...');
        await buildGlobalGroupNameMap();

        const client = await getGraphClient();
        let users = [];
        let nextLink = '/users?$select=id,displayName,givenName,surname,mail,userPrincipalName,mobilePhone&$top=100';

        while (nextLink) {
            console.log(`📥 [INIT] Fetching users batch: ${nextLink}`);
            const response = await client.api(nextLink).get();
            users = users.concat(response.value);
            nextLink = response['@odata.nextLink'] ? response['@odata.nextLink'].replace('https://graph.microsoft.com/v1.0', '') : null;
        }

        console.log(`📊 [INIT] Found ${users.length} users`);

        for (let i = 0; i < users.length; i += 20) {
            const batch = users.slice(i, i + 20);
            await Promise.all(batch.map(u => updateDirectusUserFromGraph(u.id)));
        }

        console.log('✅ [INIT] Bulk sync finished');
        res.json({ success: true, processed: users.length });
    } catch (error) {
        console.error('❌ [INIT] Bulk sync error:', error.response?.data || error.message);
        res.status(500).json({ error: error.message });
    }
});

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
    console.log(`🚀 Sync server running on port ${PORT}`);
    console.log(`📡 Entra webhook: POST http://localhost:${PORT}/webhook/entra`);
    console.log(`📡 Directus webhook: POST http://localhost:${PORT}/webhook/directus`);
    console.log(`🔄 Initial sync endpoint: POST http://localhost:${PORT}/sync/initial`);
    console.log(`🔄 Directus→Entra sync endpoint: POST http://localhost:${PORT}/sync/directus-to-entra`);
    try {
        await buildGlobalGroupNameMap();
    } catch (error) {
        console.error('❌ [INIT] Group map build error:', error.response?.data || error.message);
    }
});
