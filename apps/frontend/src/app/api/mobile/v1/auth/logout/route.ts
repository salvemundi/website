import { mobileRoute } from '@/server/mobile/http';
import { logoutMobileSession } from '@/server/mobile/auth';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = mobileRoute(logoutMobileSession);
