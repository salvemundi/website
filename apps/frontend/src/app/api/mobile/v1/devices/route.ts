import { z } from 'zod';
import { pool } from '@/lib/database/db';
import { mobileError, mobileResponse, mobileRoute, readMobileJSON } from '@/server/mobile/http';
import { requireMobileUser } from '@/server/mobile/session';

const deviceSchema = z.object({
    token: z.string().regex(/^[a-fA-F0-9]{64,200}$/),
    environment: z.enum(['sandbox', 'production'])
}).strict();

export const POST = mobileRoute(async (request: Request) => {
    const user = await requireMobileUser(request);
    const parsed = deviceSchema.safeParse(await readMobileJSON(request));
    if (!parsed.success) return mobileError('INVALID_DEVICE', 'Ongeldig apparaat.', 400);
    if (parsed.data.environment === 'production' && process.env.MOBILE_APNS_ALLOW_PRODUCTION !== 'true') {
        return mobileError('APNS_ENVIRONMENT_DISABLED', 'TestFlight-notificaties zijn nog niet ingeschakeld.', 409);
    }
    const token = parsed.data.token.toLowerCase();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`mobile-device:${parsed.data.environment}:${token}`]);
        // Rebinding a token must delete the old device and its queued payloads first.
        await client.query(
            `DELETE FROM mobile_devices WHERE environment='acc' AND token=$1 AND apns_environment=$2
             AND (user_id<>$3 OR session_id<>$4)`, [token, parsed.data.environment, user.id, user.sessionId]
        );
        await client.query(
            `INSERT INTO mobile_devices(environment,user_id,session_id,token,apns_environment)
             VALUES('acc',$1,$2,$3,$4)
             ON CONFLICT(environment,apns_environment,token) DO UPDATE SET updated_at=now()`,
            [user.id, user.sessionId, token, parsed.data.environment]
        );
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally { client.release(); }
    return mobileResponse({ success: true, registered: true });
});
