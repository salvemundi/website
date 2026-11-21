import { z } from 'zod';
import { pool } from '@/lib/database/db';
import { mobileError, mobileResponse, mobileRoute, readMobileJSON } from '@/server/mobile/http';
import { validDeviceToken } from '@/server/mobile/policy';
import { requireMobileUser } from '@/server/mobile/session';

// `platform` is optional so existing iOS clients ({token, environment}) keep working.
const deviceSchema = z.object({
    token: z.string().min(1).max(1024),
    environment: z.enum(['sandbox', 'production']),
    platform: z.enum(['ios', 'android']).default('ios')
}).strict();

export const POST = mobileRoute(async (request: Request) => {
    const user = await requireMobileUser(request);
    const parsed = deviceSchema.safeParse(await readMobileJSON(request));
    if (!parsed.success || !validDeviceToken(parsed.data.platform, parsed.data.token)) return mobileError('INVALID_DEVICE', 'Ongeldig apparaat.', 400);
    const { platform, environment } = parsed.data;
    // The same production gate covers APNs production and Android release builds.
    if (environment === 'production' && process.env.MOBILE_APNS_ALLOW_PRODUCTION !== 'true') {
        return mobileError('APNS_ENVIRONMENT_DISABLED', platform === 'android'
            ? 'Productie-notificaties zijn nog niet ingeschakeld.'
            : 'TestFlight-notificaties zijn nog niet ingeschakeld.', 409);
    }
    // APNs tokens are hex and normalized; FCM tokens are case-sensitive and stored verbatim.
    const token = platform === 'android' ? parsed.data.token : parsed.data.token.toLowerCase();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`mobile-device:${environment}:${token}`]);
        // Rebinding a token must delete the old device and its queued payloads first.
        await client.query(
            `DELETE FROM mobile_devices WHERE environment='acc' AND token=$1 AND apns_environment=$2
             AND (user_id<>$3 OR session_id<>$4)`, [token, environment, user.id, user.sessionId]
        );
        if (platform === 'android') {
            // Requires packages/db/drizzle/mobile_notifications_android.sql (platform column).
            await client.query(
                `INSERT INTO mobile_devices(environment,user_id,session_id,token,apns_environment,platform)
                 VALUES('acc',$1,$2,$3,$4,'android')
                 ON CONFLICT(environment,apns_environment,token) DO UPDATE SET updated_at=now()`,
                [user.id, user.sessionId, token, environment]
            );
        } else {
            // iOS keeps the original statement so it works before and after the Android migration
            // (the platform column defaults to 'ios').
            await client.query(
                `INSERT INTO mobile_devices(environment,user_id,session_id,token,apns_environment)
                 VALUES('acc',$1,$2,$3,$4)
                 ON CONFLICT(environment,apns_environment,token) DO UPDATE SET updated_at=now()`,
                [user.id, user.sessionId, token, environment]
            );
        }
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally { client.release(); }
    return mobileResponse({ success: true, registered: true });
});
