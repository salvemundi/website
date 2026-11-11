import { createHash } from 'node:crypto';

export function deliveryEnabled(env) {
    return env.ENV_NAME === 'acc' && env.MOBILE_API_ENABLED === 'true' && env.MOBILE_NOTIFICATIONS_ENABLED === 'true'
        && (env.MOBILE_NOTIFICATION_SHARED_DB_PILOT !== 'true' || sharedPilotAllowed(env));
}
export function allowedUserIds(env) {
    return (env.MOBILE_NOTIFICATION_ALLOWED_USER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean);
}
export function sharedPilotAllowed(env) {
    const users = allowedUserIds(env);
    return env.MOBILE_NOTIFICATION_SHARED_DB_PILOT === 'true'
        && env.ENV_NAME === 'acc' && env.MOBILE_API_ENABLED === 'true' && env.MOBILE_NOTIFICATIONS_ENABLED === 'true'
        && users.length === 1 && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(users[0])
        && users[0] === env.MOBILE_NOTIFICATION_SHARED_DB_USER_ID
        && env.MOBILE_APNS_ALLOW_PRODUCTION === 'false'
        && Boolean(env.DB_NAME) && env.DB_NAME === env.MOBILE_NOTIFICATION_SHARED_DB_EXPECTED_NAME
        && env.DB_NAME === env.PRODUCTION_DB_NAME;
}
export function scopedUserIds(env) {
    if (env.MOBILE_NOTIFICATION_SHARED_DB_PILOT === 'true' && !sharedPilotAllowed(env)) return [];
    return allowedUserIds(env).filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
}
export function deviceAllowed(device, env) {
    if (env.MOBILE_NOTIFICATION_SHARED_DB_PILOT === 'true' && !sharedPilotAllowed(env)) return false;
    return device.environment === 'acc' && allowedUserIds(env).includes(device.user_id)
        && (device.apns_environment === 'sandbox'
            || (device.apns_environment === 'production' && env.MOBILE_APNS_ALLOW_PRODUCTION === 'true'));
}
export function snapshotOf(row) {
    return {
        paymentStatus: row.payment_status ?? 'open',
        event: { title: row.name, startsAt: row.starts_at, location: row.location, status: row.event_status }
    };
}
export function fingerprint(value) {
    return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 24);
}
export function changesFor(previous, current, initialized, now = new Date()) {
    if (!initialized) return [];
    const changes = [];
    if (!previous) changes.push({ kind: 'registrations', suffix: 'registered' });
    if (previous && previous.paymentStatus !== current.paymentStatus) {
        changes.push({ kind: 'payments', suffix: `payment:${current.paymentStatus}` });
    }
    if (previous && fingerprint(previous.event) !== fingerprint(current.event)) {
        changes.push({ kind: 'eventChanges', suffix: `event:${fingerprint(current.event)}` });
    }
    const untilStart = Date.parse(current.event.startsAt) - now.getTime();
    if (current.paymentStatus === 'paid' && current.event.status === 'published' && untilStart > 0 && untilStart <= 24 * 60 * 60 * 1000) {
        changes.push({ kind: 'reminders', suffix: `reminder:${current.event.startsAt}` });
    }
    return changes;
}
export function notificationPayload(kind, activityID) {
    const bodies = {
        registrations: 'Je inschrijving is ontvangen. Bekijk je ticket in de app.',
        payments: 'De betaalstatus van je inschrijving is bijgewerkt.',
        eventChanges: 'Een activiteit waarvoor je bent ingeschreven is gewijzigd.',
        reminders: 'Binnen 24 uur begint een activiteit waarvoor je bent ingeschreven.'
    };
    return { aps: { alert: { title: 'Salve Mundi', body: bodies[kind] }, sound: 'default' }, activityID };
}
export function classifyAPNs(status, reason) {
    if (status === 200) return 'sent';
    if (status === 410 || (status === 400 && reason === 'BadDeviceToken')) return 'remove-device';
    if (status === 429 || status >= 500) return 'retry';
    return 'failed';
}
export function retryDelay(attempt) {
    return Math.min(60 * 60, 30 * 2 ** Math.min(Math.max(attempt - 1, 0), 7));
}
