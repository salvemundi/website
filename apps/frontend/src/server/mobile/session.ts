import 'server-only';
import { randomUUID } from 'node:crypto';
import { pool } from '@/lib/database/db';
import { MobileError } from './http';
import { hashMobileToken, isNativeToken, newMobileToken } from './security';
import { getSessionColumns } from './session-columns';

export interface MobileUser {
    id: string; name: string; email: string; first_name: string | null; last_name: string | null;
    phone_number: string | null; membership_status: string | null; membership_expiry: string | null;
    entra_id: string | null; sessionId: string;
}
export async function requireMobileUser(request: Request): Promise<MobileUser> {
    const match = request.headers.get('authorization')?.match(/^Bearer (smi_[A-Za-z0-9_-]+)$/);
    if (!match || !isNativeToken(match[1])) throw new MobileError('unauthorized', 'Log opnieuw in.', 401);
    const columns = await getSessionColumns();
    // Do not accept browser cookies or consult the web session cache. Revocation is immediate.
    const result = await pool.query<MobileUser>(`
        SELECT u.id, COALESCE(u.name, CONCAT_WS(' ',u.first_name,u.last_name),'') AS name,
               u.email, u.first_name, u.last_name, u.phone_number, u.membership_status,
               u.membership_expiry::text, u.entra_id, s.id AS "sessionId"
        FROM auth_sessions s JOIN directus_users u ON CAST(u.id AS TEXT)=CAST(s.${columns.userId} AS TEXT)
        WHERE s.token=$1 AND s.id LIKE 'mobile:%' AND s.${columns.expiresAt} > NOW() AND u.status='active'
    `, [hashMobileToken(match[1])]);
    const user = result.rows.at(0);
    if (!user?.email) throw new MobileError('unauthorized', 'Log opnieuw in.', 401);
    return user;
}
export async function createMobileSession(userId: string, request: Request) {
    const columns = await getSessionColumns();
    const token = newMobileToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const result = await pool.query(`
        INSERT INTO auth_sessions (id,token,${columns.userId},${columns.expiresAt},${columns.createdAt},${columns.updatedAt},${columns.userAgent})
        SELECT $1,$2,id,$3,NOW(),NOW(),$4 FROM directus_users WHERE id=$5 AND status='active'
        RETURNING id
    `, [`mobile:${randomUUID()}`, hashMobileToken(token), expiresAt, request.headers.get('user-agent')?.slice(0, 512) || 'Salve Mundi iOS', userId]);
    if (!result.rowCount) throw new MobileError('unauthorized', 'Account niet beschikbaar.', 401);
    return { token, expiresAt };
}
