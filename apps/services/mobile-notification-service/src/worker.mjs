import { scopedUserIds, deviceAllowed, snapshotOf, changesFor, notificationPayload, classifyAPNs, retryDelay, fingerprint } from './policy.mjs';
import { sendAPNs } from './apns.mjs';
import { getWorkerSessionColumns } from './session-columns.mjs';

import { reconcileActivityAlerts, futureEventsSQL } from './activity-reconcile.mjs';
import { activityKinds, activitySnapshot, activityDeliveryAllowed } from './activity-policy.mjs';
import { currentOrganizerScope } from './activity-scope.mjs';

const preferenceColumns = { registrations: 'registrations', payments: 'payments', eventChanges: 'event_changes', reminders: 'reminders' };

export async function reconcile(client, env) {
    const users = scopedUserIds(env);
    if (!users.length) return;
    const sessionColumns = await getWorkerSessionColumns(client);
    const { rows: userRows } = await client.query(
        `SELECT DISTINCT d.user_id FROM mobile_devices d JOIN auth_sessions s ON s.id=d.session_id AND CAST(s.${sessionColumns.userId} AS TEXT)=CAST(d.user_id AS TEXT)
         JOIN directus_users u ON u.id=d.user_id
         WHERE d.environment='acc' AND d.user_id = ANY($1::uuid[]) AND s.${sessionColumns.expiresAt}>now() AND u.status='active'
         AND (d.apns_environment='sandbox' OR $2::boolean)`, [users, env.MOBILE_APNS_ALLOW_PRODUCTION === 'true']
    );
    for (const { user_id: userId } of userRows) {
        await client.query('BEGIN');
        try {
            // Serialize reconciliation for this account, including first-run baseline creation.
            await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`mobile-notifications:${userId}`]);
            const initialized = (await client.query(`SELECT 1 FROM mobile_notification_users WHERE environment='acc' AND user_id=$1`, [userId])).rowCount > 0;
            const { rows } = await client.query(
                `SELECT s.id,s.event_id,s.payment_status,e.name,e.location,e.status AS event_status,
                 (((e.event_date + COALESCE(e.event_time,'00:00'::time)) AT TIME ZONE 'Europe/Amsterdam')) AS starts_at
                 FROM event_signups s JOIN events e ON e.id=s.event_id JOIN directus_users u ON u.id=$1
                 WHERE (s.directus_relations=u.id OR lower(s.participant_email)=lower(u.email))
                 AND e.event_date>=CURRENT_DATE - interval '7 days' ORDER BY s.id`, [userId]
            );
            for (const row of rows) {
                const current = snapshotOf({ ...row, starts_at: row.starts_at instanceof Date ? row.starts_at.toISOString() : row.starts_at });
                const { rows: old } = await client.query(
                    `SELECT snapshot FROM mobile_notification_observations WHERE environment='acc' AND user_id=$1 AND registration_id=$2`, [userId, row.id]
                );
                const changes = changesFor(old[0]?.snapshot, current, initialized);
                for (const change of changes) {
                    const preferenceColumn = preferenceColumns[change.kind];
                    // Column comes from a closed internal map, never from request input.
                    await client.query(
                        `INSERT INTO mobile_notification_outbox(environment,device_id,kind,dedupe_key,payload)
                         SELECT 'acc',d.id,$2,$3,$4::jsonb FROM mobile_devices d
                         JOIN auth_sessions s ON s.id=d.session_id AND CAST(s.${sessionColumns.userId} AS TEXT)=CAST(d.user_id AS TEXT)
                         LEFT JOIN mobile_notification_preferences p ON p.environment='acc' AND p.user_id=d.user_id
                         WHERE d.environment='acc' AND d.user_id=$1 AND s.${sessionColumns.expiresAt}>now() AND COALESCE(p.${preferenceColumn},true)
                         AND (d.apns_environment='sandbox' OR $5::boolean)
                         ON CONFLICT(environment,device_id,dedupe_key) DO NOTHING`,
                        [userId, change.kind, `${row.id}:${change.suffix}`, JSON.stringify(notificationPayload(change.kind, `event:${row.event_id}`)), env.MOBILE_APNS_ALLOW_PRODUCTION === 'true']
                    );
                }
                await client.query(
                    `INSERT INTO mobile_notification_observations(environment,user_id,registration_id,snapshot) VALUES('acc',$1,$2,$3::jsonb)
                     ON CONFLICT(environment,user_id,registration_id) DO UPDATE SET snapshot=EXCLUDED.snapshot,observed_at=now()`,
                    [userId, row.id, JSON.stringify(current)]
                );
            }
            await reconcileActivityAlerts(client,userId,sessionColumns,env);
            await client.query(`INSERT INTO mobile_notification_users(environment,user_id) VALUES('acc',$1) ON CONFLICT DO NOTHING`, [userId]);
            await client.query('COMMIT');
        } catch (error) { await client.query('ROLLBACK'); throw error; }
    }
}

export async function deliver(client, env, send = sendAPNs) {
    const users = scopedUserIds(env);
    if (!users.length) return;
    const sessionColumns = await getWorkerSessionColumns(client);
    // Reclaim jobs from a crashed worker; each request has a 10-second timeout.
    await client.query(`UPDATE mobile_notification_outbox SET status='pending',locked_at=NULL WHERE environment='acc' AND status='processing' AND locked_at<now()-interval '5 minutes'
        AND device_id IN (SELECT id FROM mobile_devices WHERE environment='acc' AND user_id=ANY($1::uuid[]) AND (apns_environment='sandbox' OR $2::boolean))`, [users, env.MOBILE_APNS_ALLOW_PRODUCTION === 'true']);
    for (let i = 0; i < 100; i++) {
        const { rows } = await client.query(
            `UPDATE mobile_notification_outbox o SET status='processing',locked_at=now(),attempts=attempts+1
             WHERE environment='acc' AND id=(SELECT id FROM mobile_notification_outbox WHERE environment='acc' AND status='pending'
             AND device_id IN (SELECT id FROM mobile_devices WHERE environment='acc' AND user_id=ANY($1::uuid[]) AND (apns_environment='sandbox' OR $2::boolean))
             AND next_attempt_at<=now() ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING o.*`, [users, env.MOBILE_APNS_ALLOW_PRODUCTION === 'true']
        );
        const job = rows[0];
        if (!job) break;
        const { rows: devices } = await client.query(
            `SELECT d.*,u.status AS user_status,s.${sessionColumns.expiresAt} AS expires_at,p.registrations,p.payments,p.event_changes,p.reminders,p.activity_announcements,p.activity_committee_ids,p.organizer_almost_full,p.organizer_capacity_percent,p.organizer_signup_thresholds
             FROM mobile_devices d JOIN auth_sessions s ON s.id=d.session_id AND CAST(s.${sessionColumns.userId} AS TEXT)=CAST(d.user_id AS TEXT) JOIN directus_users u ON u.id=d.user_id
             LEFT JOIN mobile_notification_preferences p ON p.environment='acc' AND p.user_id=d.user_id
             WHERE d.id=$1 AND d.environment='acc' AND d.user_id=ANY($2::uuid[]) AND (d.apns_environment='sandbox' OR $3::boolean) AND s.${sessionColumns.expiresAt}>now()`, [job.device_id, users, env.MOBILE_APNS_ALLOW_PRODUCTION === 'true']
        );
        const device = devices[0];
        if (!device || device.user_status !== 'active' || !deviceAllowed(device, env) || device[preferenceColumns[job.kind]] === false) {
            await client.query(`UPDATE mobile_notification_outbox SET status='skipped',locked_at=NULL WHERE id=$1 AND environment='acc' AND device_id IN (SELECT id FROM mobile_devices WHERE environment='acc' AND user_id=ANY($2::uuid[]) AND (apns_environment='sandbox' OR $3::boolean))`, [job.id, users, env.MOBILE_APNS_ALLOW_PRODUCTION === 'true']);
            continue;
        }
        if (!preferenceColumns[job.kind] && !activityKinds.has(job.kind)) {
            await client.query(`UPDATE mobile_notification_outbox SET status='skipped',locked_at=NULL WHERE id=$1 AND environment='acc' AND device_id IN (SELECT id FROM mobile_devices WHERE environment='acc' AND user_id=ANY($2::uuid[]) AND (apns_environment='sandbox' OR $3::boolean))`, [job.id, users, env.MOBILE_APNS_ALLOW_PRODUCTION === 'true']);
            continue;
        }
        if (activityKinds.has(job.kind)) {
            const match = /^event:([1-9][0-9]*)$/.exec(job.payload?.activityID || '');
            const { rows: events } = match ? await client.query(futureEventsSQL + ' AND e.id=$1',[Number(match[1])]) : {rows:[]};
            const scope = await currentOrganizerScope(client,device.user_id);
            if (!events[0] || !activityDeliveryAllowed(job.kind,activitySnapshot(events[0]),device,scope,job.metadata)) {
                await client.query(`UPDATE mobile_notification_outbox SET status='skipped',locked_at=NULL WHERE id=$1 AND environment='acc' AND device_id IN (SELECT id FROM mobile_devices WHERE environment='acc' AND user_id=ANY($2::uuid[]) AND (apns_environment='sandbox' OR $3::boolean))`, [job.id, users, env.MOBILE_APNS_ALLOW_PRODUCTION === 'true']);
                continue;
            }
        }
        if (job.kind === 'reminders') {
            const registrationID = String(job.dedupe_key).split(':')[0];
            const { rowCount } = await client.query(
                `SELECT 1 FROM event_signups s JOIN events e ON e.id=s.event_id JOIN directus_users u ON u.id=$2
                 WHERE s.id=$1 AND (s.directus_relations=u.id OR lower(s.participant_email)=lower(u.email))
                 AND s.payment_status='paid' AND e.status='published'
                 AND ((e.event_date + COALESCE(e.event_time,'00:00'::time)) AT TIME ZONE 'Europe/Amsterdam')>now()
                 AND ((e.event_date + COALESCE(e.event_time,'00:00'::time)) AT TIME ZONE 'Europe/Amsterdam')<=now()+interval '24 hours'`,
                [registrationID, device.user_id]
            );
            if (!rowCount) {
                await client.query(`UPDATE mobile_notification_outbox SET status='skipped',locked_at=NULL WHERE id=$1 AND environment='acc' AND device_id IN (SELECT id FROM mobile_devices WHERE environment='acc' AND user_id=ANY($2::uuid[]) AND (apns_environment='sandbox' OR $3::boolean))`, [job.id, users, env.MOBILE_APNS_ALLOW_PRODUCTION === 'true']);
                continue;
            }
        }
        let result;
        try { result = await send(device, job.payload, fingerprint(job.dedupe_key), env); }
        catch { result = { status: 503, reason: 'ProviderUnavailable' }; }
        const action = classifyAPNs(result.status, result.reason);
        if (action === 'remove-device') {
            await client.query(`DELETE FROM mobile_devices WHERE id=$1 AND environment='acc' AND user_id=ANY($2::uuid[]) AND (apns_environment='sandbox' OR $3::boolean)`, [device.id, users, env.MOBILE_APNS_ALLOW_PRODUCTION === 'true']);
            continue;
        }
        const retry = action === 'retry' && job.attempts < 8;
        await client.query(
            `UPDATE mobile_notification_outbox SET status=$2,locked_at=NULL,last_error_code=$3,
             next_attempt_at=now()+($4::int*interval '1 second'),sent_at=CASE WHEN $2='sent' THEN now() ELSE NULL END WHERE id=$1 AND environment='acc' AND device_id IN (SELECT id FROM mobile_devices WHERE environment='acc' AND user_id=ANY($5::uuid[]) AND (apns_environment='sandbox' OR $6::boolean))`,
            [job.id, retry ? 'pending' : action === 'sent' ? 'sent' : 'failed', result.reason ?? String(result.status), retryDelay(job.attempts), users, env.MOBILE_APNS_ALLOW_PRODUCTION === 'true']
        );
    }
}

export async function removeExpiredDevices(client, env) {
    const users = scopedUserIds(env);
    if (!users.length) return;
    const sessionColumns = await getWorkerSessionColumns(client);
    await client.query(`DELETE FROM mobile_devices d WHERE environment='acc' AND d.user_id=ANY($1::uuid[]) AND (d.apns_environment='sandbox' OR $2::boolean) AND NOT EXISTS(SELECT 1 FROM auth_sessions s WHERE s.id=d.session_id AND CAST(s.${sessionColumns.userId} AS TEXT)=CAST(d.user_id AS TEXT) AND s.${sessionColumns.expiresAt}>now())`, [users, env.MOBILE_APNS_ALLOW_PRODUCTION === 'true']);
}

export async function removeOldOutbox(client, env) {
    const users = scopedUserIds(env);
    if (!users.length) return;
    await client.query(`DELETE FROM mobile_notification_outbox WHERE environment='acc' AND status IN ('sent','failed','skipped') AND created_at<now()-interval '30 days'
        AND device_id IN (SELECT id FROM mobile_devices WHERE environment='acc' AND user_id=ANY($1::uuid[]) AND (apns_environment='sandbox' OR $2::boolean))`, [users, env.MOBILE_APNS_ALLOW_PRODUCTION === 'true']);
}
