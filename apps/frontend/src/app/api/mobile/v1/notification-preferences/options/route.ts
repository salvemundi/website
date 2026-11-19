import { mobileResponse, mobileRoute } from '@/server/mobile/http';
import { requireMobileUser } from '@/server/mobile/session';
import { notificationOptions } from '@/server/mobile/notifications';
export const GET = mobileRoute(async (request: Request) => mobileResponse(await notificationOptions(await requireMobileUser(request))));
