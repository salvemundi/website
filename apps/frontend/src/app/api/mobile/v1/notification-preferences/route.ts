import { mobileError, mobileResponse, mobileRoute, readMobileJSON } from '@/server/mobile/http';
import { requireMobileUser } from '@/server/mobile/session';
import { readNotificationPreferences, saveNotificationPreferences, notificationPreferencesSchema } from '@/server/mobile/notifications';
export const GET = mobileRoute(async (request: Request) => {
    const user = await requireMobileUser(request);
    return mobileResponse(await readNotificationPreferences(user.id));
});
export const PATCH = mobileRoute(async (request: Request) => {
    const user = await requireMobileUser(request);
    const parsed = notificationPreferencesSchema.safeParse(await readMobileJSON(request));
    if (!parsed.success) return mobileError('INVALID_PREFERENCES', 'Ongeldige notificatievoorkeuren.', 400);
    return mobileResponse(await saveNotificationPreferences(user, parsed.data));
});
