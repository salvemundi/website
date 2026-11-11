import { currentOrganizerScope } from './activity-scope.mjs';
import { activitySnapshot, activityChanges, activityPayload } from './activity-policy.mjs';
export const futureEventsSQL = `SELECT e.id,e.committee_id,e.status,e.max_sign_ups,
    (e.publish_date AT TIME ZONE 'Europe/Amsterdam') AS publish_date,
    (SELECT COUNT(*) FROM event_signups es WHERE es.event_id=e.id AND es.payment_status='paid') AS confirmed_count
    FROM events e WHERE ((e.event_date + COALESCE(e.event_time,'00:00'::time)) AT TIME ZONE 'Europe/Amsterdam')>now()`;
export async function reconcileActivityAlerts(client,userId,sessionColumns,env) {
    const p = (await client.query(`SELECT * FROM mobile_notification_preferences WHERE environment='acc' AND user_id=$1`,[userId])).rows[0] || {};
    const initialized = (await client.query(`SELECT 1 FROM mobile_notification_activity_users WHERE environment='acc' AND user_id=$1`,[userId])).rowCount > 0;
    const scope = await currentOrganizerScope(client,userId);
    const { rows } = await client.query(futureEventsSQL);
    for (const row of rows) {
        const current = activitySnapshot(row);
        const old = (await client.query(`SELECT snapshot FROM mobile_notification_activity_observations WHERE environment='acc' AND user_id=$1 AND event_id=$2`,[userId,row.id])).rows[0]?.snapshot;
        for (const change of activityChanges(old,current,initialized,p,scope)) {
            await client.query(`INSERT INTO mobile_notification_outbox(environment,device_id,kind,dedupe_key,payload,metadata)
                SELECT 'acc',d.id,$2,$3,$4::jsonb,$6::jsonb FROM mobile_devices d JOIN auth_sessions s ON s.id=d.session_id AND CAST(s.${sessionColumns.userId} AS TEXT)=CAST(d.user_id AS TEXT)
                WHERE d.environment='acc' AND d.user_id=$1 AND s.${sessionColumns.expiresAt}>now() AND (d.apns_environment='sandbox' OR $5::boolean)
                ON CONFLICT(environment,device_id,dedupe_key) DO NOTHING`,
                [userId,change.kind,`activity:${row.id}:${change.suffix}`,JSON.stringify(activityPayload(change.kind,row.id)),env.MOBILE_APNS_ALLOW_PRODUCTION==='true',JSON.stringify({threshold:change.threshold,percent:change.percent})]);
        }
        await client.query(`INSERT INTO mobile_notification_activity_observations(environment,user_id,event_id,snapshot) VALUES('acc',$1,$2,$3::jsonb)
            ON CONFLICT(environment,user_id,event_id) DO UPDATE SET snapshot=EXCLUDED.snapshot,observed_at=now()`,[userId,row.id,JSON.stringify(current)]);
    }
    await client.query(`INSERT INTO mobile_notification_activity_users(environment,user_id) VALUES('acc',$1) ON CONFLICT DO NOTHING`,[userId]);
    await client.query(`DELETE FROM mobile_notification_activity_observations o WHERE environment='acc' AND user_id=$1 AND NOT EXISTS(SELECT 1 FROM events e WHERE e.id=o.event_id AND e.event_date>=CURRENT_DATE-interval '7 days')`,[userId]);
}
