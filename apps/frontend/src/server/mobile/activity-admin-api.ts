import 'server-only';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { MobileError, mobileResponse, readMobileJSON } from './http';
import { requireActivityAdmin, requireEventScope, parseAdminEventID, parseAdminSignupID } from './activity-admin-auth';
import { adminActivityDetail, adminCommitteeChoices, listAdminActivitySummaries } from './activity-admin-data';
import { limitAdminOperation, createAdminActivity, updateAdminActivity, deleteAdminActivity, uploadAdminActivityImage,
    listAdminRegistrations, addAdminRegistration, deleteAdminRegistration, checkInAdminRegistration,
    scanAdminRegistration, messageAdminRegistrations, searchAdminMembers } from './activity-admin-operations';

export async function activityAdminAccess(request: Request) {
    try { const actor = await requireActivityAdmin(request); const scopeVersion = createHash('sha256').update(JSON.stringify({ids:[...actor.committeeIDs].sort((a,b)=>a-b),global:actor.global,edit:actor.canCreate})).digest('hex'); return mobileResponse({canAccess:true,canCreate:actor.canCreate,scopeVersion}); }
    catch(error) { if (error instanceof MobileError && error.status === 403) return mobileResponse({canAccess:false,canCreate:false}); throw error; }
}
export async function activityAdminList(request: Request) {
    const actor = await requireActivityAdmin(request);
    const [activities,committees] = await Promise.all([listAdminActivitySummaries(actor),adminCommitteeChoices(actor)]);
    return mobileResponse({activities,committees,canCreate:actor.canCreate,canAssignNoCommittee:actor.global});
}
export async function activityAdminCreate(request: Request) {
    const actor = await requireActivityAdmin(request); await limitAdminOperation(actor,'write');
    const id = await createAdminActivity(actor,await readMobileJSON(request,256*1024));
    return mobileResponse(await adminActivityDetail(actor,id),201);
}
export async function activityAdminRead(request: Request, id: string) {
    const actor = await requireActivityAdmin(request); return mobileResponse(await adminActivityDetail(actor,parseAdminEventID(id)));
}
export async function activityAdminUpdate(request: Request,id:string) {
    const actor = await requireActivityAdmin(request); await limitAdminOperation(actor,'write');
    const eventID = parseAdminEventID(id);
    await updateAdminActivity(actor,eventID,await readMobileJSON(request,256*1024));
    return mobileResponse(await adminActivityDetail(actor,eventID));
}
export async function activityAdminDelete(request:Request,id:string) {
    const actor = await requireActivityAdmin(request); await limitAdminOperation(actor,'write');
    await deleteAdminActivity(actor,parseAdminEventID(id)); return mobileResponse({success:true});
}
async function boundedImageForm(request:Request):Promise<FormData> {
    const maxBytes = 10*1024*1024+65536;
    if (!request.headers.get('content-type')?.startsWith('multipart/form-data;') || Number(request.headers.get('content-length')||0)>maxBytes) throw new MobileError('invalid_request','Kies een afbeelding of video van maximaal 10 MB.',413);
    const reader = request.body?.getReader();
    if (!reader) throw new MobileError('invalid_request','Kies een bestand.');
    const chunks:Uint8Array[]=[]; let bytes=0;
    try {
        let next=await reader.read();
        while(!next.done) {
            bytes+=next.value.byteLength;
            if(bytes>maxBytes) {await reader.cancel();throw new MobileError('invalid_request','Bestand is te groot (maximaal 10 MB).',413);}
            chunks.push(next.value); next=await reader.read();
        }
    } finally {reader.releaseLock();}
    try { return await new Response(new Uint8Array(Buffer.concat(chunks)),{headers:{'Content-Type':request.headers.get('content-type')||''}}).formData(); }
    catch {throw new MobileError('invalid_request','Ongeldige bestandsupload.');}
}
export async function activityAdminImage(request:Request,id:string) {
    const actor=await requireActivityAdmin(request);const eventID=parseAdminEventID(id);
    await requireEventScope(actor,eventID,'edit');await limitAdminOperation(actor,'image');
    const form=await boundedImageForm(request);const file=form.get('file');
    if(!(file instanceof File)) throw new MobileError('invalid_request','Kies een afbeelding of video.');
    await uploadAdminActivityImage(actor,eventID,file);return mobileResponse(await adminActivityDetail(actor,eventID));
}
export async function activityAdminRegistrations(request:Request,id:string) {
    const actor=await requireActivityAdmin(request);const eventID=parseAdminEventID(id);
    const [detail,registrations]=await Promise.all([adminActivityDetail(actor,eventID),listAdminRegistrations(actor,eventID)]);
    return mobileResponse({activity:detail.summary,registrations});
}
export async function activityAdminAddRegistration(request:Request,id:string) {
    const actor=await requireActivityAdmin(request);await limitAdminOperation(actor,'manual');
    return mobileResponse(await addAdminRegistration(actor,parseAdminEventID(id),await readMobileJSON(request)),201);
}
export async function activityAdminRemoveRegistration(request:Request,id:string,signupID:string) {
    const actor=await requireActivityAdmin(request);await limitAdminOperation(actor,'manual');
    await deleteAdminRegistration(actor,parseAdminEventID(id),parseAdminSignupID(signupID));return mobileResponse({success:true});
}
export async function activityAdminCheckIn(request:Request,id:string,signupID:string) {
    const actor=await requireActivityAdmin(request);await limitAdminOperation(actor,'scan');
    const body=z.object({checkedIn:z.boolean()}).strict().safeParse(await readMobileJSON(request));
    if(!body.success)throw new MobileError('invalid_request','Ongeldige aanwezigheidsstatus.');
    return mobileResponse(await checkInAdminRegistration(actor,parseAdminEventID(id),parseAdminSignupID(signupID),body.data.checkedIn));
}
export async function activityAdminScan(request:Request,id:string) {
    const actor=await requireActivityAdmin(request);await limitAdminOperation(actor,'scan');
    const body=z.object({token:z.string().min(1).max(500)}).strict().safeParse(await readMobileJSON(request));
    if(!body.success)throw new MobileError('invalid_request','Ongeldige QR-code.');
    return mobileResponse(await scanAdminRegistration(actor,parseAdminEventID(id),body.data.token));
}
export async function activityAdminMessage(request:Request,id:string) {
    const actor=await requireActivityAdmin(request);await limitAdminOperation(actor,'mail');
    return mobileResponse(await messageAdminRegistrations(actor,parseAdminEventID(id),await readMobileJSON(request,128*1024)));
}
export async function activityAdminMembers(request:Request) {
    const actor=await requireActivityAdmin(request);
    return mobileResponse(await searchAdminMembers(actor,new URL(request.url).searchParams.get('query')||''));
}
