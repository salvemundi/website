import { z } from 'zod';
import { pool } from '@/lib/database/db';
import { mobileError, mobileResponse, mobileRoute, readMobileJSON } from '@/server/mobile/http';
import { requireMobileUser } from '@/server/mobile/session';
import { readNotificationPreferences } from '@/server/mobile/notifications';

const preferencesSchema = z.object({
    registrations: z.boolean(), payments: z.boolean(), eventChanges: z.boolean(), reminders: z.boolean()
}).strict();

export const GET = mobileRoute(async (request: Request) => {
    const user = await requireMobileUser(request);
    return mobileResponse(await readNotificationPreferences(user.id));
});
export const PATCH = mobileRoute(async (request: Request) => {
    const user = await requireMobileUser(request);
    const parsed = preferencesSchema.safeParse(await readMobileJSON(request));
    if (!parsed.success) return mobileError('INVALID_PREFERENCES', 'Ongeldige notificatievoorkeuren.', 400);
    const p = parsed.data;
    await pool.query(
        `INSERT INTO mobile_notification_preferences(environment,user_id,registrations,payments,event_changes,reminders)
         VALUES('acc',$1,$2,$3,$4,$5)
         ON CONFLICT(environment,user_id) DO UPDATE SET registrations=EXCLUDED.registrations,
         payments=EXCLUDED.payments,event_changes=EXCLUDED.event_changes,reminders=EXCLUDED.reminders,updated_at=now()`,
        [user.id, p.registrations, p.payments, p.eventChanges, p.reminders]
    );
    return mobileResponse(p);
});
