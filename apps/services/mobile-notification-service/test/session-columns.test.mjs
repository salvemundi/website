import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { getWorkerSessionColumns } from '../src/session-columns.mjs';
import { deliver, reconcile, removeExpiredDevices } from '../src/worker.mjs';

const userId = '00000000-0000-4000-8000-000000000001';
const otherUserId = '00000000-0000-4000-8000-000000000002';
const env = { ENV_NAME: 'acc', MOBILE_API_ENABLED: 'true', MOBILE_NOTIFICATIONS_ENABLED: 'true', MOBILE_NOTIFICATION_ALLOWED_USER_IDS: userId };

function fixture(layout, state = 'active') {
    const database = new DatabaseSync(':memory:');
    const columns = layout === 'camel' ? { expiry: 'expiresAt', user: 'userId' } : { expiry: 'expires_at', user: 'user_id' };
    database.exec(`
        CREATE TABLE auth_sessions(id TEXT PRIMARY KEY,"${columns.expiry}" TEXT,"${columns.user}" TEXT);
        CREATE TABLE directus_users(id TEXT PRIMARY KEY,status TEXT);
        CREATE TABLE mobile_devices(id INTEGER PRIMARY KEY,environment TEXT,user_id TEXT,session_id TEXT,apns_environment TEXT,token TEXT);
        CREATE TABLE mobile_notification_preferences(environment TEXT,user_id TEXT,registrations INTEGER,payments INTEGER,event_changes INTEGER,reminders INTEGER,activity_announcements INTEGER,activity_committee_ids TEXT,organizer_almost_full INTEGER,organizer_capacity_percent INTEGER,organizer_signup_thresholds TEXT);
    `);
    database.prepare('INSERT INTO directus_users VALUES (?,?)').run(userId, state === 'suspended' ? 'suspended' : 'active');
    database.prepare('INSERT INTO mobile_devices VALUES (?,?,?,?,?,?)').run(5, 'acc', userId, 'session-1', 'sandbox', 'a'.repeat(64));
    if (state !== 'revoked') database.prepare(`INSERT INTO auth_sessions VALUES (?,?,?)`).run(
        'session-1', state === 'expired' ? '2000-01-01 00:00:00' : '2099-01-01 00:00:00', state === 'wrong-owner' ? otherUserId : userId
    );
    let claimed = false;
    let metadataCalls = 0;
    let reconciliationRecipients = [];
    const queries = [];
    const client = { async query(sql, args = []) {
        queries.push(sql);
        if (sql.includes('information_schema.columns')) {
            metadataCalls++;
            assert.deepEqual(args, ['auth_sessions']);
            return { rows: database.prepare('PRAGMA table_info(auth_sessions)').all().map(column => ({ column_name: column.name })) };
        }
        if (sql.includes('RETURNING o.*')) {
            if (claimed) return { rows: [] };
            claimed = true;
            return { rows: [{ id: 8, device_id: 5, kind: 'payments', dedupe_key: '12:payment:paid', payload: {}, attempts: 1 }] };
        }
        if (sql.includes('SELECT d.*,u.status') || sql.includes('SELECT DISTINCT d.user_id') || sql.startsWith('DELETE FROM mobile_devices d WHERE')) {
            // Only SQL dialect syntax changes for SQLite; identifier selection and
            // ownership/expiry predicates are the actual generated worker query.
            const portable = sql.replace(/now\(\)/g, "datetime('now')")
                .replace('= ANY($1::uuid[])', 'IN ($1)').replace(/::boolean/g, '')
                .replace(/\$(\d+)/g, '?$1').replace('DELETE FROM mobile_devices d WHERE', 'DELETE FROM mobile_devices AS d WHERE');
            const bindings = args.map(value => typeof value === 'boolean' ? Number(value) : Array.isArray(value) ? value[0] : value);
            if (sql.startsWith('DELETE')) return { rows: [], rowCount: database.prepare(portable).run(...bindings).changes };
            const rows = database.prepare(portable).all(...bindings);
            if (sql.includes('SELECT DISTINCT')) reconciliationRecipients = rows;
            return { rows, rowCount: rows.length };
        }
        // Reconciliation has no bookings in this fixture; its authorization query
        // above executes against real session/device/user tables.
        return { rows: [], rowCount: 0 };
    } };
    return { client, database, queries, get metadataCalls() { return metadataCalls; }, get recipients() { return reconciliationRecipients; } };
}

for (const layout of ['camel', 'snake']) {
    test(`${layout} physical session columns authorize only active, owned, unexpired sessions`, async () => {
        for (const state of ['active', 'expired', 'revoked', 'wrong-owner', 'suspended']) {
            const db = fixture(layout, state);
            try {
                let deliveries = 0;
                await reconcile(db.client, env);
                await deliver(db.client, env, async () => { deliveries++; return { status: 200 }; });
                assert.equal(deliveries, state === 'active' ? 1 : 0, state);
                assert.equal(db.recipients.length, state === 'active' ? 1 : 0, state);
                assert.equal(db.metadataCalls, 1, 'successful metadata resolution is cached per client');
                const deviceQuery = db.queries.find(sql => sql.includes('SELECT d.*,u.status'));
                assert.match(deviceQuery, layout === 'camel' ? /s\."expiresAt" AS expires_at/ : /s\."expires_at" AS expires_at/);
                assert.doesNotMatch(deviceQuery, layout === 'camel' ? /s\."?expires_at"?\s*>/ : /s\."?expiresAt"?\s*>/);
                if (state !== 'suspended') {
                    await removeExpiredDevices(db.client);
                    assert.equal(db.database.prepare('SELECT count(*) AS count FROM mobile_devices').get().count, state === 'active' ? 1 : 0, `cleanup ${state}`);
                }
            } finally { db.database.close(); }
        }
    });
}

test('missing, ambiguous or unapproved session fields fail closed before claims or delivery', async () => {
    for (const names of [[], ['expiresAt', 'expires_at', 'userId'], ['expiresAt'], ['expiresAt', 'userId', 'user_id'], ['expiresAt; DROP TABLE auth_sessions', 'userId']]) {
        const queries = [];
        const client = { async query(sql) { queries.push(sql); return { rows: names.map(column_name => ({ column_name })) }; } };
        let sends = 0;
        await assert.rejects(deliver(client, env, async () => { sends++; return { status: 200 }; }), { code: 'MOBILE_SESSION_SCHEMA_UNSUPPORTED' });
        assert.equal(sends, 0);
        assert.equal(queries.length, 1);
        assert.equal(queries[0].includes('information_schema.columns'), true);
    }
});

test('failed or transient resolutions are retried rather than cached', async () => {
    let attempts = 0;
    const client = { async query() {
        attempts++;
        if (attempts === 1) throw new Error('temporary connection failure');
        if (attempts === 2) return { rows: [] };
        return { rows: ['expiresAt', 'userId'].map(column_name => ({ column_name })) };
    } };
    await assert.rejects(getWorkerSessionColumns(client), /temporary connection failure/);
    await assert.rejects(getWorkerSessionColumns(client), { code: 'MOBILE_SESSION_SCHEMA_UNSUPPORTED' });
    assert.deepEqual(await getWorkerSessionColumns(client), { expiresAt: '"expiresAt"', userId: '"userId"' });
    await getWorkerSessionColumns(client);
    assert.equal(attempts, 3);
});
