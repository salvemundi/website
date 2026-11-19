import 'server-only';
import { pool } from '@/lib/database/db';
import { getRedis } from '@/server/auth/redis-client';
import { activityAdminForUser, requireActivityAdmin } from './activity-admin-auth';
import { listAdminActivitySummaries } from './activity-admin-data';
import { MobileError, mobileResponse, readMobileJSON } from './http';
import { requireMobileUser, type MobileUser } from './session';
import { getSessionColumns } from './session-columns';
import { adminWidgetTokenKey, isAdminWidgetToken, isCurrentWidgetActivity, newAdminWidgetToken, parseAdminWidgetGrant, widgetCredentialLifetimeSeconds, widgetSummaryLifetimeMilliseconds } from './admin-widget-security';

interface WidgetParentUser extends MobileUser { parentExpiresAt: string | Date }

async function parentSession(userId: string, sessionId: string): Promise<WidgetParentUser> {
    const columns = await getSessionColumns();
    // Revalidate the parent every read; Redis is only a scoped grant lookup.
    const { rows } = await pool.query<WidgetParentUser>(`
        SELECT u.id, COALESCE(u.name, CONCAT_WS(' ',u.first_name,u.last_name),'') AS name,
               u.email,u.first_name,u.last_name,u.phone_number,u.membership_status,
               u.membership_expiry::text,u.entra_id,s.id AS "sessionId",s.${columns.expiresAt} AS "parentExpiresAt"
        FROM auth_sessions s JOIN directus_users u ON CAST(u.id AS TEXT)=CAST(s.${columns.userId} AS TEXT)
        WHERE s.id=$1 AND CAST(s.${columns.userId} AS TEXT)=$2 AND s.id LIKE 'mobile:%'
          AND s.token LIKE 'mobile-sha256:%' AND s.${columns.expiresAt}>NOW() AND u.status='active'
    `, [sessionId, userId]);
    const user = rows.at(0);
    if (!user?.email) throw new MobileError('unauthorized', 'Open de app om opnieuw in te loggen.', 401);
    return user;
}

export async function createAdminWidgetSession(request: Request) {
    const actor = await requireActivityAdmin(request);
    if (Object.keys(await readMobileJSON(request)).length !== 0) throw new MobileError('invalid_request', 'Ongeldig verzoek.');
    const user = await parentSession(actor.user.id, actor.user.sessionId);
    const parentExpiry = new Date(user.parentExpiresAt).getTime();
    const seconds = Math.min(widgetCredentialLifetimeSeconds, Math.floor((parentExpiry - Date.now()) / 1000));
    if (seconds < 1) throw new MobileError('unauthorized', 'Log opnieuw in.', 401);
    const token = newAdminWidgetToken();
    const expiresAt = new Date(Date.now() + seconds * 1000).toISOString();
    const redis = await getRedis();
    await redis.set(adminWidgetTokenKey(token), JSON.stringify({ userId: user.id, sessionId: user.sessionId, expiresAt }), 'EX', seconds);
    return mobileResponse({ token, expiresAt });
}

export async function adminWidgetActivities(request: Request) {
    const authorization = request.headers.get('authorization') || '';
    const candidate = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    let user: WidgetParentUser;
    let grantExpiry = Number.POSITIVE_INFINITY;
    if (isAdminWidgetToken(candidate)) {
        const redis = await getRedis();
        const grant = parseAdminWidgetGrant(await redis.get(adminWidgetTokenKey(candidate)));
        if (!grant || Date.parse(grant.expiresAt) <= Date.now()) throw new MobileError('unauthorized', 'Open de app om de widget bij te werken.', 401);
        grantExpiry = Date.parse(grant.expiresAt);
        user = await parentSession(grant.userId, grant.sessionId);
    } else {
        const native = await requireMobileUser(request);
        user = await parentSession(native.id, native.sessionId);
    }
    // Always reload current committees/roles; possession of a grant is never an authorization decision.
    const actor = await activityAdminForUser(user);
    const summaries = await listAdminActivitySummaries(actor);
    const now = Date.now();
    const items = summaries.filter(summary => isCurrentWidgetActivity(summary.activity.startsAt, summary.activity.endsAt, new Date(now)))
        .sort((a, b) => (a.activity.startsAt || '9999').localeCompare(b.activity.startsAt || '9999'))
        .slice(0, 8).map(summary => ({
            id: summary.activity.id, title: summary.activity.title, startsAt: summary.activity.startsAt,
            confirmedCount: summary.confirmedCount, pendingCount: summary.pendingCount,
            checkedInCount: summary.checkedInCount, capacity: summary.activity.capacity
        }));
    return mobileResponse({ items, fetchedAt: new Date(now).toISOString(),
        expiresAt: new Date(Math.min(now + widgetSummaryLifetimeMilliseconds, grantExpiry, new Date(user.parentExpiresAt).getTime())).toISOString() });
}
