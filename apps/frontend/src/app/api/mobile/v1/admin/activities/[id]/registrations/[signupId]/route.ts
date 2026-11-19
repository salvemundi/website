import { mobileRoute } from '@/server/mobile/http';
import * as admin from '@/server/mobile/activity-admin-api';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function DELETE(request:Request,{params}:{params:Promise<{id:string;signupId:string}>}){
 const {id,signupId}=await params;return mobileRoute(r=>admin.activityAdminRemoveRegistration(r,id,signupId))(request);
}
