import { mobileRoute } from '@/server/mobile/http';
import * as admin from '@/server/mobile/activity-admin-api';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const GET=mobileRoute(admin.activityAdminList);
export const POST=mobileRoute(admin.activityAdminCreate);
