import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SourceTextModule, SyntheticModule, createContext } from 'node:vm';
import * as crypto from 'node:crypto';

const source = resolve(dirname(fileURLToPath(import.meta.url)), '../apps/frontend/src');
const require = createRequire(resolve(source, '../package.json'));
const ts = require('typescript');
const { z } = require('zod');
const { activityAdminSchema } = await import(pathToFileURL(require.resolve('@salvemundi/validations/schema/activity.zod')));
const userID='11111111-1111-4111-8111-111111111111';
const memberID='22222222-2222-4222-8222-222222222222';
const native=`smi_${'A'.repeat(43)}`;

async function harness() {
 const db=new DatabaseSync(':memory:');
 db.function('NOW',()=>new Date().toISOString());
 db.function('minutes_ago',minutes=>new Date(Date.now()-minutes*60000).toISOString());
 db.function('hashtext',_value=>1);db.function('pg_advisory_xact_lock',_value=>1);
 db.exec(`PRAGMA foreign_keys=ON;
 CREATE TABLE committees(id INTEGER PRIMARY KEY,name TEXT,email TEXT);
 CREATE TABLE directus_users(id TEXT PRIMARY KEY,first_name TEXT,last_name TEXT,email TEXT,membership_status TEXT);
 CREATE TABLE events(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT,description TEXT,short_description TEXT,description_logged_in TEXT,event_date TEXT,event_time TEXT,event_date_end TEXT,event_time_end TEXT,location TEXT,max_sign_ups INTEGER,price_members TEXT,price_non_members TEXT,only_members INTEGER DEFAULT 0,committee_id INTEGER,contact TEXT,registration_deadline TEXT,custom_url TEXT,status TEXT,publish_date TEXT,image TEXT,updated_at TEXT);
 CREATE TABLE event_signups(id INTEGER PRIMARY KEY AUTOINCREMENT,event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,participant_name TEXT,participant_email TEXT,participant_phone TEXT,payment_status TEXT,directus_relations TEXT,is_member INTEGER DEFAULT 0,qr_token TEXT,checked_in INTEGER DEFAULT 0,checked_in_at TEXT,created_at TEXT DEFAULT '2040-01-01T10:00:00Z');
 CREATE TABLE transactions(id INTEGER PRIMARY KEY,registration INTEGER REFERENCES event_signups(id) ON DELETE SET NULL,amount TEXT,payment_status TEXT,created_at TEXT);
 INSERT INTO committees VALUES(1,'Feest','feest@example.invalid'),(2,'Studie','study@example.invalid');
 INSERT INTO events(id,name,description,event_date,event_time,price_members,price_non_members,committee_id,status) VALUES(1,'Own event','Description','2040-01-10','18:00','5.00','7.50',1,'published'),(2,'Foreign private event','Private','2040-01-11','18:00','4.00','6.00',2,'draft');
 INSERT INTO event_signups(id,event_id,participant_name,participant_email,payment_status,qr_token,is_member) VALUES(10,1,'Own participant','own@example.invalid','paid','own-qr',1),(11,1,'Pending participant','pending@example.invalid','open','pending-qr',0),(20,2,'Private participant','private@example.invalid','paid','foreign-qr',1);
 INSERT INTO transactions VALUES(1,10,'5.00','paid','2040-01-01'),(2,11,'7.50','open','2040-01-01');`);
 db.prepare('INSERT INTO directus_users VALUES(?,?,?,?,?)').run(memberID,'Canonical','Member','canonical@example.invalid','active');
 const state={committees:[],reads:0,mail:[],audit:[],failWrite:false,reassignBeforeRoster:false};
 const user={id:userID,name:'Admin fixture',email:'admin@example.invalid',sessionId:'mobile:fixture'};
 const modules=new Map();
 const context=createContext({Request,Response,Headers,URL,Buffer,File,FormData,Blob,console,Date,process:{env:{ENV_NAME:'acc',MOBILE_API_ENABLED:'true',MAIL_SERVICE_URL:'https://mail.example.invalid',INTERNAL_SERVICE_TOKEN:'synthetic-test-only'}}});
 const pool={async query(sql,values=[]) {
  if(state.reassignBeforeRoster && sql.includes('FROM event_signups es JOIN events e')){state.reassignBeforeRoster=false;db.exec('UPDATE events SET committee_id=2 WHERE id=1');}
  if(state.failWrite && /^(UPDATE|INSERT|DELETE)/.test(sql.trim())){state.failWrite=false;throw new Error('injected write failure');}
  let statement=sql.replace(/::(?:integer|int|text|boolean)(?:\[\])?/g,'').replace(/\s+FOR UPDATE\b/g,'').replace(/\bILIKE\b/g,'LIKE');
  statement=statement.replace(/=ANY\((\$\d+)\)/g,' IN (SELECT value FROM json_each($1))').replace(/NOW\(\)\s*-\s*INTERVAL '([0-9]+) minutes'/gi,'minutes_ago($1)');
  if(['BEGIN','COMMIT','ROLLBACK'].includes(statement.trim())){db.exec(statement);return {rows:[],rowCount:0};}
  const params={};for(let i=0;i<values.length;i++)params[`$${i+1}`]=Array.isArray(values[i])?JSON.stringify(values[i]):typeof values[i]==='boolean'?Number(values[i]):values[i];
  const query=db.prepare(statement);query.setAllowUnknownNamedParameters(true);
  if(/^\s*SELECT/.test(statement)||/\bRETURNING\b/.test(statement)) {
   const rows=query.all(params).map(row=>{const out={...row};for(const key of ['only_members','checked_in','is_member'])if(key in out && out[key]!==null)out[key]=Boolean(out[key]);return out;});
   return {rows,rowCount:rows.length};
  }
  const result=query.run(params);return {rows:[],rowCount:Number(result.changes)};
 },async connect(){return {...pool,release(){}};}};
 const synthetic=(id,exports)=>modules.set(id,new SyntheticModule(Object.keys(exports),function(){for(const[k,v]of Object.entries(exports))this.setExport(k,v);},{context,identifier:id}));
 synthetic('server-only',{});synthetic('node:crypto',crypto);synthetic('zod',{z});synthetic('@salvemundi/validations',{activityAdminSchema});
 synthetic('next/cache',{revalidateTag(){},revalidatePath(){}});
 synthetic(resolve(source,'lib/database/db.ts'),{pool});
 synthetic(resolve(source,'server/utils/logger.ts'),{safeConsoleError(){}});
 synthetic(resolve(source,'server/auth/redis-client.ts'),{getRedis:async()=>({eval:async()=>1})});
 synthetic(resolve(source,'server/queries/audit/audit.queries.ts'),{insertSystemLogInternal:async entry=>state.audit.push(entry)});
 synthetic(resolve(source,'server/utils/media.ts'),{uploadToDirectus:async file=>file.size>10*1024*1024?{success:false,error:'too large'}:{success:true,id:'fixture-image-id'}});
 synthetic(resolve(source,'server/internal/activiteiten/activiteiten.utils.ts'),{getInternalHeaders:()=>({'Content-Type':'application/json'}),fetchWithTimeout:async(url,options)=>{state.mail.push({url,body:JSON.parse(options.body)});return new Response('{}',{status:200});}});
 synthetic(resolve(source,'server/internal/leden/leden-db.utils.ts'),{fetchUserCommitteesDb:async()=>{state.reads++;return state.committees;}});
 function load(id){
  if(modules.has(id))return modules.get(id);
  const code=ts.transpileModule(readFileSync(id,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
  const mod=new SourceTextModule(code,{context,identifier:id});modules.set(id,mod);
  return mod;
 }
 const link=(specifier,referencing)=>load(specifier.startsWith('@/')?resolve(source,specifier.slice(2))+'.ts':specifier.startsWith('.')?resolve(dirname(referencing.identifier),specifier.replace(/\.js$/,''))+'.ts':specifier);
 const http=load(resolve(source,'server/mobile/http.ts'));await http.link(link);await http.evaluate();
 synthetic(resolve(source,'server/mobile/session.ts'),{requireMobileUser:async request=>{if(request.headers.get('authorization')!==`Bearer ${native}`)throw new http.namespace.MobileError('unauthorized','No session',401);return user;}});
 const api=load(resolve(source,'server/mobile/activity-admin-api.ts'));await api.link(link);await api.evaluate();
 const auth=load(resolve(source,'server/mobile/activity-admin-auth.ts'));await auth.evaluate();
 const operations=load(resolve(source,'server/mobile/activity-admin-operations.ts'));await operations.evaluate();
 const permissions=load(resolve(source,'shared/lib/permissions-config.ts'));await permissions.evaluate();
 const committee=(id,key,leader=false)=>({id,name:key,azure_group_id:permissions.namespace.COMMITTEES[key],is_leader:leader});
 state.committees=[committee(1,'FEEST',true)];
 const call=async(name,args=[],body,method='GET',token=native)=>{
  const headers={Authorization:`Bearer ${token}`};if(body!==undefined)headers['Content-Type']='application/json';
  const request=new Request('https://acc.salvemundi.nl/api/mobile/v1/admin/activities',{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
  return http.namespace.mobileRoute(r=>api.namespace[name](r,...args))(request);
 };
 const form=(overrides={})=>({title:'New test event',description:'Valid description',startsOn:'2040-01-12',startTime:'18:00',memberPriceCents:250,guestPriceCents:500,membersOnly:false,committeeID:1,status:'draft',...overrides});
 return {db,state,call,committee,form,auth:auth.namespace,operations:operations.namespace,user,actor:()=>auth.namespace.activityAdminForUser(user)};
}

test('fresh website role matrix filters private activities and read-only versus edit capabilities',async()=>{
 const h=await harness();
 for(const [key,leader,expected,canCreate]of [['MEDIA',false,0,false],['FEEST',false,1,false],['FEEST',true,1,true],['BESTUUR',false,2,true],['KANDI',false,2,false],['ICT',false,2,true]]){
  h.state.committees=[h.committee(1,key,leader)];const response=await h.call('activityAdminList');assert.equal(response.status,expected?200:403,key);
  if(expected){const {data}=await response.json();assert.equal(data.activities.length,expected);assert.equal(data.canCreate,canCreate);assert.equal(data.activities[0].canEdit,canCreate);}
 }
 h.state.committees=[];assert.equal((await h.call('activityAdminList')).status,403);assert.ok(h.state.reads>=7);
});
test('foreign event and nested participant IDs cannot read, edit, check in, delete or scan',async()=>{
 const h=await harness();
 for(const [name,args,body,method]of [
  ['activityAdminRead',['event:2'],undefined,'GET'],['activityAdminRegistrations',['event:2'],undefined,'GET'],
  ['activityAdminUpdate',['event:2'],h.form(),'PATCH'],['activityAdminDelete',['event:2'],undefined,'DELETE'],
  ['activityAdminRemoveRegistration',['event:1','20'],undefined,'DELETE'],['activityAdminCheckIn',['event:1','20'],{checkedIn:true},'PATCH'],
  ['activityAdminScan',['event:1'],{token:'foreign-qr'},'POST']]){
  const response=await h.call(name,args,body,method);assert.equal(response.status,404,name);assert.equal(JSON.stringify(await response.json()).includes('Private participant'),false);
 }
 assert.equal(h.db.prepare('SELECT COUNT(*) AS n FROM event_signups WHERE id=20').get().n,1);
});
test('ordinary committee members can view/check in paid participants but cannot mutate content, add or send',async()=>{
 const h=await harness();h.state.committees=[h.committee(1,'FEEST')];
 assert.equal((await h.call('activityAdminRegistrations',['event:1'])).status,200);
 assert.equal((await h.call('activityAdminCheckIn',['event:1','10'],{checkedIn:true},'PATCH')).status,200);
 for(const [name,args,body,method]of [['activityAdminCreate',[],h.form(),'POST'],['activityAdminUpdate',['event:1'],h.form(),'PATCH'],['activityAdminDelete',['event:1'],undefined,'DELETE'],['activityAdminAddRegistration',['event:1'],{type:'member',memberID},'POST'],['activityAdminMessage',['event:1'],{subject:'Test',message:'Hello',paidOnly:true},'POST']])assert.equal((await h.call(name,args,body,method)).status,403,name);
 assert.equal(h.state.mail.length,0);
});
test('scoped widget credentials cannot enter any native admin endpoint',async()=>{
 const h=await harness();const response=await h.call('activityAdminCreate',[],h.form(),'POST',`smw_${'A'.repeat(43)}`);assert.equal(response.status,401);assert.equal(h.db.prepare('SELECT COUNT(*) AS n FROM events').get().n,2);
});
test('event creation/edit validates destination, prices, dates and scheduled publication with rollback',async()=>{
 const h=await harness();
 assert.equal((await h.call('activityAdminCreate',[],h.form({committeeID:2}),'POST')).status,403);
 for(const values of [{memberPriceCents:-1},{startsOn:'2040-02-31'},{endsOn:'2039-01-01'},{status:'scheduled',publishAt:'2000-01-01T00:00:00Z'},{registrationDeadline:'2041-01-01T00:00:00Z'}])assert.equal((await h.call('activityAdminCreate',[],h.form(values),'POST')).status,400);
 const created=await h.call('activityAdminCreate',[],h.form({status:'scheduled',publishAt:'2039-01-01T00:00:00Z'}),'POST');assert.equal(created.status,201);
 const {data}=await created.json();assert.equal(data.summary.status,'scheduled');const id=data.summary.activity.id;
 assert.equal((await h.call('activityAdminCreate',[],h.form(),'POST')).status,409);
 h.state.failWrite=true;assert.equal((await h.call('activityAdminUpdate',[id],h.form({title:'Failed rename'}),'PATCH')).status,503);
 assert.equal(h.db.prepare('SELECT COUNT(*) AS n FROM events WHERE name=?').get('Failed rename').n,0);
 const updated=await h.call('activityAdminUpdate',[id],h.form({title:'Published rename',status:'published'}),'PATCH');assert.equal(updated.status,200);assert.equal((await updated.json()).data.form.publishAt,null);
 assert.ok(h.state.audit.every(entry=>entry.payload.admin_id===userID));
});
test('manual member fields are canonical, paid/no charge, duplicates blocked; scoped cancellation only',async()=>{
 const h=await harness();const tx=h.db.prepare('SELECT COUNT(*) AS n FROM transactions').get().n;
 const result=await h.call('activityAdminAddRegistration',['event:1'],{type:'member',memberID},'POST');assert.equal(result.status,201);const {data}=await result.json();assert.equal(data.name,'Canonical Member');assert.equal(data.email,'canonical@example.invalid');assert.equal(data.status,'paid');
 assert.equal(h.db.prepare('SELECT COUNT(*) AS n FROM transactions').get().n,tx);
 assert.equal((await h.call('activityAdminAddRegistration',['event:1'],{type:'member',memberID},'POST')).status,409);
 assert.equal((await h.call('activityAdminRemoveRegistration',['event:1',data.id],undefined,'DELETE')).status,200);
 assert.equal(h.state.mail.length,1);assert.equal(h.state.mail[0].body.to,'canonical@example.invalid');
});
test('paid check-in is idempotent; unpaid and foreign QR do not change attendance',async()=>{
 const h=await harness();assert.equal((await h.call('activityAdminScan',['event:1'],{token:'pending-qr'},'POST')).status,409);
 for(const expected of [false,true]){const response=await h.call('activityAdminScan',['event:1'],{token:'own-qr'},'POST');assert.equal(response.status,200);assert.equal((await response.json()).data.alreadyCheckedIn,expected);}
 assert.equal(h.db.prepare('SELECT checked_in FROM event_signups WHERE id=11').get().checked_in,0);
});
test('participant retrieval checks current event scope and only reports paid transaction amounts',async()=>{
 const h=await harness();const response=await h.call('activityAdminRegistrations',['event:1']);assert.equal(response.status,200);const {data}=await response.json();assert.equal(data.registrations.find(r=>r.id==='11').amountPaidCents,null);assert.equal(data.registrations.find(r=>r.id==='10').amountPaidCents,500);
 const actor=await h.actor();h.state.reassignBeforeRoster=true;assert.equal((await h.operations.listAdminRegistrations(actor,1)).length,0);
});
test('event messages resolve recipients server-side, deduplicate and never accept arbitrary addresses',async()=>{
 const h=await harness();h.db.exec("INSERT INTO event_signups(event_id,participant_name,participant_email,payment_status)VALUES(1,'Duplicate','OWN@example.invalid','paid')");
 const result=await h.call('activityAdminMessage',['event:1'],{subject:'Update',message:'Event update',paidOnly:true},'POST');assert.equal(result.status,200);assert.equal((await result.json()).data.recipientCount,1);assert.equal(h.state.mail[0].body.to[0].email.toLowerCase(),'own@example.invalid');
 const extra=await h.call('activityAdminMessage',['event:1'],{subject:'Update',message:'Event update',paidOnly:true,recipients:['private@example.invalid']},'POST');assert.equal(extra.status,400);assert.equal(h.state.mail.length,1);
 h.state.committees=[];assert.equal((await h.call('activityAdminMessage',['event:1'],{subject:'Update',message:'Event update',paidOnly:true},'POST')).status,403);assert.equal(h.state.mail.length,1);
});

test('permission scope version stays stable for identical rights and changes with committee scope',async()=>{
 const h=await harness();
 const access=async()=>((await (await h.call('activityAdminAccess')).json()).data);
 const first=await access();assert.equal(first.scopeVersion.length,64);
 assert.equal((await access()).scopeVersion,first.scopeVersion);
 h.state.committees=[h.committee(2,'STUDY',true)];
 const changed=await access();assert.equal(changed.canCreate,first.canCreate);assert.notEqual(changed.scopeVersion,first.scopeVersion);
});
