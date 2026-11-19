import { pool } from '@/lib/database/db';
import { mobileError, mobileResponse, mobileRoute } from '@/server/mobile/http';
import { requireMobileUser } from '@/server/mobile/session';

export const DELETE = mobileRoute(async (request: Request) => {
    const user = await requireMobileUser(request);
    const token = new URL(request.url).pathname.split('/').pop()?.toLowerCase() ?? '';
    if (!/^[a-f0-9]{64,200}$/.test(token)) return mobileError('INVALID_DEVICE', 'Ongeldig apparaat.', 400);
    await pool.query(
        `DELETE FROM mobile_devices WHERE environment='acc' AND user_id=$1 AND session_id=$2 AND token=$3`,
        [user.id, user.sessionId, token]
    );
    return mobileResponse({ success: true, registered: false });
});
