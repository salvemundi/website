import 'server-only';
import { pool } from '@/lib/database/db';

export interface NotificationPreferences {
    registrations: boolean;
    payments: boolean;
    eventChanges: boolean;
    reminders: boolean;
}
export const defaultNotificationPreferences: NotificationPreferences = {
    registrations: true, payments: true, eventChanges: true, reminders: true
};

export async function readNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    const { rows } = await pool.query<NotificationPreferences>(
        `SELECT registrations, payments, event_changes AS "eventChanges", reminders
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
