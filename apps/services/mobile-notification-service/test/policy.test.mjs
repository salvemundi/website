import test from 'node:test';
import assert from 'node:assert/strict';
import { deliveryEnabled, deviceAllowed, snapshotOf, changesFor, notificationPayload, classifyAPNs, retryDelay } from '../src/policy.mjs';

const user = '00000000-0000-4000-8000-000000000001';
const env = { ENV_NAME: 'acc', MOBILE_API_ENABLED: 'true', MOBILE_NOTIFICATIONS_ENABLED: 'true', MOBILE_NOTIFICATION_ALLOWED_USER_IDS: user };
const snapshot = { paymentStatus: 'paid', event: { title: 'Borrel', startsAt: '2026-11-11T19:00:00.000Z', location: 'Eindhoven', status: 'published' } };

test('delivery requires all acceptance gates', () => {
    assert.equal(deliveryEnabled(env), true);
    for (const key of ['ENV_NAME','MOBILE_API_ENABLED','MOBILE_NOTIFICATIONS_ENABLED']) assert.equal(deliveryEnabled({ ...env, [key]: '' }), false);
    assert.equal(deliveryEnabled({ ...env, ENV_NAME: 'prod' }), false);
});
test('only allowlisted acceptance devices, production APNs needs explicit switch', () => {
    const device = { environment: 'acc', user_id: user, apns_environment: 'sandbox' };
    assert.equal(deviceAllowed(device, env), true);
    assert.equal(deviceAllowed({ ...device, user_id: 'another-member' }, env), false);
    assert.equal(deviceAllowed(device, { ...env, MOBILE_NOTIFICATION_ALLOWED_USER_IDS: '' }), false);
    assert.equal(deviceAllowed({ ...device, environment: 'prod' }, env), false);
    assert.equal(deviceAllowed({ ...device, apns_environment: 'production' }, env), false);
    assert.equal(deviceAllowed({ ...device, apns_environment: 'production' }, { ...env, MOBILE_APNS_ALLOW_PRODUCTION: 'true' }), true);
});
test('first sync baselines history without any messages', () => {
    assert.deepEqual(changesFor(undefined, snapshot, false, new Date('2026-11-11T12:00Z')), []);
});
test('new registrations, changed payments and event changes have stable independent keys', () => {
    assert.deepEqual(changesFor(undefined, snapshot, true, new Date('2026-11-01T00:00Z')), [{ kind: 'registrations', suffix: 'registered' }]);
    const previous = { ...snapshot, paymentStatus: 'open' };
    assert.deepEqual(changesFor(previous, snapshot, true, new Date('2026-11-01T00:00Z')), [{ kind: 'payments', suffix: 'payment:paid' }]);
    const changed = { ...snapshot, event: { ...snapshot.event, location: 'Andere locatie' } };
    const changes = changesFor(snapshot, changed, true, new Date('2026-11-01T00:00Z'));
    assert.equal(changes[0].kind, 'eventChanges');
    assert.deepEqual(changesFor(snapshot, changed, true, new Date('2026-11-01T00:00Z')), changes);
});
test('reminders only for paid published events within future 24 hours', () => {
    assert.equal(changesFor(snapshot, snapshot, true, new Date('2026-11-11T12:00Z'))[0].kind, 'reminders');
    assert.deepEqual(changesFor(snapshot, snapshot, true, new Date('2026-11-10T18:59Z')), []);
    assert.deepEqual(changesFor(snapshot, snapshot, true, new Date('2026-11-11T19:00Z')), []);
    assert.deepEqual(changesFor({ ...snapshot, paymentStatus: 'open' }, { ...snapshot, paymentStatus: 'open' }, true, new Date('2026-11-11T12:00Z')), []);
    const unpublished = { ...snapshot, event: { ...snapshot.event, status: 'draft' } };
    assert.deepEqual(changesFor(unpublished, unpublished, true, new Date('2026-11-11T12:00Z')), []);
});
test('snapshots and payloads contain no QR, token, member identity or payment details', () => {
    const record = snapshotOf({ payment_status: 'paid', name: 'Borrel', starts_at: '2026-11-11T19:00Z', location: 'Eindhoven', event_status: 'published', qr_token: 'secret', participant_email: 'private@example.com' });
    assert.equal(JSON.stringify(record).includes('secret'), false);
    const payload = notificationPayload('payments', 'event:12');
    assert.equal(payload.activityID, 'event:12');
    assert.equal(JSON.stringify(payload).includes('private@example.com'), false);
});
test('APNs removes invalid devices, retries transient errors and stops permanent errors', () => {
    assert.equal(classifyAPNs(200), 'sent');
    assert.equal(classifyAPNs(410, 'Unregistered'), 'remove-device');
    assert.equal(classifyAPNs(400, 'BadDeviceToken'), 'remove-device');
    assert.equal(classifyAPNs(429), 'retry');
    assert.equal(classifyAPNs(503), 'retry');
    assert.equal(classifyAPNs(403, 'InvalidProviderToken'), 'failed');
    assert.equal(classifyAPNs(400, 'PayloadEmpty'), 'failed');
    assert.equal(retryDelay(1), 30);
    assert.equal(retryDelay(100), 3600);
});
