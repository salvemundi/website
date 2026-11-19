import { mobileRoute } from '@/server/mobile/http';
import { createAdminWidgetSession } from '@/server/mobile/admin-widget';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = mobileRoute(createAdminWidgetSession);
