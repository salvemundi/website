import { mobileRoute } from '@/server/mobile/http';
import { completeMobileLogin } from '@/server/mobile/auth';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = mobileRoute(completeMobileLogin);
