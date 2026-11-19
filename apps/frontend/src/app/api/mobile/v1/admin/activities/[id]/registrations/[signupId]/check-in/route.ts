import { mobileRoute } from '@/server/mobile/http';
import * as admin from '@/server/mobile/activity-admin-api';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function PATCH(request:Request,{params}:{params:Promise<{id:string;signupId:string}>}){
 const {id,signupId}=await params;return mobileRoute(r=>admin.activityAdminCheckIn(r,id,signupId))(request);
}
