// Read-only notification readiness check. Never sends APNs/FCM requests or applies migrations.
import { createPrivateKey } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { getWorkerSessionColumns } from './session-columns.mjs';
import { devAndroidAllowed, sharedPilotAllowed } from './policy.mjs';
import { fcmEnabled, fcmCredentials, fcmEndpoints } from './fcm.mjs';

export const requiredTables = ['mobile_notification_preferences', 'mobile_devices', 'mobile_notification_users', 'mobile_notification_observations', 'mobile_notification_outbox', 'mobile_notification_activity_users', 'mobile_notification_activity_observations'];
export const requiredPreferenceColumns = ['activity_announcements', 'activity_committee_ids', 'organizer_almost_full', 'organizer_capacity_percent', 'organizer_signup_thresholds'];
export const requiredOutboxKinds = ['registrations', 'payments', 'eventChanges', 'reminders', 'activityAnnouncements', 'organizerAlmostFull', 'organizerSignups'];
export function configurationChecks(env) {
    const checks = [];
    const add = (name, passed) => checks.push({ name, passed: Boolean(passed) });
    if (env.ENV_NAME === 'dev') {
        add('single-account Android test on the dev database loopback', devAndroidAllowed(env));
        add('mobile API enabled', env.MOBILE_API_ENABLED === 'true');
        add('notification delivery enabled', env.MOBILE_NOTIFICATIONS_ENABLED === 'true');
        return [...checks, ...fcmConfigurationChecks(env)];
    }
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
        const key = createPrivateKey((env.APNS_PRIVATE_KEY || '').replace(/\\+n/g, '\n'));
        keyValid = key.type === 'private' && key.asymmetricKeyType === 'ec' && key.asymmetricKeyDetails?.namedCurve === 'prime256v1';
    } catch { /* Never print crypto errors or secret material. */ }
    add('APNs private key is ES256 compatible', keyValid);
    add('APNs environment choice explicit', ['true', 'false'].includes(env.MOBILE_APNS_ALLOW_PRODUCTION));
    checks.push(...fcmConfigurationChecks(env));
    return checks;
}
// Android/FCM is opt-in: when disabled it reports a passing status line so existing iOS-only
// deployments stay ready; when enabled, credentials and endpoints must be valid.
export function fcmConfigurationChecks(env) {
    if (!fcmEnabled(env)) return [{ name: 'Android FCM delivery disabled (MOBILE_FCM_ENABLED is not true; Android devices are skipped)', passed: true }];
    const checks = [{ name: 'Android FCM delivery enabled', passed: true }];
    let credentials = false;
    try { fcmCredentials(env); credentials = true; } catch { /* Never print credential details. */ }
    checks.push({ name: 'FCM service account (project ID, client email, RSA private key)', passed: credentials });
    let endpoints;
    try { endpoints = fcmEndpoints(env); } catch { /* Refused override. */ }
    checks.push({ name: endpoints?.overridden ? 'FCM test endpoint override (local fake sender, non-production only)' : 'FCM uses Google endpoints', passed: Boolean(endpoints) });
    return checks;
}
export async function databaseChecks(client, env) {
    const checks = [];
    await client.query('BEGIN READ ONLY');
    try {
        const dev = env.ENV_NAME === 'dev';
        const { rows } = await client.query(dev
            ? 'SELECT current_database() AS name, host(inet_server_addr()) AS address, inet_server_port() AS port'
            : 'SELECT current_database() AS name');
        if (dev) {
            checks.push({
                name: 'connection matches the dev database and its private loopback',
                passed: devAndroidAllowed(env) && rows[0]?.name === env.DB_NAME
                    && rows[0]?.address === '127.0.0.1' && rows[0]?.port === 5432
            });
        } else if (env.MOBILE_NOTIFICATION_SHARED_DB_PILOT === 'true') {
            checks.push({ name: 'explicit single-account sandbox pilot on SHARED database (NOT isolated)', passed: sharedPilotAllowed(env) && env.MOBILE_ACCEPTANCE_DB_ISOLATION_CONFIRMED !== 'true' && rows[0]?.name === env.DB_NAME });
        } else {
            checks.push({ name: 'acceptance database explicitly isolated from production', passed: env.MOBILE_ACCEPTANCE_DB_ISOLATION_CONFIRMED === 'true' && Boolean(env.PRODUCTION_DB_NAME) && typeof rows[0]?.name === 'string' && rows[0].name !== env.PRODUCTION_DB_NAME });
        }
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
        if (fcmEnabled(env)) {
            const deviceColumns = await client.query('SELECT column_name FROM information_schema.columns WHERE table_schema=current_schema() AND table_name=$1', ['mobile_devices']);
            checks.push({ name: 'mobile_devices platform column (mobile_notifications_android.sql)', passed: deviceColumns.rows.some(row => row.column_name === 'platform') });
        }
        let compatible = true;
        try { await getWorkerSessionColumns(client); } catch { compatible = false; }
        checks.push({ name: 'supported authentication session columns', passed: compatible });
        return checks;
    } finally { await client.query('ROLLBACK'); }
}
async function reportDevDeviceStatus(client, env) {
    const columns = await getWorkerSessionColumns(client);
    const { rows: [status] } = await client.query(`
        SELECT
            EXISTS (SELECT 1 FROM directus_users WHERE id=$1 AND status='active') AS active_member,
            EXISTS (SELECT 1 FROM auth_sessions s WHERE CAST(s.${columns.userId} AS TEXT)=CAST($1::uuid AS TEXT)
                AND s.id LIKE 'mobile:%' AND s.${columns.expiresAt}>now()) AS native_session,
            EXISTS (SELECT 1 FROM mobile_devices d JOIN auth_sessions s ON s.id=d.session_id
                WHERE d.user_id=$1 AND d.environment='acc' AND d.platform='android'
                AND d.apns_environment='sandbox' AND s.${columns.expiresAt}>now()) AS android_linked
    `, [env.MOBILE_NOTIFICATION_ALLOWED_USER_IDS]);
    for (const [label, value] of [
        ['Allowlisted member active', status.active_member],
        ['Active native session', status.native_session],
        ['Android sandbox device linked', status.android_linked],
    ]) process.stdout.write(`INFO ${label}: ${value ? 'yes' : 'no'}\n`);
}

export async function run(env = process.env, args = process.argv.slice(2)) {
    if (args.some(arg => arg !== '--database')) throw new Error('Only --database is supported');
    const checks = configurationChecks(env);
    if (args.includes('--database')) {
        if (env.ENV_NAME !== 'acc' && !devAndroidAllowed(env)) checks.push({ name: 'database check refused outside acceptance or configured dev', passed: false });
        else {
            let client;
            try {
                const { default: pg } = await import('pg');
                client = new pg.Client(env.DATABASE_URL ? { connectionString: env.DATABASE_URL, connectionTimeoutMillis: 5000 } : { host: env.DB_HOST, port: Number(env.DB_PORT || 5432), database: env.DB_NAME, user: env.DB_USER, password: env.DB_PASSWORD, connectionTimeoutMillis: 5000 });
                await client.connect();
                const database = await databaseChecks(client, env);
                checks.push(...database);
                if (env.ENV_NAME === 'dev' && database.every(check => check.passed)) {
                    await reportDevDeviceStatus(client, env);
                }
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
