// Read-only acceptance readiness check. Never sends APNs requests or applies migrations.
import { createPrivateKey } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { getWorkerSessionColumns } from './session-columns.mjs';

export const requiredTables = ['mobile_notification_preferences', 'mobile_devices', 'mobile_notification_users', 'mobile_notification_observations', 'mobile_notification_outbox', 'mobile_notification_activity_users', 'mobile_notification_activity_observations'];
export const requiredPreferenceColumns = ['activity_announcements', 'activity_committee_ids', 'organizer_almost_full', 'organizer_capacity_percent', 'organizer_signup_thresholds'];
export const requiredOutboxKinds = ['registrations', 'payments', 'eventChanges', 'reminders', 'activityAnnouncements', 'organizerAlmostFull', 'organizerSignups'];
export function configurationChecks(env) {
    const checks = [];
    const add = (name, passed) => checks.push({ name, passed: Boolean(passed) });
    add('acceptance environment', env.ENV_NAME === 'acc');
    add('mobile API enabled', env.MOBILE_API_ENABLED === 'true');
    add('notification delivery enabled', env.MOBILE_NOTIFICATIONS_ENABLED === 'true');
    const users = (env.MOBILE_NOTIFICATION_ALLOWED_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
    add('explicit test-member allowlist', users.length > 0 && users.every(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)));
    add('Apple key ID format', /^[A-Z0-9]{10}$/.test(env.APNS_KEY_ID || ''));
    add('Apple team ID format', /^[A-Z0-9]{10}$/.test(env.APNS_TEAM_ID || ''));
    add('expected app topic', env.APNS_TOPIC === 'nl.salvemundi.ios');
    let keyValid = false;
    try {
        const key = createPrivateKey((env.APNS_PRIVATE_KEY || '').replace(/\\n/g, '\n'));
        keyValid = key.type === 'private' && key.asymmetricKeyType === 'ec' && key.asymmetricKeyDetails?.namedCurve === 'prime256v1';
    } catch { /* Never print crypto errors or secret material. */ }
    add('APNs private key is ES256 compatible', keyValid);
    add('APNs environment choice explicit', ['true', 'false'].includes(env.MOBILE_APNS_ALLOW_PRODUCTION));
    return checks;
}
export async function databaseChecks(client, env) {
    const checks = [];
    await client.query('BEGIN READ ONLY');
    try {
        const { rows } = await client.query('SELECT current_database() AS name');
        checks.push({ name: 'acceptance database explicitly isolated from production', passed: env.MOBILE_ACCEPTANCE_DB_ISOLATION_CONFIRMED === 'true' && Boolean(env.PRODUCTION_DB_NAME) && typeof rows[0]?.name === 'string' && rows[0].name !== env.PRODUCTION_DB_NAME });
        const tableResult = await client.query('SELECT table_name FROM information_schema.tables WHERE table_schema=current_schema()');
        const present = new Set(tableResult.rows.map(row => row.table_name));
        for (const name of requiredTables) checks.push({ name: `required table ${name}`, passed: present.has(name) });
        const columnsResult = await client.query('SELECT column_name FROM information_schema.columns WHERE table_schema=current_schema() AND table_name=$1', ['mobile_notification_preferences']);
        const columns = new Set(columnsResult.rows.map(row => row.column_name));
        for (const name of requiredPreferenceColumns) checks.push({ name: `required preference column ${name}`, passed: columns.has(name) });
        const outboxColumns = await client.query('SELECT column_name FROM information_schema.columns WHERE table_schema=current_schema() AND table_name=$1', ['mobile_notification_outbox']);
        checks.push({ name: 'required outbox metadata column', passed: outboxColumns.rows.some(row => row.column_name === 'metadata') });
        const outboxConstraints = await client.query(`SELECT c.convalidated, pg_get_constraintdef(c.oid) AS definition
            FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace
            WHERE n.nspname=current_schema() AND t.relname=$1 AND c.conname=$2 AND c.contype='c'`,
            ['mobile_notification_outbox', 'mobile_notification_outbox_kind_check']);
        const kindConstraint = outboxConstraints.rows[0];
        checks.push({ name: 'validated outbox kinds include activity notifications', passed: kindConstraint?.convalidated === true && requiredOutboxKinds.every(kind => kindConstraint.definition?.includes(`'${kind}'`)) });
        let compatible = true;
        try { await getWorkerSessionColumns(client); } catch { compatible = false; }
        checks.push({ name: 'supported authentication session columns', passed: compatible });
        return checks;
    } finally { await client.query('ROLLBACK'); }
}
export async function run(env = process.env, args = process.argv.slice(2)) {
    if (args.some(arg => arg !== '--database')) throw new Error('Only --database is supported');
    const checks = configurationChecks(env);
    if (args.includes('--database')) {
        if (env.ENV_NAME !== 'acc') checks.push({ name: 'database check refused outside acceptance', passed: false });
        else {
            let client;
            try {
                const { default: pg } = await import('pg');
                client = new pg.Client(env.DATABASE_URL ? { connectionString: env.DATABASE_URL, connectionTimeoutMillis: 5000 } : { host: env.DB_HOST, port: Number(env.DB_PORT || 5432), database: env.DB_NAME, user: env.DB_USER, password: env.DB_PASSWORD, connectionTimeoutMillis: 5000 });
                await client.connect();
                checks.push(...await databaseChecks(client, env));
            } catch { checks.push({ name: 'read-only database check completed', passed: false }); }
            finally { if (client) await client.end().catch(() => {}); }
        }
    } else checks.push({ name: 'database verification not requested (use --database)', passed: false });
    for (const check of checks) process.stdout.write(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}\n`);
    process.stdout.write('No notifications sent. No records or schema changed. Key ownership, running worker and actual delivery still require a controlled device pilot.\n');
    return checks.every(check => check.passed) ? 0 : 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    run().then(code => { process.exitCode = code; }).catch(() => { process.stderr.write('Readiness check failed; details suppressed to protect configuration.\n'); process.exitCode = 1; });
}
