import { mobileRoute } from '@/server/mobile/http';
import { mobileProfile, updateMobileProfile } from '@/server/mobile/data';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = mobileRoute(mobileProfile);
export const PATCH = mobileRoute(updateMobileProfile);
