import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, verify } from 'node:crypto';
import { createServer } from 'node:http';
import { sendFCM, fcmAccessToken, fcmCredentials, fcmEndpoints, fcmMessage, classifyFCM, resetFCMAccessToken, serviceAccountAssertion, FCM_SCOPE, FCM_DEFAULT_TOKEN_URL } from '../src/fcm.mjs';
import { deliver, sendPush } from '../src/worker.mjs';
import { deviceAllowed } from '../src/policy.mjs';
import { configurationChecks, databaseChecks, requiredTables, requiredPreferenceColumns, requiredOutboxKinds } from '../src/readiness.mjs';

const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const pem = privateKey.export({ type: 'pkcs8', format: 'pem' });
const fcmToken = 'dGVzdC1pbnN0YW5jZQ:APA91bH' + 'Ab9_-'.repeat(28);
const userId = '00000000-0000-4000-8000-000000000001';
const base = { MOBILE_FCM_ENABLED: 'true', FCM_PROJECT_ID: 'salve-mundi-acc', FCM_CLIENT_EMAIL: 'push@salve-mundi-acc.iam.gserviceaccount.com', FCM_PRIVATE_KEY: pem.replace(/\n/g, '\\n') };
const androidDevice = { id: 7, environment: 'acc', user_id: userId, apns_environment: 'sandbox', platform: 'android', token: fcmToken, user_status: 'active' };
const payload = { aps: { alert: { title: 'Borrel', body: 'Je inschrijving is ontvangen.' }, sound: 'default' }, activityID: 'event:42' };

function fakeFetch(responses) {
    const calls = [];
    const fetch = async (url, options) => {
        calls.push({ url, options });
        const next = typeof responses === 'function' ? responses(url, options, calls) : responses.shift();
        return new Response(JSON.stringify(next.body ?? {}), { status: next.status ?? 200, headers: { 'content-type': 'application/json' } });
    };
    return { fetch, calls };
}
const tokenOK = { status: 200, body: { access_token: 'ya29.fixture', expires_in: 3599, token_type: 'Bearer' } };

test('service-account assertion is a valid RS256 JWT with the FCM scope and token audience', () => {
    const credentials = fcmCredentials(base);
    const now = Date.parse('2026-11-21T12:00Z');
    const [header, claims, signature] = serviceAccountAssertion(credentials, FCM_DEFAULT_TOKEN_URL, now).split('.');
    assert.deepEqual(JSON.parse(Buffer.from(header, 'base64url')), { alg: 'RS256', typ: 'JWT' });
    assert.deepEqual(JSON.parse(Buffer.from(claims, 'base64url')), { iss: base.FCM_CLIENT_EMAIL, scope: FCM_SCOPE, aud: FCM_DEFAULT_TOKEN_URL, iat: now / 1000, exp: now / 1000 + 3600 });
    assert.equal(verify('sha256', Buffer.from(`${header}.${claims}`), publicKey, Buffer.from(signature, 'base64url')), true);
});

test('credentials come from FCM_SERVICE_ACCOUNT_JSON or separate variables and are validated', () => {
    const json = JSON.stringify({ type: 'service_account', project_id: 'salve-mundi-acc', private_key_id: 'abc123', private_key: pem, client_email: base.FCM_CLIENT_EMAIL });
    const fromJSON = fcmCredentials({ FCM_SERVICE_ACCOUNT_JSON: json });
    assert.equal(fromJSON.projectID, 'salve-mundi-acc'); assert.equal(fromJSON.keyID, 'abc123');
    assert.equal(fcmCredentials(base).clientEmail, base.FCM_CLIENT_EMAIL);
    const ec = generateKeyPairSync('ec', { namedCurve: 'prime256v1' }).privateKey.export({ type: 'pkcs8', format: 'pem' });
    for (const env of [{}, { ...base, FCM_PRIVATE_KEY: 'secret' }, { ...base, FCM_PRIVATE_KEY: ec }, { ...base, FCM_PROJECT_ID: 'Bad Project' }, { FCM_SERVICE_ACCOUNT_JSON: '{not json' }, { FCM_SERVICE_ACCOUNT_JSON: JSON.stringify({ type: 'authorized_user' }) }]) {
        assert.throws(() => fcmCredentials(env), error => /^FCM_CONFIGURATION_(MISSING|INVALID)$/.test(error.message) && !error.message.includes('PRIVATE KEY'));
    }
});

test('endpoint overrides are refused in production and limited to local fake senders', () => {
    assert.equal(fcmEndpoints({}).overridden, false);
    const local = { FCM_API_BASE_URL: 'http://127.0.0.1:9099', FCM_TOKEN_URL: 'http://127.0.0.1:9099/token' };
    assert.throws(() => fcmEndpoints({ ...local, NODE_ENV: 'production', MOBILE_FCM_TEST_ENDPOINTS: 'true' }), /FCM_TEST_ENDPOINT_REFUSED/);
    assert.throws(() => fcmEndpoints({ ...local }), /FCM_TEST_ENDPOINT_REFUSED/);
    assert.deepEqual(fcmEndpoints({ ...local, MOBILE_FCM_TEST_ENDPOINTS: 'true' }), { apiBaseURL: 'http://127.0.0.1:9099', tokenURL: 'http://127.0.0.1:9099/token', overridden: true });
    assert.equal(fcmEndpoints({ ...local, NODE_ENV: 'test' }).overridden, true);
    for (const patch of [{ FCM_API_BASE_URL: 'https://evil.example' }, { FCM_TOKEN_URL: 'https://oauth2.googleapis.com/token' }, { FCM_TOKEN_URL: undefined }, { FCM_API_BASE_URL: 'http://user:pw@localhost' }, { FCM_API_BASE_URL: 'file:///etc/passwd' }]) {
        assert.throws(() => fcmEndpoints({ ...local, ...patch, NODE_ENV: 'test' }), /FCM_TEST_ENDPOINT_REFUSED/, JSON.stringify(patch));
    }
});

test('Android data message carries kind, activityID, title, body and optional url as strings', () => {
    const message = fcmMessage(androidDevice, { ...payload, url: 'https://acc.salvemundi.nl/activiteiten/42' }, 'collapse-id', 'registrations');
    assert.deepEqual(message, { token: fcmToken, data: { kind: 'registrations', title: 'Borrel', body: 'Je inschrijving is ontvangen.', activityID: 'event:42', url: 'https://acc.salvemundi.nl/activiteiten/42' }, android: { priority: 'HIGH', ttl: '3600s', collapse_key: 'collapse-id' } });
    assert.equal(Object.values(message.data).every(value => typeof value === 'string'), true);
    assert.equal('url' in fcmMessage(androidDevice, payload, 'c', 'payments').data, false);
    assert.equal('activityID' in fcmMessage(androidDevice, { ...payload, activityID: 'event:abc' }, 'c', 'payments').data, false);
});

test('sendFCM exchanges the assertion once, caches the access token and posts to messages:send', async () => {
    resetFCMAccessToken();
    const { fetch, calls } = fakeFetch([tokenOK, { status: 200, body: { name: 'projects/salve-mundi-acc/messages/1' } }, { status: 200, body: { name: 'projects/salve-mundi-acc/messages/2' } }]);
    assert.deepEqual(await sendFCM(androidDevice, payload, 'collapse', base, 'payments', { fetch }), { status: 200 });
    assert.deepEqual(await sendFCM(androidDevice, payload, 'collapse', base, 'payments', { fetch }), { status: 200 });
    assert.equal(calls.length, 3);
    assert.equal(calls[0].url, FCM_DEFAULT_TOKEN_URL);
    const form = new URLSearchParams(calls[0].options.body);
    assert.equal(form.get('grant_type'), 'urn:ietf:params:oauth:grant-type:jwt-bearer');
    assert.equal(form.get('assertion').split('.').length, 3);
    assert.equal(calls[1].url, 'https://fcm.googleapis.com/v1/projects/salve-mundi-acc/messages:send');
    assert.equal(calls[1].options.headers.authorization, 'Bearer ya29.fixture');
    const sent = JSON.parse(calls[1].options.body);
    assert.equal(sent.message.token, fcmToken); assert.equal(sent.message.data.kind, 'payments'); assert.equal(sent.message.data.activityID, 'event:42');
});

test('access token expiry, auth failures and disabled delivery are handled without leaking details', async () => {
    resetFCMAccessToken();
    const now = Date.parse('2026-11-21T12:00Z');
    const { fetch, calls } = fakeFetch([tokenOK, { ...tokenOK, body: { ...tokenOK.body, access_token: 'second' } }]);
    assert.equal(await fcmAccessToken(base, { fetch, now }), 'ya29.fixture');
    assert.equal(await fcmAccessToken(base, { fetch, now: now + 50 * 60_000 }), 'ya29.fixture');
    assert.equal(await fcmAccessToken(base, { fetch, now: now + 56 * 60_000 }), 'second');
    assert.equal(calls.length, 2);
    resetFCMAccessToken();
    await assert.rejects(fcmAccessToken(base, fakeFetch([{ status: 400, body: { error: 'invalid_grant', error_description: base.FCM_CLIENT_EMAIL } }])), error => error.message === 'FCM_AUTH_FAILED');
    const disabled = fakeFetch([]);
    assert.deepEqual(await sendFCM(androidDevice, payload, 'c', { ...base, MOBILE_FCM_ENABLED: 'false' }, 'payments', { fetch: disabled.fetch }), { status: 0, reason: 'FcmDisabled' });
    assert.equal(disabled.calls.length, 0);
});

test('FCM error responses map to remove-device, retry or failed', async () => {
    const cases = [
        [{ status: 404, body: { error: { status: 'NOT_FOUND', details: [{ '@type': 'type.googleapis.com/google.firebase.fcm.v1.FcmError', errorCode: 'UNREGISTERED' }] } } }, 'remove-device'],
        [{ status: 400, body: { error: { status: 'INVALID_ARGUMENT', message: 'The registration token is not a valid FCM registration token', details: [{ errorCode: 'INVALID_ARGUMENT' }] } } }, 'remove-device'],
        [{ status: 400, body: { error: { status: 'INVALID_ARGUMENT', details: [{ errorCode: 'INVALID_ARGUMENT' }, { '@type': 'type.googleapis.com/google.rpc.BadRequest', fieldViolations: [{ field: 'message.token' }] }] } } }, 'remove-device'],
        [{ status: 400, body: { error: { status: 'INVALID_ARGUMENT', message: 'Invalid data payload', details: [{ errorCode: 'INVALID_ARGUMENT' }] } } }, 'failed'],
        [{ status: 403, body: { error: { status: 'PERMISSION_DENIED', details: [{ errorCode: 'SENDER_ID_MISMATCH' }] } } }, 'remove-device'],
        [{ status: 429, body: { error: { status: 'RESOURCE_EXHAUSTED', details: [{ errorCode: 'QUOTA_EXCEEDED' }] } } }, 'retry'],
        [{ status: 503, body: { error: { status: 'UNAVAILABLE', details: [{ errorCode: 'UNAVAILABLE' }] } } }, 'retry'],
        [{ status: 500, body: { error: { status: 'INTERNAL', details: [{ errorCode: 'INTERNAL' }] } } }, 'retry'],
        [{ status: 401, body: { error: { status: 'UNAUTHENTICATED', details: [{ errorCode: 'THIRD_PARTY_AUTH_ERROR' }] } } }, 'retry']
    ];
    for (const [response, expected] of cases) {
        resetFCMAccessToken();
        const result = await sendFCM(androidDevice, payload, 'c', base, 'payments', fakeFetch([tokenOK, response]));
        assert.equal(classifyFCM(result.status, result.reason, result.tokenRejected), expected, JSON.stringify(response.body));
    }
    assert.equal(classifyFCM(200), 'sent');
});

test('a 401 drops the cached access token so the retry re-authenticates', async () => {
    resetFCMAccessToken();
    const { fetch, calls } = fakeFetch([tokenOK, { status: 401, body: { error: { status: 'UNAUTHENTICATED' } } }, tokenOK, { status: 200, body: {} }]);
    assert.equal((await sendFCM(androidDevice, payload, 'c', base, 'payments', { fetch })).status, 401);
    assert.equal((await sendFCM(androidDevice, payload, 'c', base, 'payments', { fetch })).status, 200);
    assert.equal(calls.filter(call => call.url === FCM_DEFAULT_TOKEN_URL).length, 2);
});

test('a local fake FCM server receives the message through the test endpoint override', async () => {
    resetFCMAccessToken();
    const received = [];
    const server = createServer((request, response) => {
        let body = '';
        request.on('data', chunk => { body += chunk; });
        request.on('end', () => {
            received.push({ url: request.url, authorization: request.headers.authorization, body });
            response.setHeader('content-type', 'application/json');
            response.end(JSON.stringify(request.url === '/token' ? { access_token: 'fake-access', expires_in: 3600 } : { name: 'projects/salve-mundi-acc/messages/fake' }));
        });
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
        const { port } = server.address();
        const env = { ...base, NODE_ENV: 'test', FCM_API_BASE_URL: `http://127.0.0.1:${port}`, FCM_TOKEN_URL: `http://127.0.0.1:${port}/token` };
        assert.deepEqual(await sendFCM(androidDevice, payload, 'c', env, 'reminders'), { status: 200 });
        assert.equal(received[0].url, '/token');
        assert.equal(received[1].url, '/v1/projects/salve-mundi-acc/messages:send');
        assert.equal(received[1].authorization, 'Bearer fake-access');
        assert.equal(JSON.parse(received[1].body).message.data.kind, 'reminders');
    } finally { server.close(); resetFCMAccessToken(); }
});

// Worker routing and gating for Android devices.
const workerEnv = { ENV_NAME: 'acc', MOBILE_API_ENABLED: 'true', MOBILE_NOTIFICATIONS_ENABLED: 'true', MOBILE_NOTIFICATION_ALLOWED_USER_IDS: userId };
const job = { id: 8, device_id: 7, kind: 'payments', dedupe_key: '12:payment:paid', payload, attempts: 1 };
function deliveryDB(device) {
    const writes = [];
    let claimed = false;
    return { writes, async query(sql, args) {
        if (sql.includes('information_schema.columns')) return { rows: ['expires_at', 'user_id'].map(column_name => ({ column_name })) };
        if (sql.includes('RETURNING o.*')) { if (claimed) return { rows: [] }; claimed = true; return { rows: [job] }; }
        if (sql.includes('SELECT d.*,u.status')) return { rows: [device] };
        writes.push({ sql, args });
        return { rows: [] };
    } };
}

test('Android delivery is off by default and keeps every APNs gate when enabled', async () => {
    assert.equal(deviceAllowed(androidDevice, workerEnv), false);
    assert.equal(deviceAllowed(androidDevice, { ...workerEnv, MOBILE_FCM_ENABLED: 'true' }), true);
    assert.equal(deviceAllowed({ ...androidDevice, user_id: 'other' }, { ...workerEnv, MOBILE_FCM_ENABLED: 'true' }), false);
    assert.equal(deviceAllowed({ ...androidDevice, apns_environment: 'production' }, { ...workerEnv, MOBILE_FCM_ENABLED: 'true' }), false);
    assert.equal(deviceAllowed({ ...androidDevice, apns_environment: 'production' }, { ...workerEnv, MOBILE_FCM_ENABLED: 'true', MOBILE_APNS_ALLOW_PRODUCTION: 'true' }), true);
    assert.equal(deviceAllowed({ ...androidDevice, platform: undefined }, workerEnv), true, 'pre-migration rows are iOS');
    assert.equal(deviceAllowed(androidDevice, { ...workerEnv, MOBILE_FCM_ENABLED: 'true', MOBILE_NOTIFICATION_SHARED_DB_PILOT: 'true' }), false);
    const client = deliveryDB(androidDevice);
    let sent = false;
    await deliver(client, workerEnv, async () => { sent = true; return { status: 200 }; });
    assert.equal(sent, false);
    assert.equal(client.writes.some(write => write.sql.includes("status='skipped'")), true);
});

test('worker passes the job kind and deactivates unregistered Android tokens like APNs 410', async () => {
    const env = { ...workerEnv, MOBILE_FCM_ENABLED: 'true' };
    const client = deliveryDB(androidDevice);
    const calls = [];
    await deliver(client, env, async (...args) => { calls.push(args); return { status: 404, reason: 'UNREGISTERED' }; });
    assert.equal(calls[0][4], 'payments');
    assert.deepEqual(client.writes.find(write => write.sql.includes('DELETE FROM mobile_devices')).args, [androidDevice.id, [userId], false]);
    const retry = deliveryDB(androidDevice);
    await deliver(retry, env, async () => ({ status: 503, reason: 'UNAVAILABLE' }));
    assert.equal(retry.writes.find(write => write.sql.includes('last_error_code=$3')).args[1], 'pending');
    const sent = deliveryDB(androidDevice);
    await deliver(sent, env, async () => ({ status: 200 }));
    assert.equal(sent.writes.find(write => write.sql.includes('last_error_code=$3')).args[1], 'sent');
    // An Android 404 must not be read as an APNs status, and an iOS 404 is not a removal.
    const ios = deliveryDB({ ...androidDevice, platform: 'ios', token: 'ab'.repeat(32) });
    await deliver(ios, env, async () => ({ status: 404, reason: 'BadPath' }));
    assert.equal(ios.writes.some(write => write.sql.includes('DELETE FROM mobile_devices')), false);
});

test('default sender routes Android devices to FCM and never to APNs', async () => {
    const result = await sendPush(androidDevice, payload, 'c', { MOBILE_FCM_ENABLED: 'false' }, 'payments');
    assert.deepEqual(result, { status: 0, reason: 'FcmDisabled' });
});

test('readiness reports FCM status, validates credentials and requires the platform column when enabled', async () => {
    const apns = generateKeyPairSync('ec', { namedCurve: 'prime256v1' }).privateKey.export({ type: 'pkcs8', format: 'pem' });
    const good = { ...workerEnv, APNS_KEY_ID: 'ABCDEFGHIJ', APNS_TEAM_ID: 'ABCDEFGHIJ', APNS_TOPIC: 'nl.salvemundi.ios', APNS_PRIVATE_KEY: apns, MOBILE_APNS_ALLOW_PRODUCTION: 'false' };
    const disabled = configurationChecks(good);
    assert(disabled.every(check => check.passed));
    assert(disabled.some(check => check.name.startsWith('Android FCM delivery disabled')));
    assert(configurationChecks({ ...good, ...base }).every(check => check.passed));
    assert(!JSON.stringify(configurationChecks({ ...good, ...base })).includes('PRIVATE KEY'));
    for (const patch of [{ FCM_PRIVATE_KEY: 'broken' }, { FCM_PROJECT_ID: '' }, { FCM_API_BASE_URL: 'http://127.0.0.1:1', FCM_TOKEN_URL: 'http://127.0.0.1:1/t', NODE_ENV: 'production' }]) {
        assert(configurationChecks({ ...good, ...base, ...patch }).some(check => !check.passed), JSON.stringify(Object.keys(patch)));
    }
    for (const [columns, expected] of [[['platform'], true], [[], false]]) {
        const client = { query: async (sql, params) => {
            if (sql.includes('current_database')) return { rows: [{ name: 'acceptance' }] };
            if (sql.includes('information_schema.tables')) return { rows: requiredTables.map(table_name => ({ table_name })) };
            if (sql.includes('pg_constraint')) return { rows: [{ convalidated: true, definition: `CHECK (kind IN (${requiredOutboxKinds.map(k => `'${k}'`).join(',')}))` }] };
            if (params?.[0] === 'mobile_notification_outbox') return { rows: [{ column_name: 'metadata' }] };
            if (params?.[0] === 'mobile_notification_preferences') return { rows: requiredPreferenceColumns.map(column_name => ({ column_name })) };
            if (params?.[0] === 'mobile_devices') return { rows: columns.map(column_name => ({ column_name })) };
            if (sql.includes('information_schema.columns')) return { rows: [{ column_name: 'expiresAt' }, { column_name: 'userId' }] };
            return { rows: [] };
        } };
        const checks = await databaseChecks(client, { ...base, PRODUCTION_DB_NAME: 'production', MOBILE_ACCEPTANCE_DB_ISOLATION_CONFIRMED: 'true' });
        assert.equal(checks.find(check => check.name.startsWith('mobile_devices platform column')).passed, expected);
        const withoutFCM = await databaseChecks(client, { PRODUCTION_DB_NAME: 'production', MOBILE_ACCEPTANCE_DB_ISOLATION_CONFIRMED: 'true' });
        assert.equal(withoutFCM.some(check => check.name.startsWith('mobile_devices platform column')), false);
    }
});
