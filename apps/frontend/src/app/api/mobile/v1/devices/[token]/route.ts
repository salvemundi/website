import { pool } from '@/lib/database/db';
import { mobileError, mobileResponse, mobileRoute } from '@/server/mobile/http';
import { APNS_TOKEN_PATTERN, FCM_TOKEN_PATTERN } from '@/server/mobile/policy';
import { requireMobileUser } from '@/server/mobile/session';

export const DELETE = mobileRoute(async (request: Request) => {
    const user = await requireMobileUser(request);
    let raw = new URL(request.url).pathname.split('/').pop() ?? '';
    try { raw = decodeURIComponent(raw); } catch { raw = ''; }
    // APNs tokens are stored lower-cased; FCM tokens are case-sensitive and stored verbatim.
    const candidates = new Set<string>();
    if (APNS_TOKEN_PATTERN.test(raw)) candidates.add(raw.toLowerCase());
    if (FCM_TOKEN_PATTERN.test(raw)) candidates.add(raw);
    if (!candidates.size) return mobileError('INVALID_DEVICE', 'Ongeldig apparaat.', 400);
    await pool.query(
        `DELETE FROM mobile_devices WHERE environment='acc' AND user_id=$1 AND session_id=$2 AND token=ANY($3::text[])`,
        [user.id, user.sessionId, [...candidates]]
    );
    return mobileResponse({ success: true, registered: false });
});
