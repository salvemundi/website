import 'server-only';
import { pool } from '@/lib/database/db';
import { z } from 'zod';
import { MobileError } from './http';
import { activityAdminForUser } from './activity-admin-auth';
import type { MobileUser } from './session';

export interface NotificationPreferences {
    registrations: boolean;
    payments: boolean;
    eventChanges: boolean;
    reminders: boolean;
    activityAnnouncements: boolean;
    activityCommitteeIDs: number[];
    organizerAlmostFull: boolean;
    organizerCapacityPercent: number;
    organizerSignupThresholds: number[];
}
export const defaultNotificationPreferences: NotificationPreferences = {
    registrations: true, payments: true, eventChanges: true, reminders: true,
    activityAnnouncements: false, activityCommitteeIDs: [], organizerAlmostFull: false,
    organizerCapacityPercent: 90, organizerSignupThresholds: []
};

export async function readNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    const { rows } = await pool.query<NotificationPreferences>(
        `SELECT registrations, payments, event_changes AS "eventChanges", reminders,
         activity_announcements AS "activityAnnouncements", activity_committee_ids AS "activityCommitteeIDs",
         organizer_almost_full AS "organizerAlmostFull", organizer_capacity_percent AS "organizerCapacityPercent",
         organizer_signup_thresholds AS "organizerSignupThresholds"
         FROM mobile_notification_preferences WHERE environment = 'acc' AND user_id = $1`, [userId]
    );
    return rows[0] ?? defaultNotificationPreferences;
}

export async function removeMobileDevicesForSession(userId: string, sessionId: string): Promise<void> {
    try {
        await pool.query(`DELETE FROM mobile_devices WHERE environment = 'acc' AND user_id = $1 AND session_id = $2`, [userId, sessionId]);
    } catch (error: unknown) {
        // Logout must remain possible before the optional notification migration is applied.
        if (!(error && typeof error === 'object' && 'code' in error && error.code === '42P01')) throw error;
    }
}

const integerList = (max: number, count: number) => z.array(z.number().int().min(1).max(max)).max(count).transform(ids => [...new Set(ids)].sort((a,b) => a-b));
export const notificationPreferencesSchema = z.object({
    registrations: z.boolean(), payments: z.boolean(), eventChanges: z.boolean(), reminders: z.boolean(),
    activityAnnouncements: z.boolean().optional(), activityCommitteeIDs: integerList(2147483647, 100).optional(),
    organizerAlmostFull: z.boolean().optional(), organizerCapacityPercent: z.number().int().min(50).max(100).optional(),
    organizerSignupThresholds: integerList(10000, 10).optional()
}).strict();

export async function notificationOptions(user: MobileUser) {
    const { rows: committees } = await pool.query<{id: number; name: string}>('SELECT id,name FROM committees ORDER BY name');
    try {
        const actor = await activityAdminForUser(user);
        return { committees, organizerCommittees: actor.global ? committees : committees.filter(c => actor.committeeIDs.includes(c.id)), canReceiveOrganizerAlerts: true };
    } catch (error) {
        if (error instanceof MobileError && error.status === 403) return { committees, organizerCommittees: [], canReceiveOrganizerAlerts: false };
        throw error;
    }
}
export async function saveNotificationPreferences(user: MobileUser, patch: z.infer<typeof notificationPreferencesSchema>) {
    const options = await notificationOptions(user);
    if (patch.activityCommitteeIDs?.some(id => !options.committees.some(c => c.id === id))) throw new MobileError('invalid_preferences', 'Kies bestaande commissies.', 400);
    if ((patch.organizerAlmostFull === true || (patch.organizerSignupThresholds?.length ?? 0) > 0) && !options.canReceiveOrganizerAlerts) throw new MobileError('forbidden', 'Je hebt geen toegang tot organisatormeldingen.', 403);
    const p = { ...await readNotificationPreferences(user.id), ...patch };
    // Preferences of former organizers may remain stored, but cannot deliver without live rights.
    await pool.query(`INSERT INTO mobile_notification_preferences(environment,user_id,registrations,payments,event_changes,reminders,
        activity_announcements,activity_committee_ids,organizer_almost_full,organizer_capacity_percent,organizer_signup_thresholds)
        VALUES('acc',$1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT(environment,user_id) DO UPDATE SET registrations=EXCLUDED.registrations,payments=EXCLUDED.payments,
        event_changes=EXCLUDED.event_changes,reminders=EXCLUDED.reminders,activity_announcements=EXCLUDED.activity_announcements,
        activity_committee_ids=EXCLUDED.activity_committee_ids,organizer_almost_full=EXCLUDED.organizer_almost_full,
        organizer_capacity_percent=EXCLUDED.organizer_capacity_percent,organizer_signup_thresholds=EXCLUDED.organizer_signup_thresholds,updated_at=now()`,
        [user.id,p.registrations,p.payments,p.eventChanges,p.reminders,p.activityAnnouncements,p.activityCommitteeIDs,p.organizerAlmostFull,p.organizerCapacityPercent,p.organizerSignupThresholds]);
    return p;
}
