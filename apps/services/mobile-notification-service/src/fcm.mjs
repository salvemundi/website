// Firebase Cloud Messaging HTTP v1 sender for Android devices. Delivery is OFF unless
// MOBILE_FCM_ENABLED=true, and every APNs gate (acceptance, allowlist, pilot, sandbox)
// still applies through the worker. Credentials come only from the environment.
import { createPrivateKey, sign } from 'node:crypto';

export const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
export const FCM_DEFAULT_TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const FCM_DEFAULT_API_BASE_URL = 'https://fcm.googleapis.com';
// Hosts a test endpoint override may point at: a local fake sender only, never a remote
// server (a signed assertion is a credential and must never leave the machine).
const testHosts = new Set(['localhost', '127.0.0.1', '[::1]', '10.0.2.2', 'host.docker.internal']);

export function fcmEnabled(env) {
    return env.MOBILE_FCM_ENABLED === 'true';
}

export function fcmTestEndpointsAllowed(env) {
    return env.NODE_ENV === 'test' || (env.NODE_ENV !== 'production' && env.MOBILE_FCM_TEST_ENDPOINTS === 'true');
}

function testURL(value) {
    try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol) && testHosts.has(url.hostname) && !url.username && !url.password ? url.href.replace(/\/$/, '') : null;
    } catch { return null; }
}

export function fcmEndpoints(env) {
    if (!env.FCM_API_BASE_URL && !env.FCM_TOKEN_URL) return { apiBaseURL: FCM_DEFAULT_API_BASE_URL, tokenURL: FCM_DEFAULT_TOKEN_URL, overridden: false };
    if (!fcmTestEndpointsAllowed(env)) throw new Error('FCM_TEST_ENDPOINT_REFUSED');
    const apiBaseURL = env.FCM_API_BASE_URL ? testURL(env.FCM_API_BASE_URL) : FCM_DEFAULT_API_BASE_URL;
    const tokenURL = env.FCM_TOKEN_URL ? testURL(env.FCM_TOKEN_URL) : FCM_DEFAULT_TOKEN_URL;
    // Overriding only one endpoint would send a real request with test material or vice versa.
    if (!apiBaseURL || !tokenURL || apiBaseURL === FCM_DEFAULT_API_BASE_URL || tokenURL === FCM_DEFAULT_TOKEN_URL) throw new Error('FCM_TEST_ENDPOINT_REFUSED');
    return { apiBaseURL, tokenURL, overridden: true };
}

export function fcmCredentials(env) {
    let account = {};
    if (env.FCM_SERVICE_ACCOUNT_JSON) {
        try { account = JSON.parse(env.FCM_SERVICE_ACCOUNT_JSON); } catch { throw new Error('FCM_CONFIGURATION_INVALID'); }
        if (!account || typeof account !== 'object' || (account.type && account.type !== 'service_account')) throw new Error('FCM_CONFIGURATION_INVALID');
    }
    const projectID = env.FCM_PROJECT_ID || account.project_id || '';
    const clientEmail = env.FCM_CLIENT_EMAIL || account.client_email || '';
    const privateKey = String(env.FCM_PRIVATE_KEY || account.private_key || '').replace(/\\+n/g, '\n');
    if (!projectID || !clientEmail || !privateKey) throw new Error('FCM_CONFIGURATION_MISSING');
    if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectID) || !/^[^\s@/]{1,100}@[a-z0-9.-]{1,150}$/.test(clientEmail)) throw new Error('FCM_CONFIGURATION_INVALID');
    let key;
    try { key = createPrivateKey(privateKey); } catch { throw new Error('FCM_CONFIGURATION_INVALID'); }
    if (key.asymmetricKeyType !== 'rsa') throw new Error('FCM_CONFIGURATION_INVALID');
    return { projectID, clientEmail, key, keyID: typeof account.private_key_id === 'string' ? account.private_key_id : undefined };
}

// OAuth2 service-account flow: RS256 JWT assertion exchanged for a cached access token.
export function serviceAccountAssertion(credentials, tokenURL, now = Date.now()) {
    const iat = Math.floor(now / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', ...(credentials.keyID ? { kid: credentials.keyID } : {}) })).toString('base64url');
    const claims = Buffer.from(JSON.stringify({ iss: credentials.clientEmail, scope: FCM_SCOPE, aud: tokenURL, iat, exp: iat + 3600 })).toString('base64url');
    const input = `${header}.${claims}`;
    return `${input}.${sign('sha256', Buffer.from(input), credentials.key).toString('base64url')}`;
}

let cachedAccess;
export function resetFCMAccessToken() { cachedAccess = undefined; }
export async function fcmAccessToken(env, { fetch = globalThis.fetch, now = Date.now() } = {}) {
    const credentials = fcmCredentials(env);
    const { tokenURL } = fcmEndpoints(env);
    const cacheKey = `${credentials.clientEmail}|${credentials.projectID}|${tokenURL}`;
    if (cachedAccess && cachedAccess.cacheKey === cacheKey && cachedAccess.expiresAt - 5 * 60 * 1000 > now) return cachedAccess.value;
    const response = await fetch(tokenURL, {
        method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: serviceAccountAssertion(credentials, tokenURL, now) }).toString(),
        signal: AbortSignal.timeout(10000)
    });
    let body;
    try { body = await response.json(); } catch { body = {}; }
    // Never include the response body: it may echo account identifiers.
    if (!response.ok || typeof body?.access_token !== 'string' || !body.access_token) throw new Error('FCM_AUTH_FAILED');
    const lifetime = Number(body.expires_in) > 0 ? Number(body.expires_in) : 3600;
    cachedAccess = { cacheKey, value: body.access_token, expiresAt: now + Math.min(lifetime, 3600) * 1000 };
    return cachedAccess.value;
}

// Android receives a data-only message so the app always builds the notification and can route it.
// Every value is a string: kind, activityID ("event:<digits>"), title, body and optionally url.
export function fcmMessage(device, payload, collapseID, kind) {
    const alert = payload?.aps?.alert ?? {};
    const data = { kind: String(kind ?? payload?.kind ?? ''), title: String(alert.title ?? payload?.title ?? 'Salve Mundi'), body: String(alert.body ?? payload?.body ?? '') };
    if (typeof payload?.activityID === 'string' && /^event:[1-9][0-9]*$/.test(payload.activityID)) data.activityID = payload.activityID;
    if (typeof payload?.url === 'string' && payload.url) data.url = payload.url;
    if (!data.kind) delete data.kind;
    return { token: device.token, data, android: { priority: 'HIGH', ttl: '3600s', collapse_key: String(collapseID).slice(0, 64) } };
}

function fcmReason(body) {
    const error = body?.error ?? {};
    const details = Array.isArray(error.details) ? error.details : [];
    const code = details.find(detail => typeof detail?.errorCode === 'string')?.errorCode;
    const tokenField = details.some(detail => Array.isArray(detail?.fieldViolations) && detail.fieldViolations.some(v => v?.field === 'message.token'))
        || /registration token/i.test(String(error.message ?? ''));
    return { reason: code || (typeof error.status === 'string' ? error.status : undefined), tokenRejected: tokenField };
}

export async function sendFCM(device, payload, collapseID, env, kind, { fetch = globalThis.fetch } = {}) {
    if (!fcmEnabled(env)) return { status: 0, reason: 'FcmDisabled' };
    const access = await fcmAccessToken(env, { fetch });
    const { projectID } = fcmCredentials(env);
    const { apiBaseURL } = fcmEndpoints(env);
    let response;
    try {
        response = await fetch(`${apiBaseURL}/v1/projects/${projectID}/messages:send`, {
            method: 'POST', headers: { authorization: `Bearer ${access}`, 'content-type': 'application/json' },
            body: JSON.stringify({ message: fcmMessage(device, payload, collapseID, kind) }), signal: AbortSignal.timeout(10000)
        });
    } catch { throw new Error('FCM_REQUEST_FAILED'); }
    let body = {};
    try { body = await response.json(); } catch { /* Success bodies only carry the message name. */ }
    if (response.status === 401) resetFCMAccessToken();
    return { status: response.status, ...(response.status === 200 ? {} : fcmReason(body)) };
}

export function classifyFCM(status, reason, tokenRejected = false) {
    if (status === 200) return 'sent';
    if (status === 404 || reason === 'UNREGISTERED' || reason === 'SENDER_ID_MISMATCH') return 'remove-device';
    if (status === 400 && reason === 'INVALID_ARGUMENT' && tokenRejected) return 'remove-device';
    // 401: the cached access token was rejected and has been dropped; the next attempt re-authenticates.
    if (status === 401 || status === 429 || status >= 500 || ['UNAVAILABLE', 'INTERNAL', 'QUOTA_EXCEEDED'].includes(reason)) return 'retry';
    return 'failed';
}
