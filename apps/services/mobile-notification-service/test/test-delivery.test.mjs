import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { testDelivery, run } from '../src/test-delivery.mjs';
import { requiredTables, requiredPreferenceColumns, requiredOutboxKinds } from '../src/readiness.mjs';
const user='00000000-0000-4000-8000-000000000001';
const other='00000000-0000-4000-8000-000000000002';
const privateKey=generateKeyPairSync('ec',{namedCurve:'prime256v1'}).privateKey.export({type:'pkcs8',format:'pem'});
const good={ENV_NAME:'acc',MOBILE_API_ENABLED:'true',MOBILE_NOTIFICATIONS_ENABLED:'true',MOBILE_NOTIFICATION_ALLOWED_USER_IDS:user,APNS_KEY_ID:'ABCDEFGHIJ',APNS_TEAM_ID:'ABCDEFGHIJ',APNS_TOPIC:'nl.salvemundi.ios',APNS_PRIVATE_KEY:privateKey,MOBILE_APNS_ALLOW_PRODUCTION:'false',PRODUCTION_DB_NAME:'production',MOBILE_ACCEPTANCE_DB_ISOLATION_CONFIRMED:'true'};
function fixture(layout='camel',state='active'){
 const db=new DatabaseSync(':memory:');const statements=[];const expires=layout==='camel'?'expiresAt':'expires_at';const owner=layout==='camel'?'userId':'user_id';
 db.exec(`CREATE TABLE auth_sessions(id TEXT PRIMARY KEY,"${expires}" TEXT,"${owner}" TEXT);
 CREATE TABLE directus_users(id TEXT PRIMARY KEY,status TEXT);
 CREATE TABLE mobile_devices(id INTEGER PRIMARY KEY,environment TEXT,user_id TEXT,session_id TEXT,apns_environment TEXT,token TEXT,updated_at TEXT);`);
 db.prepare('INSERT INTO directus_users VALUES(?,?)').run(user,state==='suspended'?'suspended':'active');
 db.prepare('INSERT INTO mobile_devices VALUES(?,?,?,?,?,?,?)').run(1,'acc',user,'session1',state==='production-device'?'production':'sandbox','a'.repeat(64),'2030-01-01');
 if(state!=='revoked')db.prepare('INSERT INTO auth_sessions VALUES(?,?,?)').run('session1',state==='expired'?'2000-01-01':'2099-01-01',state==='foreign-owner'?other:user);
 const client={async query(sql,args=[]){
  statements.push(sql);
  if(sql.includes('current_database'))return {rows:[{name:state==='shared-database'?'production':'acceptance'}]};
  if(sql.includes('information_schema.tables'))return {rows:(state==='unmigrated'?[]:requiredTables).map(table_name=>({table_name}))};
  if(sql.includes('pg_constraint'))return {rows:[{convalidated:true,definition:`CHECK (kind IN (${requiredOutboxKinds.map(k=>`'${k}'`).join(',')}))`}]};
  if(args[0]==='mobile_notification_preferences')return {rows:requiredPreferenceColumns.map(column_name=>({column_name}))};
  if(args[0]==='mobile_notification_outbox')return {rows:[{column_name:'metadata'}]};
  if(sql.includes('information_schema.columns'))return {rows:[expires,owner].map(column_name=>({column_name}))};
  if(sql.includes('SELECT d.id,d.environment')) {
   const portable=sql.replace(/now\(\)/g,"datetime('now')").replace(/\$(\d+)/g,'?$1');
   return {rows:db.prepare(portable).all(...args)};
  }
  assert(['BEGIN READ ONLY','ROLLBACK'].includes(sql),`unexpected SQL ${sql}`);return {rows:[]};
 }};
 return {client,db,statements};
}
test('single-account sandbox pilot refuses gates, unsupported destination and invalid configuration without DB or APNs',async()=>{
 for(const patch of [{ENV_NAME:'prod'},{MOBILE_API_ENABLED:'false'},{MOBILE_NOTIFICATIONS_ENABLED:'false'},{MOBILE_NOTIFICATION_ALLOWED_USER_IDS:''},{MOBILE_NOTIFICATION_ALLOWED_USER_IDS:`${user},${other}`},{MOBILE_NOTIFICATION_ALLOWED_USER_IDS:`${user},${user}`},{MOBILE_NOTIFICATION_ALLOWED_USER_IDS:'*'},{MOBILE_APNS_ALLOW_PRODUCTION:'true'},{APNS_TOPIC:'other.app'},{APNS_PRIVATE_KEY:'not-a-key'}]){
  let queried=false,sent=false;const result=await testDelivery({query(){queried=true;throw Error('must not query');}},{...good,...patch},async()=>{sent=true;});
  assert.equal(result.status,'unavailable');assert.equal(queried,false);assert.equal(sent,false);
 }
});
for(const layout of ['camel','snake'])test(`${layout} real SQL validates live session ownership, expiry, status and sandbox before test send`,async()=>{
 for(const state of ['active','expired','revoked','foreign-owner','suspended','production-device','shared-database','unmigrated']){
  const f=fixture(layout,state);let sent=0;
  try{const result=await testDelivery(f.client,good,async(device,payload,collapseID)=>{
   sent++;assert.equal(device.user_id,user);assert.equal(device.apns_environment,'sandbox');assert.equal(payload.activityID,undefined);assert.equal(payload.aps.alert.title,'Salve Mundi');assert.match(payload.aps.alert.body,/testmelding/);assert.equal(collapseID,'salve-mundi-explicit-sandbox-test');return {status:200};
  });
  assert.equal(result.status,state==='active'?'delivered':'unavailable',state);assert.equal(sent,state==='active'?1:0,state);
  assert(f.statements.every(sql=>sql.trim().startsWith('SELECT')||['BEGIN READ ONLY','ROLLBACK'].includes(sql)));
  assert(!JSON.stringify(result).includes(user));assert(!JSON.stringify(result).includes('aaaa'));assert(!JSON.stringify(result).includes(privateKey));
  }finally{f.db.close();}
 }
});
test('explicit DB isolation must be confirmed; no push merely because a separate DB is configured',async()=>{
 const f=fixture();let sent=false;try{const result=await testDelivery(f.client,{...good,MOBILE_ACCEPTANCE_DB_ISOLATION_CONFIRMED:undefined},async()=>{sent=true;return{status:200};});assert.equal(result.status,'unavailable');assert.equal(sent,false);}finally{f.db.close();}
});
test('APNs refusals and network failures never claim delivery or mutate device records',async()=>{
 for(const result of [{status:400,reason:'BadDeviceToken'},{status:410},{status:503},null]){
  const f=fixture();try{
   const delivered=await testDelivery(f.client,good,async()=>{if(!result)throw Error('network-secret');return result;});
   assert.equal(delivered.status,result?'rejected':'unavailable');
   assert(f.statements.every(sql=>!/^\s*(INSERT|UPDATE|DELETE|ALTER|CREATE)/i.test(sql)));
  }finally{f.db.close();}
 }
});
test('CLI has no destination, payload or token override and never connects with arguments',async()=>{
 assert.deepEqual(await run(good,['--user',other]),{status:'unavailable'});
 assert.deepEqual(await run({...good,ENV_NAME:'prod'},[]),{status:'unavailable'});
});
