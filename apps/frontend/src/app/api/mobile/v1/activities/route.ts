import { mobileRoute } from '@/server/mobile/http';
import { mobileActivities } from '@/server/mobile/data';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = mobileRoute(async () => mobileActivities());
