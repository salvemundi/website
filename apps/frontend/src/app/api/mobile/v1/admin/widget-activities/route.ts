import { mobileRoute } from '@/server/mobile/http';
import { adminWidgetActivities } from '@/server/mobile/admin-widget';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = mobileRoute(adminWidgetActivities);
