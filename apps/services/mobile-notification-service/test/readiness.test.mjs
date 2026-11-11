import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { configurationChecks, databaseChecks, requiredTables, requiredPreferenceColumns, requiredOutboxKinds } from '../src/readiness.mjs';
const privateKey = generateKeyPairSync('ec', { namedCurve: 'prime256v1' }).privateKey.export({ type: 'pkcs8', format: 'pem' });
const good = { ENV_NAME:'acc', MOBILE_API_ENABLED:'true', MOBILE_NOTIFICATIONS_ENABLED:'true', MOBILE_NOTIFICATION_ALLOWED_USER_IDS:'00000000-0000-0000-0000-000000000001', APNS_KEY_ID:'ABCDEFGHIJ', APNS_TEAM_ID:'ABCDEFGHIJ', APNS_TOPIC:'nl.salvemundi.ios', APNS_PRIVATE_KEY:privateKey, MOBILE_APNS_ALLOW_PRODUCTION:'false' };
test('configuration requires explicit gates, allowlist and compatible key without exposing values', () => {
    assert(configurationChecks(good).every(c => c.passed));
    for (const patch of [{ENV_NAME:'prod'}, {MOBILE_API_ENABLED:'false'}, {MOBILE_NOTIFICATIONS_ENABLED:'false'}, {MOBILE_NOTIFICATION_ALLOWED_USER_IDS:'*'}, {APNS_PRIVATE_KEY:'secret'}, {APNS_TOPIC:'other'}, {MOBILE_APNS_ALLOW_PRODUCTION:undefined}]) assert(configurationChecks({...good,...patch}).some(c => !c.passed));
    assert(!JSON.stringify(configurationChecks(good)).includes(privateKey));
});
test('database checks use a read-only transaction and reject shared or unconfirmed database', async () => {
    for (const [production,confirmed,expected] of [['production','true',true], ['acceptance','true',false], ['production',undefined,false]]) {
        const statements=[];
        const client={ query:async(sql,params)=> { statements.push(sql); if(sql.includes('current_database')) return {rows:[{name:'acceptance'}]}; if(sql.includes('information_schema.tables'))return {rows:requiredTables.map(table_name=>({table_name}))}; if(sql.includes('pg_constraint')) return {rows:[{convalidated:true,definition: `CHECK (kind IN (${requiredOutboxKinds.map(k=>`'${k}'`).join(',')}))`}]}; if(params?.[0]==='mobile_notification_outbox') return {rows:[{column_name:'metadata'}]}; if(params?.[0]==='mobile_notification_preferences') return {rows:requiredPreferenceColumns.map(column_name=>({column_name}))}; if(sql.includes('information_schema.columns')) return {rows:[{column_name:'expiresAt'},{column_name:'userId'}]}; return {rows:[]}; }};
        const checks=await databaseChecks(client,{PRODUCTION_DB_NAME:production,MOBILE_ACCEPTANCE_DB_ISOLATION_CONFIRMED:confirmed});
        assert.equal(checks[0].passed,expected); assert(checks.slice(1).every(c=>c.passed)); assert.equal(statements[0],'BEGIN READ ONLY'); assert.equal(statements.at(-1),'ROLLBACK');
        assert(statements.every(s=>s.startsWith('SELECT') || ['BEGIN READ ONLY','ROLLBACK'].includes(s)));
    }
});
test('unsupported session schema and unapplied preference upgrade are separate failures', async () => {
    const client={query:async(sql)=> {
        if(sql.includes('current_database'))return {rows:[{name:'acc'}]};
        if(sql.includes('information_schema.tables'))return {rows:requiredTables.map(table_name=>({table_name}))};
        return {rows:[]};
    }};
    const checks=await databaseChecks(client,{PRODUCTION_DB_NAME:'prod',MOBILE_ACCEPTANCE_DB_ISOLATION_CONFIRMED:'true'});
    assert(checks.filter(c=>c.name.startsWith('required preference column')).every(c=>!c.passed));
    assert.equal(checks.find(c=>c.name==='supported authentication session columns').passed,false);
});
test('query errors still roll back the read-only transaction', async()=>{
    const statements=[];
    const client={query:async(sql)=>{statements.push(sql);if(sql.startsWith('SELECT'))throw new Error('fixture');return {rows:[]};}};
    await assert.rejects(databaseChecks(client,{}));
    assert.deepEqual(statements,['BEGIN READ ONLY','SELECT current_database() AS name','ROLLBACK']);
});

test('original outbox schema cannot pass upgraded readiness', async () => {
    for (const upgraded of [false, true]) {
        const client={query:async(sql,params)=> {
            if(sql.includes('current_database'))return {rows:[{name:'acc'}]};
            if(sql.includes('information_schema.tables'))return {rows:requiredTables.map(table_name=>({table_name}))};
            if(sql.includes('pg_constraint'))return {rows:[{convalidated:true, definition:`CHECK (kind IN (${(upgraded ? requiredOutboxKinds : requiredOutboxKinds.slice(0,4)).map(k=>`'${k}'`).join(',')}))`}]};
            if(params?.[0]==='mobile_notification_preferences')return {rows:requiredPreferenceColumns.map(column_name=>({column_name}))};
            if(params?.[0]==='mobile_notification_outbox')return {rows:upgraded?[{column_name:'metadata'}]:[]};
            return {rows:[{column_name:'expiresAt'},{column_name:'userId'}]};
        }};
        const checks=await databaseChecks(client,{PRODUCTION_DB_NAME:'prod',MOBILE_ACCEPTANCE_DB_ISOLATION_CONFIRMED:'true'});
        assert.equal(checks.find(c=>c.name==='required outbox metadata column').passed,upgraded);
        assert.equal(checks.find(c=>c.name==='validated outbox kinds include activity notifications').passed,upgraded);
    }
});
test('shared pilot is explicit, one-account sandbox and bound to actual configured database', async () => {
    const user='00000000-0000-0000-0000-000000000001';
    const pilot={...good,DB_NAME:'shared',PRODUCTION_DB_NAME:'shared',MOBILE_NOTIFICATION_SHARED_DB_PILOT:'true',MOBILE_NOTIFICATION_SHARED_DB_EXPECTED_NAME:'shared',MOBILE_NOTIFICATION_SHARED_DB_USER_ID:user};
    const clientFor = (actual='shared') => ({query:async(sql,params)=>{
        if(sql.includes('current_database'))return {rows:[{name:actual}]};
        if(sql.includes('information_schema.tables'))return {rows:requiredTables.map(table_name=>({table_name}))};
        if(sql.includes('pg_constraint'))return {rows:[{convalidated:true,definition:`CHECK (kind IN (${requiredOutboxKinds.map(k=>`'${k}'`).join(',')}))`}]};
        if(params?.[0]==='mobile_notification_preferences')return {rows:requiredPreferenceColumns.map(column_name=>({column_name}))};
        if(params?.[0]==='mobile_notification_outbox')return {rows:[{column_name:'metadata'}]};
        return {rows:[{column_name:'expiresAt'},{column_name:'userId'}]};
    }});
    const accepted=await databaseChecks(clientFor(),pilot);
    assert(accepted.every(c=>c.passed));
    assert(accepted[0].name.includes('SHARED database (NOT isolated)'));
    assert(!accepted.some(c=>c.name==='acceptance database explicitly isolated from production'));
    for(const patch of [
        {MOBILE_NOTIFICATION_SHARED_DB_PILOT:undefined},
        {MOBILE_NOTIFICATION_SHARED_DB_USER_ID:'00000000-0000-0000-0000-000000000002'},
        {MOBILE_NOTIFICATION_ALLOWED_USER_IDS:user+',00000000-0000-0000-0000-000000000002'},
        {MOBILE_APNS_ALLOW_PRODUCTION:'true'}, {MOBILE_NOTIFICATION_SHARED_DB_EXPECTED_NAME:'other'},
        {DB_NAME:'other'}, {PRODUCTION_DB_NAME:'other'}, {ENV_NAME:'prod'},
        {MOBILE_ACCEPTANCE_DB_ISOLATION_CONFIRMED:'true'}, {MOBILE_API_ENABLED:'false'}, {MOBILE_NOTIFICATIONS_ENABLED:'false'}
    ]) assert.equal((await databaseChecks(clientFor(),{...pilot,...patch}))[0].passed,false);
    assert.equal((await databaseChecks(clientFor('wrong'),pilot))[0].passed,false);
});
