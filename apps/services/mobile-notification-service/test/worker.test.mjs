import test from 'node:test';
import assert from 'node:assert/strict';
import { deliver, reconcile } from '../src/worker.mjs';

const userId = '00000000-0000-4000-8000-000000000001';
const env = { ENV_NAME: 'acc', MOBILE_API_ENABLED: 'true', MOBILE_NOTIFICATIONS_ENABLED: 'true', MOBILE_NOTIFICATION_ALLOWED_USER_IDS: userId };
function deliveryDB(device, job, reminderActive = true) {
    const writes = [];
    let claimed = false;
    return { writes, async query(sql, args) {
        if (sql.includes('information_schema.columns')) return { rows: ['expires_at', 'user_id'].map(column_name => ({ column_name })) };
        if (sql.includes('RETURNING o.*')) {
            if (claimed) return { rows: [] };
            claimed = true;
            return { rows: [job] };
        }
        if (sql.includes('SELECT d.*,u.status')) return { rows: device ? [device] : [] };
        if (sql.includes('SELECT 1 FROM event_signups')) return { rowCount: reminderActive ? 1 : 0, rows: [] };
        writes.push({ sql, args });
        return { rows: [] };
    } };
}
const device = { id: 5, environment: 'acc', user_id: userId, apns_environment: 'sandbox', user_status: 'active' };
const job = { id: 8, device_id: 5, kind: 'payments', dedupe_key: '12:payment:paid', payload: { activityID: 'event:2' }, attempts: 1 };

test('worker rechecks current account allowlist and preferences before APNs', async () => {
    for (const denied of [{ ...device, user_id: 'another-user' }, { ...device, payments: false }, { ...device, user_status: 'suspended' }, null]) {
        const client = deliveryDB(denied, job);
        let sent = false;
        await deliver(client, env, async () => { sent = true; return { status: 200 }; });
        assert.equal(sent, false);
        assert.equal(client.writes.some(write => write.sql.includes("status='skipped'")), true);
    }
});
test('a cancelled or moved reminder cannot be delivered from a stale outbox', async () => {
    const client = deliveryDB(device, { ...job, kind: 'reminders' }, false);
    let sent = false;
    await deliver(client, env, async () => { sent = true; return { status: 200 }; });
    assert.equal(sent, false);
    assert.equal(client.writes.some(write => write.sql.includes("status='skipped'")), true);
});
test('transient failure returns to durable pending; eighth attempt ends retries', async () => {
    for (const attempts of [1, 8]) {
        const client = deliveryDB(device, { ...job, attempts });
        await deliver(client, env, async () => ({ status: 503, reason: 'ServiceUnavailable' }));
        const write = client.writes.find(value => value.sql.includes('last_error_code=$3'));
        assert.equal(write.args[1], attempts < 8 ? 'pending' : 'failed');
        assert.equal(write.args[2], 'ServiceUnavailable');
    }
});
test('APNs expired device revokes the device and queued jobs via foreign-key cascade', async () => {
    const client = deliveryDB(device, job);
    await deliver(client, env, async () => ({ status: 410, reason: 'Unregistered' }));
    assert.deepEqual(client.writes.find(write => write.sql.includes('DELETE FROM mobile_devices')).args, [device.id, [userId], false]);
});
test('reconciliation baseline suppresses history but subsequent event changes deep link correctly', async () => {
    let initialized = false;
    let oldSnapshot;
    const enqueued = [];
    const row = { id: 12, event_id: 2, payment_status: 'paid', name: 'Borrel', location: 'Eindhoven', event_status: 'published', starts_at: new Date('2099-01-01T19:00Z') };
    const client = { async query(sql, args) {
        if (sql.includes('information_schema.columns')) return { rows: ['expires_at', 'user_id'].map(column_name => ({ column_name })) };
        if (sql.includes('SELECT DISTINCT d.user_id')) return { rows: [{ user_id: userId }] };
        if (sql.includes('SELECT 1 FROM mobile_notification_users')) return { rows: [], rowCount: initialized ? 1 : 0 };
        if (sql.includes('SELECT s.id,s.event_id')) return { rows: [row] };
        if (sql.includes('SELECT snapshot')) return { rows: oldSnapshot ? [{ snapshot: oldSnapshot }] : [] };
        if (sql.includes('INSERT INTO mobile_notification_outbox')) enqueued.push(args);
        if (sql.includes('INSERT INTO mobile_notification_observations')) oldSnapshot = JSON.parse(args[2]);
        if (sql.includes('INSERT INTO mobile_notification_users')) initialized = true;
        return { rows: [] };
    } };
    await reconcile(client, env);
    assert.equal(enqueued.length, 0);
    row.location = 'Nieuwe locatie';
    await reconcile(client, env);
    assert.equal(enqueued.length, 1);
    assert.equal(enqueued[0][1], 'eventChanges');
    assert.equal(JSON.parse(enqueued[0][3]).activityID, 'event:2');
});
