import { existsSync } from 'node:fs';
// Load the actual website registry; Docker copies this same source, never a second role map.
const bundled = new URL('../permissions-config.ts', import.meta.url);
const { COMMITTEES, FEATURE_ACCESS } = await import(existsSync(bundled) ? bundled.href : new URL('../../../frontend/src/shared/lib/permissions-config.ts', import.meta.url).href);
export function organizerScope(committees) {
    const groups = committees.map(c => c.azure_group_id);
    const global = groups.includes(COMMITTEES.ICT) || groups.some(id => FEATURE_ACCESS.commissies.includes(id));
    return { allowed: global || groups.some(id => FEATURE_ACCESS.activiteiten.includes(id)), global, ids: committees.map(c => Number(c.id)).filter(id => Number.isSafeInteger(id) && id > 0) };
}
export async function currentOrganizerScope(client, userId) {
    const { rows } = await client.query('SELECT c.id,c.azure_group_id FROM committees c JOIN committee_members cm ON cm.committee_id=c.id WHERE cm.user_id=$1', [userId]);
    return organizerScope(rows);
}
export function canObserveEvent(scope, event) { return scope.allowed && (scope.global || scope.ids.includes(Number(event.committee_id))); }
