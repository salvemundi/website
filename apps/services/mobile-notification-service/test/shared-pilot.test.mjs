import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { sharedPilotAllowed,deliveryEnabled,deviceAllowed,scopedUserIds } from '../src/policy.mjs';
import { reconcile,deliver,removeExpiredDevices,removeOldOutbox } from '../src/worker.mjs';
const user='00000000-0000-4000-8000-000000000001';
const other='00000000-0000-4000-8000-000000000002';
const env={ENV_NAME:'acc',MOBILE_API_ENABLED:'true',MOBILE_NOTIFICATIONS_ENABLED:'true',MOBILE_NOTIFICATION_ALLOWED_USER_IDS:user,MOBILE_APNS_ALLOW_PRODUCTION:'false',DB_NAME:'shared',PRODUCTION_DB_NAME:'shared',MOBILE_NOTIFICATION_SHARED_DB_PILOT:'true',MOBILE_NOTIFICATION_SHARED_DB_EXPECTED_NAME:'shared',MOBILE_NOTIFICATION_SHARED_DB_USER_ID:user};
test('independent shared pilot gate rejects widened users, APNs mode, environment and persisted destination drift',()=>{
 assert.equal(sharedPilotAllowed(env),true);
 for(const patch of [{ENV_NAME:'prod'},{MOBILE_API_ENABLED:'false'},{MOBILE_NOTIFICATIONS_ENABLED:'false'},{MOBILE_NOTIFICATION_ALLOWED_USER_IDS:`${user},${other}`},{MOBILE_NOTIFICATION_ALLOWED_USER_IDS:'*'},{MOBILE_NOTIFICATION_SHARED_DB_USER_ID:other},{MOBILE_APNS_ALLOW_PRODUCTION:'true'},{DB_NAME:'other'},{PRODUCTION_DB_NAME:'other'},{MOBILE_NOTIFICATION_SHARED_DB_EXPECTED_NAME:'other'}]){
  const invalid={...env,...patch};assert.equal(sharedPilotAllowed(invalid),false);assert.equal(deliveryEnabled(invalid),false);assert.deepEqual(scopedUserIds(invalid),[]);assert.equal(deviceAllowed({user_id:user,environment:'acc',apns_environment:'sandbox'},invalid),false);
 }
});
test('invalid shared pilot refuses reconciliation, delivery and cleanup before any query or APNs request',async()=>{
 const client={query(){throw Error('Must not query');}};
 const invalid={...env,MOBILE_NOTIFICATION_SHARED_DB_USER_ID:other};
 await reconcile(client,invalid);await deliver(client,invalid,()=>{throw Error('Must not send');});await removeExpiredDevices(client,invalid);await removeOldOutbox(client,invalid);
});
function fixture(){
 const db=new DatabaseSync(':memory:');const queries=[];
 db.exec(`CREATE TABLE auth_sessions(id TEXT PRIMARY KEY,expires_at TEXT,user_id TEXT);
 CREATE TABLE directus_users(id TEXT PRIMARY KEY,status TEXT);
 CREATE TABLE mobile_devices(id INTEGER PRIMARY KEY,environment TEXT,user_id TEXT,session_id TEXT,apns_environment TEXT,token TEXT);
 CREATE TABLE mobile_notification_preferences(environment TEXT,user_id TEXT,registrations INTEGER,payments INTEGER,event_changes INTEGER,reminders INTEGER,activity_announcements INTEGER,activity_committee_ids TEXT,organizer_almost_full INTEGER,organizer_capacity_percent INTEGER,organizer_signup_thresholds TEXT);
 CREATE TABLE mobile_notification_outbox(id INTEGER PRIMARY KEY,environment TEXT,device_id INTEGER,kind TEXT,dedupe_key TEXT,payload TEXT,metadata TEXT,status TEXT,attempts INTEGER,next_attempt_at TEXT,locked_at TEXT,sent_at TEXT,last_error_code TEXT,created_at TEXT);
 CREATE TABLE mobile_notification_users(environment TEXT,user_id TEXT,UNIQUE(environment,user_id));
 CREATE TABLE mobile_notification_activity_users(environment TEXT,user_id TEXT,UNIQUE(environment,user_id));
 CREATE TABLE mobile_notification_observations(environment TEXT,user_id TEXT,registration_id INTEGER,snapshot TEXT,observed_at TEXT,UNIQUE(environment,user_id,registration_id));
 CREATE TABLE mobile_notification_activity_observations(environment TEXT,user_id TEXT,event_id INTEGER,snapshot TEXT,observed_at TEXT,UNIQUE(environment,user_id,event_id));
 CREATE TABLE committees(id INTEGER,azure_group_id TEXT);CREATE TABLE committee_members(committee_id INTEGER,user_id TEXT);
 CREATE TABLE events(id INTEGER,event_date TEXT,name TEXT);INSERT INTO events VALUES(1,'2999-01-01','Business sentinel');
 CREATE TABLE event_signups(id INTEGER,event_id INTEGER,payment_status TEXT);INSERT INTO event_signups VALUES(1,1,'paid');`);
 for(const id of [user,other]){db.prepare('INSERT INTO directus_users VALUES(?,?)').run(id,'active');db.prepare('INSERT INTO auth_sessions VALUES(?,?,?)').run(id,'2999-01-01',id);}
 const insertDevice=db.prepare('INSERT INTO mobile_devices VALUES(?,?,?,?,?,?)');
 for(const [id,who,apns,session,environment] of [[1,user,'sandbox',user,'acc'],[2,other,'sandbox',other,'acc'],[3,user,'production',user,'acc'],[4,user,'sandbox','missing','acc'],[5,other,'sandbox','missing','acc'],[6,user,'production','missing','acc'],[7,user,'sandbox','missing','prod']])insertDevice.run(id,environment,who,session,apns,'a'.repeat(64));
 const insertJob=db.prepare('INSERT INTO mobile_notification_outbox VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
 for(const device of [1,2,3])for(const [status,offset] of [['processing',0],['sent',10],['pending',20]])insertJob.run(device+offset,'acc',device,'payments','fixture:'+device+offset,'{}','{}',status,0,'2000-01-01','2000-01-01',null,null,'2000-01-01');
 const client={async query(sql,args=[]){
  queries.push({sql,args});
  if(sql.includes('information_schema.columns'))return {rows:['expires_at','user_id'].map(column_name=>({column_name}))};
  if(sql.includes('SELECT s.id,s.event_id'))return {rows:[{id:1,event_id:1,payment_status:'paid',name:'Business sentinel',event_status:'published',starts_at:'2999-01-01'}]};
  if(sql.includes('SELECT e.id,e.committee_id'))return {rows:[]};
  if(sql.includes('pg_advisory_xact_lock'))return {rows:[]};
  let statement=sql.replace(/now\(\)\+\((\$[0-9]+)::int\*interval '1 second'\)/g, "datetime('now','+' || $1 || ' seconds')").replace(/now\(\)-interval '([0-9]+) (minutes|days)'/g,(_,n,unit)=>`datetime('now','-${n} ${unit}')`).replace(/now\(\)/g,"datetime('now')")
   .replace(/=\s*ANY\((\$[0-9]+)::uuid\[\]\)/g,' IN (SELECT value FROM json_each($1))').replace(/::(?:uuid\[\]|boolean|int|jsonb)/g,'')
   .replace(/CURRENT_DATE-interval '([0-9]+) days'/g, (_,n)=>`date('now','-${n} days')`).replace('DELETE FROM mobile_notification_activity_observations o WHERE','DELETE FROM mobile_notification_activity_observations AS o WHERE')
   .replace('UPDATE mobile_notification_outbox o SET','UPDATE mobile_notification_outbox AS o SET').replace('DELETE FROM mobile_devices d WHERE','DELETE FROM mobile_devices AS d WHERE')
   .replace(' FOR UPDATE SKIP LOCKED','').replace('RETURNING o.*','RETURNING *').replace(/\$(\d+)/g,'?$1');
  const bindings=args.map(value=>Array.isArray(value)?JSON.stringify(value):typeof value==='boolean'?Number(value):value);
  if(['BEGIN','COMMIT','ROLLBACK'].includes(statement)){db.exec(statement);return{rows:[],rowCount:0};}
  const query=db.prepare(statement);
  if(/^\s*SELECT/.test(statement)||statement.includes('RETURNING')){const rows=query.all(...bindings).map(row=>({...row,payload:row.payload?JSON.parse(row.payload):undefined}));return{rows,rowCount:rows.length};}
  return{rows:[],rowCount:query.run(...bindings).changes};
 }};
 return{db,client,queries};
}
test('actual claim, reclaim, completion, reconciliation and cleanup SQL mutates only allowlisted sandbox mobile rows',async()=>{
 const f=fixture();const beforeEvents=f.db.prepare('SELECT * FROM events').all();const beforeSignups=f.db.prepare('SELECT * FROM event_signups').all();
 try{
  await reconcile(f.client,env);
  assert.deepEqual(f.db.prepare('SELECT user_id FROM mobile_notification_users').all().map(r=>r.user_id),[user]);
  await deliver(f.client,env,async device=>{assert.equal(device.user_id,user);assert.equal(device.apns_environment,'sandbox');return{status:200};});
  await removeOldOutbox(f.client,env);await removeExpiredDevices(f.client,env);
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM mobile_devices WHERE id=4').get().n,0);
  for(const id of [2,3,5,6,7])assert.equal(f.db.prepare('SELECT count(*) AS n FROM mobile_devices WHERE id=?').get(id).n,1);
  for(const id of [2,3])for(const offset of [0,10,20]){
   const row=f.db.prepare('SELECT status FROM mobile_notification_outbox WHERE id=?').get(id+offset);assert.ok(row);assert.equal(row.status,offset===0?'processing':offset===10?'sent':'pending');
  }
  assert.deepEqual(f.db.prepare('SELECT * FROM events').all(),beforeEvents);assert.deepEqual(f.db.prepare('SELECT * FROM event_signups').all(),beforeSignups);
  const mutations=f.queries.filter(({sql})=>/^\s*(INSERT|UPDATE|DELETE)/.test(sql));assert(mutations.length>5);
  for(const {sql}of mutations){assert.match(sql,/^\s*(?:INSERT INTO|UPDATE|DELETE FROM) mobile_/);assert.match(sql,/'acc'/);}
 }finally{f.db.close();}
});
