import test from 'node:test';
import assert from 'node:assert/strict';
import { activityChanges,activityDeliveryAllowed,activitySnapshot } from '../src/activity-policy.mjs';
import { organizerScope } from '../src/activity-scope.mjs';
import { deliver } from '../src/worker.mjs';
const own={allowed:true,global:false,ids:[1]};
const none={allowed:false,global:false,ids:[]};
const event={published:true,count:9,capacity:10,committee_id:1};
const prefs={activity_announcements:true,activity_committee_ids:[],organizer_almost_full:true,organizer_capacity_percent:90,organizer_signup_thresholds:[5,9,10]};
test('first expanded sync suppresses all historical announcements and thresholds',()=>{
 assert.deepEqual(activityChanges(undefined,event,false,prefs,own),[]);
 assert.deepEqual(activityChanges({...event,count:0},event,false,prefs,own),[]);
});
test('new publication follows all or selected committees; drafts never notify',()=>{
 for(const old of [undefined,{...event,published:false}]) {
  assert.deepEqual(activityChanges(old,event,true,prefs,none).map(c=>c.kind),['activityAnnouncements']);
  assert.equal(activityChanges(old,event,true,{...prefs,activity_committee_ids:[2]},own).length,0);
  assert.equal(activityChanges(old,event,true,{...prefs,activity_announcements:false},own).length,0);
 }
 assert.equal(activityChanges(undefined,{...event,published:false},true,prefs,own).length,0);
});
test('only newly crossed confirmed-count milestones notify, with independent controls',()=>{
 const changes=activityChanges({...event,count:4},event,true,prefs,own);
 assert.deepEqual(changes.map(c=>c.kind),['organizerAlmostFull','organizerSignups','organizerSignups']);
 assert.deepEqual(changes.filter(c=>c.kind==='organizerSignups').map(c=>c.threshold),[5,9]);
 assert.equal(activityChanges(event,{...event,count:8},true,prefs,own).length,0);
 assert.equal(activityChanges(event,event,true,prefs,own).length,0);
 assert.equal(activityChanges({...event,count:8},event,true,prefs,none).length,0);
 assert.equal(activityChanges({...event,count:8},event,true,prefs,{...own,ids:[2]}).length,0);
 assert.equal(activityChanges({...event,count:8},event,true,{...prefs,organizer_almost_full:false,organizer_signup_thresholds:[]},own).length,0);
});
test('capacity or preference edits alone do not fabricate crossed thresholds',()=>{
 assert.equal(activityChanges({...event,capacity:20},event,true,prefs,own).length,0);
 assert.equal(activityChanges({...event,capacity:20,count:8},event,true,{...prefs,organizer_signup_thresholds:[]},own).length,0);
 assert.equal(activityChanges({...event,count:8,capacity:null},{...event,capacity:null},true,{...prefs,organizer_signup_thresholds:[]},own).length,0);
});
test('delivery rechecks current subscription, publication, thresholds, counts and committee rights',()=>{
 assert.equal(activityDeliveryAllowed('activityAnnouncements',event,prefs,none,{}),true);
 assert.equal(activityDeliveryAllowed('activityAnnouncements',event,{...prefs,activity_committee_ids:[2]},own,{}),false);
 assert.equal(activityDeliveryAllowed('organizerAlmostFull',event,prefs,own,{percent:90}),true);
 assert.equal(activityDeliveryAllowed('organizerAlmostFull',event,{...prefs,organizer_capacity_percent:95},own,{percent:90}),false);
 assert.equal(activityDeliveryAllowed('organizerAlmostFull',{...event,count:8},prefs,own,{percent:90}),false);
 assert.equal(activityDeliveryAllowed('organizerSignups',event,prefs,own,{threshold:9}),true);
 for(const scope of [none,{...own,ids:[2]}])assert.equal(activityDeliveryAllowed('organizerSignups',event,prefs,scope,{threshold:9}),false);
 assert.equal(activityDeliveryAllowed('organizerSignups',{...event,published:false},prefs,own,{threshold:9}),false);
 assert.equal(activityDeliveryAllowed('organizerSignups',event,{...prefs,organizer_signup_thresholds:[]},own,{threshold:9}),false);
});
test('worker uses the actual website permissions registry for scope',()=>{
 assert.equal(organizerScope([{id:1,azure_group_id:'unrecognized'}]).allowed,false);
 assert.equal(organizerScope([{id:1,azure_group_id:'0ac8627d-07f8-43fd-a629-808572e95098'}]).allowed,true);
 assert.equal(organizerScope([{id:2,azure_group_id:'a4aeb401-882d-4e1e-90ee-106b7fdb23cc'}]).global,true);
});
test('scheduled publication is not public until its timestamp has passed',()=>{
 assert.equal(activitySnapshot({status:'published',publish_date:'2999-01-01',confirmed_count:9}).published,false);
 assert.equal(activitySnapshot({status:'draft',publish_date:null}).published,false);
});
test('real delivery path skips an outbox alert after committee rights are lost',async()=>{
 const user='00000000-0000-4000-8000-000000000001';let claimed=false,sent=false,skipped=false;
 const db={async query(sql,args){
  if(sql.includes('information_schema.columns'))return {rows:['expires_at','user_id'].map(column_name=>({column_name}))};
  if(sql.includes('RETURNING o.*')){if(claimed)return{rows:[]};claimed=true;return {rows:[{id:1,device_id:2,kind:'organizerSignups',dedupe_key:'activity:1:signups:9',payload:{activityID:'event:1'},metadata:{threshold:9},attempts:1}]};}
  if(sql.includes('SELECT d.*,u.status'))return {rows:[{id:2,user_id:user,environment:'acc',apns_environment:'sandbox',user_status:'active',organizer_signup_thresholds:[9]}]};
  if(sql.includes('SELECT e.id,e.committee_id'))return {rows:[{id:1,status:'published',committee_id:1,confirmed_count:9,max_sign_ups:10}]};
  if(sql.includes('SELECT c.id,c.azure_group_id'))return {rows:[]};
  if(sql.includes("status='skipped'"))skipped=true;
  return {rows:[],rowCount:0};
 }};
 await deliver(db,{ENV_NAME:'acc',MOBILE_NOTIFICATION_ALLOWED_USER_IDS:user},async()=>{sent=true;return {status:200};});
 assert.equal(sent,false);assert.equal(skipped,true);
});
