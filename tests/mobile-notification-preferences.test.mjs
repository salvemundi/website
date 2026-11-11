import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { SourceTextModule,SyntheticModule,createContext } from 'node:vm';
const require=createRequire(new URL('../apps/frontend/package.json',import.meta.url));
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
 const code=ts.transpileModule(readFileSync(new URL('../apps/frontend/src/server/mobile/notifications.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
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
