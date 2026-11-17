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
const paymentLabels = { paid: 'betaald', open: 'open', pending: 'in behandeling', failed: 'mislukt', cancelled: 'geannuleerd', canceled: 'geannuleerd', refunded: 'terugbetaald', expired: 'verlopen' };
const statusLabels = { published: 'gepubliceerd', draft: 'concept', cancelled: 'geannuleerd', canceled: 'geannuleerd', archived: 'gearchiveerd' };
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
function when(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value ?? '');
    return new Intl.DateTimeFormat('nl-NL', { timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(date).replace(',', '');
}
export function describeEventChanges(previous, current) {
    const parts = [];
    if (previous.title !== current.title) parts.push(`naam: ${previous.title} → ${current.title}`);
    if (previous.startsAt !== current.startsAt && Date.parse(previous.startsAt) !== Date.parse(current.startsAt)) parts.push(`nieuwe datum/tijd: ${when(current.startsAt)}`);
    if (previous.location !== current.location) parts.push(current.location ? `nieuwe locatie: ${current.location}` : 'locatie vervallen');
    if (previous.status !== current.status) parts.push(`status: ${statusLabels[current.status] ?? current.status}`);
    return parts;
}
export function changesFor(previous, current, initialized, now = new Date()) {
    if (!initialized) return [];
    const changes = [];
    const title = current.event.title;
    if (!previous) changes.push({ kind: 'registrations', suffix: 'registered', title });
    if (previous && previous.paymentStatus !== current.paymentStatus) {
        changes.push({ kind: 'payments', suffix: `payment:${current.paymentStatus}`, title, detail: `Betaalstatus: ${paymentLabels[current.paymentStatus] ?? current.paymentStatus}.` });
    }
    if (previous && fingerprint(previous.event) !== fingerprint(current.event)) {
        const parts = describeEventChanges(previous.event, current.event);
        changes.push({ kind: 'eventChanges', suffix: `event:${fingerprint(current.event)}`, title: previous.event.title || title, detail: parts.length ? `${cap(parts.join('; '))}.` : undefined });
    }
    const untilStart = Date.parse(current.event.startsAt) - now.getTime();
    if (current.paymentStatus === 'paid' && current.event.status === 'published' && untilStart > 0 && untilStart <= 24 * 60 * 60 * 1000) {
        changes.push({ kind: 'reminders', suffix: `reminder:${current.event.startsAt}`, title, detail: `Start ${when(current.event.startsAt)}${current.event.location ? ` in ${current.event.location}` : ''}.` });
    }
    return changes;
}
export function notificationPayload(kind, activityID, change = {}) {
    const bodies = {
        registrations: 'Je inschrijving is ontvangen. Bekijk je ticket in de app.',
        payments: 'De betaalstatus van je inschrijving is bijgewerkt.',
        eventChanges: 'Er is iets gewijzigd aan deze activiteit.',
        reminders: 'Binnen 24 uur begint deze activiteit.'
    };
    const body = change.detail ? (kind === 'registrations' ? bodies[kind] : change.detail) : bodies[kind];
    const title = change.title ? String(change.title).slice(0, 100) : 'Salve Mundi';
    return { aps: { alert: { title, body }, sound: 'default' }, activityID };
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
