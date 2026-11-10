import { mobileRoute } from '@/server/mobile/http';
import * as admin from '@/server/mobile/activity-admin-api';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;return mobileRoute(r=>admin.activityAdminRead(r,id))(request);
}
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;return mobileRoute(r=>admin.activityAdminUpdate(r,id))(request);
}
export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;return mobileRoute(r=>admin.activityAdminDelete(r,id))(request);
}
