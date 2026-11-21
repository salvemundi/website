import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { SourceTextModule,SyntheticModule,createContext } from 'node:vm';
const require=createRequire(new URL('../../frontend/package.json',import.meta.url));
const ts=require('typescript');const {z}=require('zod');
class MobileError extends Error {constructor(code,message,status=400){super(message);this.code=code;this.status=status;}}
async function fixture(){
 const state={admin:true,stored:null,writes:[],committees:[{id:1,name:'Feest'},{id:2,name:'Studie'}]};
 const context=createContext({console});
 const exports={
  'server-only':{},'zod':{z},'./http':{MobileError},
  './activity-admin-auth':{activityAdminForUser:async()=>{if(!state.admin)throw new MobileError('forbidden','No access',403);return {global:false,committeeIDs:[1]};}},
  '@/lib/database/db':{pool:{async query(sql,args){
   if(sql.includes('SELECT id,name'))return {rows:state.committees};
   if(sql.includes('INSERT INTO mobile_notification_preferences')){state.writes.push(args);return {rows:[]};}
   return {rows:state.stored?[state.stored]:[]};
  }}}
 };
 const code=ts.transpileModule(readFileSync(new URL('../../frontend/src/server/mobile/notifications.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 const mod=new SourceTextModule(code,{context});
 await mod.link(specifier=>{const e=exports[specifier];assert.ok(e,`Unexpected real dependency ${specifier}`);return new SyntheticModule(Object.keys(e),function(){for(const[k,v]of Object.entries(e))this.setExport(k,v);},{context});});
 await mod.evaluate();return {state,api:mod.namespace};
}
const basic={registrations:true,payments:true,eventChanges:true,reminders:true};
const user={id:'fixture'};
test('extended API defaults do not subscribe people to publication or organizer alerts',async()=>{
 const {api}=await fixture();const p=await api.readNotificationPreferences('fixture');
 assert.equal(p.activityAnnouncements,false);assert.equal(p.organizerAlmostFull,false);assert.equal(p.organizerSignupThresholds.length,0);
});
test('actual schema limits percentages, positive unique thresholds, committee IDs and unknown fields',async()=>{
 const {api}=await fixture();const schema=api.notificationPreferencesSchema;
 for(const extra of [{organizerCapacityPercent:49},{organizerCapacityPercent:101},{organizerSignupThresholds:[0]},{organizerSignupThresholds:[10001]},{activityCommitteeIDs:[-1]},{arbitraryRecipient:'other-user'},{organizerSignupThresholds:Array(11).fill(1)}])assert.equal(schema.safeParse({...basic,...extra}).success,false);
 const parsed=schema.parse({...basic,activityCommitteeIDs:[2,1,2],organizerSignupThresholds:[25,10,25]});
 assert.equal(JSON.stringify(parsed.activityCommitteeIDs),'[1,2]');assert.equal(JSON.stringify(parsed.organizerSignupThresholds),'[10,25]');
});
test('existing clients preserve extended preferences instead of silently erasing subscriptions',async()=>{
 const {api,state}=await fixture();state.stored={...api.defaultNotificationPreferences,activityAnnouncements:true,activityCommitteeIDs:[2],organizerSignupThresholds:[25]};
 const result=await api.saveNotificationPreferences(user,basic);
 assert.equal(result.activityAnnouncements,true);assert.equal(JSON.stringify(result.organizerSignupThresholds),'[25]');assert.equal(state.writes.length,1);
});
test('ordinary users can subscribe to any existing committee but cannot enable organizer alerts',async()=>{
 const {api,state}=await fixture();state.admin=false;
 const options=await api.notificationOptions(user);assert.equal(options.committees.length,2);assert.equal(options.organizerCommittees.length,0);assert.equal(options.canReceiveOrganizerAlerts,false);
 await api.saveNotificationPreferences(user,{...basic,activityAnnouncements:true,activityCommitteeIDs:[2]});
 for(const extra of [{organizerAlmostFull:true},{organizerSignupThresholds:[25]}])await assert.rejects(api.saveNotificationPreferences(user,{...basic,...extra}),e=>e.status===403);
 await api.saveNotificationPreferences(user,{...basic,organizerAlmostFull:false,organizerSignupThresholds:[]});
 assert.equal(state.writes.length,2);
});
test('foreign committee selection is rejected while organizer options expose only owned scope',async()=>{
 const {api,state}=await fixture();const options=await api.notificationOptions(user);
 assert.equal(JSON.stringify(options.organizerCommittees.map(c=>c.id)),'[1]');
 await assert.rejects(api.saveNotificationPreferences(user,{...basic,activityCommitteeIDs:[999]}),e=>e.status===400);
 assert.equal(state.writes.length,0);
 await api.saveNotificationPreferences(user,{...basic,organizerAlmostFull:true,organizerSignupThresholds:[25]});assert.equal(state.writes.length,1);
});

// Device registration (APNs + FCM). Runs the real route and policy sources against a recording pool.
const fcmToken='dGVzdC1pbnN0YW5jZQ:APA91bH'+'Ab9_-'.repeat(28);
async function deviceFixture(env={}){
 const state={queries:[]};
 const context=createContext({console,URL,Response,Request,process:{env:{ENV_NAME:'acc',MOBILE_API_ENABLED:'true',...env}}});
 const transpile=path=>ts.transpileModule(readFileSync(new URL(`../../frontend/src/${path}`,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 const policy=new SourceTextModule(transpile('server/mobile/policy.ts'),{context});await policy.link(()=>{throw new Error('policy has no imports');});await policy.evaluate();
 const client={async query(sql,args){state.queries.push({sql,args});return {rows:[],rowCount:0};},release(){}};
 const exports={
  'zod':{z},'@/server/mobile/session':{requireMobileUser:async()=>({id:'user-1',sessionId:'mobile:session-1'})},
  '@/lib/database/db':{pool:{async connect(){return client;},query:client.query}},
  '@/server/mobile/http':{
   mobileRoute:handler=>async request=>handler(request),
   mobileError:(code,message,status=400)=>Response.json({error:{code,message}},{status}),
   mobileResponse:(data,status=200)=>Response.json({data},{status}),
   readMobileJSON:request=>request.json()
  }
 };
 const load=async path=>{const mod=new SourceTextModule(transpile(path),{context});
  await mod.link(specifier=>{if(specifier==='@/server/mobile/policy')return policy;const e=exports[specifier];assert.ok(e,`Unexpected real dependency ${specifier}`);return new SyntheticModule(Object.keys(e),function(){for(const[k,v]of Object.entries(e))this.setExport(k,v);},{context});});
  await mod.evaluate();return mod.namespace;};
 return {state,register:await load('app/api/mobile/v1/devices/route.ts'),unregister:await load('app/api/mobile/v1/devices/[token]/route.ts')};
}
const post=(api,body)=>api.POST(new Request('https://acc.salvemundi.nl/api/mobile/v1/devices',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));
const inserts=state=>state.queries.filter(q=>q.sql.includes('INSERT INTO mobile_devices'));
test('iOS clients without a platform field keep the original hex APNs registration',async()=>{
 const {register,state}=await deviceFixture();const token='AB'.repeat(32);
 const response=await post(register,{token,environment:'sandbox'});assert.equal(response.status,200);
 const [insert]=inserts(state);assert.equal(insert.sql.includes('platform'),false);assert.equal(insert.args[2],token.toLowerCase());
 assert.equal((await post(register,{token,environment:'sandbox',platform:'ios'})).status,200);
 for(const body of [{token:fcmToken,environment:'sandbox'},{token:fcmToken,environment:'sandbox',platform:'ios'},{token,environment:'sandbox',platform:'windows'},{token,environment:'sandbox',extra:true}]){
  const rejected=await post(register,body);assert.equal(rejected.status,400);assert.equal((await rejected.json()).error.code,'INVALID_DEVICE');
 }
});
test('Android FCM tokens register verbatim with platform android and share the production gate',async()=>{
 const {register,state}=await deviceFixture();
 const response=await post(register,{token:fcmToken,environment:'sandbox',platform:'android'});assert.equal(response.status,200);
 assert.equal(JSON.stringify(await response.json()),JSON.stringify({data:{success:true,registered:true}}));
 const [insert]=inserts(state);assert.match(insert.sql,/platform\)\s+VALUES\('acc',\$1,\$2,\$3,\$4,'android'\)/);assert.equal(insert.args[2],fcmToken);
 for(const token of ['AB'.repeat(32),'short:token','x'.repeat(99),fcmToken+'/','a'.repeat(1025),fcmToken.replace('_',' ')]){
  const rejected=await post(register,{token,environment:'sandbox',platform:'android'});assert.equal(rejected.status,400,token.slice(0,20));
 }
 const gated=await post(register,{token:fcmToken,environment:'production',platform:'android'});assert.equal(gated.status,409);assert.equal((await gated.json()).error.code,'APNS_ENVIRONMENT_DISABLED');
 const allowed=await deviceFixture({MOBILE_APNS_ALLOW_PRODUCTION:'true'});assert.equal((await post(allowed.register,{token:fcmToken,environment:'production',platform:'android'})).status,200);
});
test('device removal accepts APNs and (percent-encoded) FCM tokens for the current session only',async()=>{
 const {unregister,state}=await deviceFixture();
 const remove=token=>unregister.DELETE(new Request(`https://acc.salvemundi.nl/api/mobile/v1/devices/${token}`,{method:'DELETE'}));
 assert.equal((await remove('AB'.repeat(32))).status,200);
 assert.equal(JSON.stringify(state.queries.at(-1).args),JSON.stringify(['user-1','mobile:session-1',['ab'.repeat(32)]]));
 assert.equal((await remove(encodeURIComponent(fcmToken))).status,200);assert.equal(JSON.stringify(state.queries.at(-1).args[2]),JSON.stringify([fcmToken]));
 assert.equal((await remove(fcmToken)).status,200);assert.equal(JSON.stringify(state.queries.at(-1).args[2]),JSON.stringify([fcmToken]));
 const before=state.queries.length;
 for(const token of ['not-a-token','%E0%A4%A','x'.repeat(99)])assert.equal((await remove(token)).status,400);
 assert.equal(state.queries.length,before);
});
