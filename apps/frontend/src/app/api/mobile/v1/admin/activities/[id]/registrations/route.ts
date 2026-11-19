import { mobileRoute } from '@/server/mobile/http';
import * as admin from '@/server/mobile/activity-admin-api';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;return mobileRoute(r=>admin.activityAdminRegistrations(r,id))(request);
}
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;return mobileRoute(r=>admin.activityAdminAddRegistration(r,id))(request);
}
