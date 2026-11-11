import { canObserveEvent } from './activity-scope.mjs';
export const activityKinds = new Set(['activityAnnouncements','organizerAlmostFull','organizerSignups']);
export function activitySnapshot(row) {
    return { published: row.status === 'published' && (!row.publish_date || new Date(row.publish_date) <= new Date()), count: Number(row.confirmed_count || 0), capacity: row.max_sign_ups == null ? null : Number(row.max_sign_ups), committee_id: row.committee_id == null ? null : Number(row.committee_id) };
}
export function subscribedTo(event, p) {
    const ids = p.activity_committee_ids || [];
    return p.activity_announcements === true && (!ids.length || ids.includes(Number(event.committee_id)));
}
export function activityChanges(previous, current, initialized, p, scope) {
    if (!initialized || !current.published) return [];
    const changes = [];
    if ((!previous || !previous.published) && subscribedTo(current,p)) changes.push({kind:'activityAnnouncements', suffix:'announced'});
    if (!previous || !previous.published || !canObserveEvent(scope,current)) return changes;
    // Only an actual increase crosses a threshold. Preference/capacity changes cannot trigger historical alerts.
    if (current.count <= previous.count) return changes;
    const percent = Number(p.organizer_capacity_percent || 90);
    if (p.organizer_almost_full === true && current.capacity > 0 && previous.capacity === current.capacity) {
        const threshold = Math.ceil(current.capacity * percent / 100);
        if (previous.count < threshold && current.count >= threshold) changes.push({kind:'organizerAlmostFull',suffix:`capacity:${percent}`,threshold,percent});
    }
    for (const threshold of p.organizer_signup_thresholds || []) {
        if (Number.isInteger(threshold) && threshold > 0 && threshold <= 10000 && previous.count < threshold && current.count >= threshold) changes.push({kind:'organizerSignups',suffix:`signups:${threshold}`,threshold});
    }
    return changes;
}
export function activityDeliveryAllowed(kind, event, prefs, scope, metadata) {
    if (!event.published) return false;
    if (kind === 'activityAnnouncements') return subscribedTo(event,prefs);
    if (!canObserveEvent(scope,event)) return false;
    if (kind === 'organizerAlmostFull') return prefs.organizer_almost_full === true && event.capacity > 0 && Number(prefs.organizer_capacity_percent || 90) === metadata?.percent && event.count >= Math.ceil(event.capacity * metadata.percent / 100);
    if (kind === 'organizerSignups') return (prefs.organizer_signup_thresholds || []).includes(metadata?.threshold) && event.count >= metadata.threshold;
    return false;
}
export function activityPayload(kind,eventID) {
    const body = {activityAnnouncements:'Er is een nieuwe activiteit. Bekijk deze in de app.',organizerAlmostFull:'Een activiteit die je beheert is bijna vol.',organizerSignups:'Een activiteit die je beheert heeft een aanmeldingsmijlpaal bereikt.'}[kind];
    return {aps:{alert:{title:'Salve Mundi',body},sound:'default'},activityID:`event:${eventID}`};
}
