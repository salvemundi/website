import pg from 'pg';
import { setTimeout as delay } from 'node:timers/promises';
import { deliveryEnabled, allowedUserIds } from './policy.mjs';
import { providerToken } from './apns.mjs';
import { reconcile, deliver } from './worker.mjs';

if (!deliveryEnabled(process.env)) {
    console.error('Mobile notification delivery is disabled. Requires ENV_NAME=acc, MOBILE_API_ENABLED=true and MOBILE_NOTIFICATIONS_ENABLED=true.');
    process.exitCode = 1;
} else if (!allowedUserIds(process.env).length || allowedUserIds(process.env).some(id => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
    console.error('Set MOBILE_NOTIFICATION_ALLOWED_USER_IDS to explicit test-user UUIDs. An empty or invalid allowlist never sends notifications.');
    process.exitCode = 1;
} else {
    // Validate signing configuration before connecting to the database; never log secrets.
    providerToken(process.env);
    const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
        max: 2
    });
    let stopping = false;
    process.on('SIGINT', () => { stopping = true; });
    process.on('SIGTERM', () => { stopping = true; });
    const once = process.argv.includes('--once');
    do {
        const client = await pool.connect();
        try {
            await reconcile(client, process.env);
            await deliver(client, process.env);
            // Delete old delivery payloads; never retain token values in logs.
            await client.query(`DELETE FROM mobile_notification_outbox WHERE environment='acc' AND status IN ('sent','failed','skipped') AND created_at<now()-interval '30 days'`);
            await client.query(`DELETE FROM mobile_devices d WHERE environment='acc' AND NOT EXISTS(SELECT 1 FROM auth_sessions s WHERE s.id=d.session_id AND s.expires_at>now())`);
        } catch (error) {
            // SQL text and connection strings may contain identifiers; log only the machine code.
            console.error('Mobile notification cycle failed', typeof error?.code === 'string' ? error.code : 'WORKER_ERROR');
            if (once) process.exitCode = 1;
        } finally { client.release(); }
        if (!once && !stopping) await delay(60_000);
    } while (!once && !stopping);
    await pool.end();
}
