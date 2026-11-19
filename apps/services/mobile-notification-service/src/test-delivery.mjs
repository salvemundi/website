// Explicit, single-account sandbox pilot. This module is never run by the worker.
import { pathToFileURL } from 'node:url';
import { configurationChecks, databaseChecks } from './readiness.mjs';
import { allowedUserIds, deliveryEnabled, sharedPilotAllowed } from './policy.mjs';
import { getWorkerSessionColumns } from './session-columns.mjs';
import { sendAPNs } from './apns.mjs';

const topic = 'nl.salvemundi.ios';
const unavailable = () => ({ status: 'unavailable' });
export function pilotDestinationAllowed(env) {
    const users = allowedUserIds(env);
    if (users.length !== 1 || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(users[0]) || env.MOBILE_APNS_ALLOW_PRODUCTION !== 'false') return false;
    return env.MOBILE_NOTIFICATION_SHARED_DB_PILOT !== 'true' || sharedPilotAllowed(env);
}
export async function testDelivery(client, env, send = sendAPNs) {
    const users = allowedUserIds(env);
    // One explicit member and sandbox only, even if the regular worker permits TestFlight.
    if (!deliveryEnabled(env) || !pilotDestinationAllowed(env) || env.APNS_TOPIC !== topic || env.MOBILE_APNS_ALLOW_PRODUCTION !== 'false'
        || !configurationChecks(env).every(check => check.passed)) return unavailable();
    try {
        // Repeat the doctor's read-only checks here so invoking the CLI directly is safe too.
        if (!(await databaseChecks(client, env)).every(check => check.passed)) return unavailable();
        const columns = await getWorkerSessionColumns(client);
        const { rows } = await client.query(`SELECT d.id,d.environment,d.user_id,d.apns_environment,d.token
            FROM mobile_devices d JOIN auth_sessions s ON s.id=d.session_id
            AND CAST(s.${columns.userId} AS TEXT)=CAST(d.user_id AS TEXT)
            JOIN directus_users u ON u.id=d.user_id
            WHERE d.environment='acc' AND d.user_id=$1 AND d.apns_environment='sandbox'
            AND s.${columns.expiresAt}>now() AND u.status='active'
            ORDER BY d.updated_at DESC,d.id DESC LIMIT 1`, [users[0]]);
        const device = rows[0];
        // Defense in depth if a driver/adapter yields an unexpected row.
        if (!device || device.user_id !== users[0] || device.environment !== 'acc'
            || device.apns_environment !== 'sandbox' || !/^[a-f0-9]{64,200}$/.test(device.token || '')) return unavailable();
        const payload = { aps: { alert: { title: 'Salve Mundi', body: 'Dit is een testmelding. Meldingen zijn klaar voor een controle op je iPhone.' }, sound: 'default' } };
        const result = await send(device, payload, 'salve-mundi-explicit-sandbox-test', env);
        // Delivered here means accepted by APNs, never confirmation of a visible alert.
        return { status: result.status === 200 ? 'delivered' : 'rejected' };
    } catch { return unavailable(); }
}
export async function run(env = process.env, args = process.argv.slice(2)) {
    if (args.length) return { status: 'unavailable' };
    let client;
    try {
        if (!deliveryEnabled(env) || !pilotDestinationAllowed(env)
            || !configurationChecks(env).every(check => check.passed)) return unavailable();
        const { default: pg } = await import('pg');
        client = new pg.Client(env.DATABASE_URL ? { connectionString: env.DATABASE_URL, connectionTimeoutMillis: 5000 } : {
            host: env.DB_HOST, port: Number(env.DB_PORT || 5432), database: env.DB_NAME,
            user: env.DB_USER, password: env.DB_PASSWORD, connectionTimeoutMillis: 5000
        });
        await client.connect();
        return await testDelivery(client, env);
    } catch { return unavailable(); }
    finally { if (client) await client.end().catch(() => {}); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    run().then(result => {
        process.stdout.write(JSON.stringify(result) + '\n');
        process.stdout.write('delivered means APNs accepted the fixed test message; receipt on the iPhone is not confirmed. No registrations, preferences or schema changed.\n');
        process.exitCode = result.status === 'delivered' ? 0 : 1;
    }).catch(() => { process.stderr.write('Test delivery unavailable. Details suppressed.\n'); process.exitCode = 1; });
}
