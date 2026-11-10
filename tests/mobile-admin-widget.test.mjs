import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import * as crypto from 'node:crypto';
import { SourceTextModule, SyntheticModule, createContext } from 'node:vm';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../apps/frontend/src');
const ts = createRequire(resolve(root, '../package.json'))('typescript');
const userID = '11111111-1111-4111-8111-111111111111';
const sessionID = 'mobile:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const nativeToken = `smi_${'A'.repeat(43)}`;

async function harness() {
    const state = { active: true, expiresAt: new Date(Date.now() + 30 * 86400_000).toISOString(), committees: [], events: [], committeeReads: 0 };
    const context = createContext({ Request, Response, Headers, URL, Buffer, console, process: { env: { ENV_NAME: 'acc', MOBILE_API_ENABLED: 'true' } } });
    const modules = new Map();
    const redisValues = new Map();
    const redisWrites = [];
    const user = { id: userID, sessionId: sessionID, name: 'Private Member', email: 'private@example.test', first_name: 'Private', last_name: 'Member', phone_number: null, membership_status: 'active', membership_expiry: null, entra_id: null };
    const pool = { async query(sql, values) {
        if (sql.includes('FROM auth_sessions s JOIN directus_users')) {
            const validParent = sql.includes('WHERE s.token=')
                ? values[0] === `mobile-sha256:${crypto.createHash('sha256').update(nativeToken).digest('hex')}`
                : values[0] === sessionID && values[1] === userID;
            return { rows: state.active && Date.parse(state.expiresAt) > Date.now() && validParent ? [{ ...user, parentExpiresAt: state.expiresAt }] : [] };
        }
        if (sql.includes('FROM events e LEFT JOIN committees')) {
            assert.match(sql, /WHERE \(\$1::boolean OR e\.committee_id=ANY\(\$2::integer\[\]\)\)/);
            return { rows: state.events.filter(event => values[0] || values[1].includes(event.committee_id)) };
        }
        throw new Error(`Unexpected query: ${sql}`);
    } };
    function synthetic(identifier, exports) {
        modules.set(identifier, new SyntheticModule(Object.keys(exports), function () {
            for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
        }, { context, identifier }));
    }
    synthetic('server-only', {});
    synthetic('node:crypto', crypto);
    synthetic(resolve(root, 'lib/database/db.ts'), { pool });
    synthetic(resolve(root, 'server/utils/logger.ts'), { safeConsoleError: () => {} });
    synthetic(resolve(root, 'server/auth/redis-client.ts'), { getRedis: async () => ({
        get: async key => redisValues.get(key) ?? null,
        set: async (key, value, mode, ttl) => { assert.equal(mode, 'EX'); redisValues.set(key, value); redisWrites.push({ key, value, ttl }); }
    }) });
    synthetic(resolve(root, 'server/mobile/session-columns.ts'), { getSessionColumns: async () => ({ userId: '"user_id"', expiresAt: '"expires_at"', createdAt: '"created_at"', updatedAt: '"updated_at"', userAgent: '"user_agent"' }) });
    synthetic(resolve(root, 'server/internal/leden/leden-db.utils.ts'), { fetchUserCommitteesDb: async id => {
        assert.equal(id, userID); state.committeeReads++; return state.committees;
    } });
    synthetic(resolve(root, 'lib/utils/date-utils.ts'), { amsterdamToUTC: value => value ? new Date(`${value}Z`).toISOString() : null });
    const sources = ['server/mobile/admin-widget', 'server/mobile/admin-widget-security', 'server/mobile/activity-admin-auth', 'server/mobile/activity-admin-data',
        'server/mobile/http', 'server/mobile/policy', 'server/mobile/session', 'server/mobile/security', 'shared/lib/permissions', 'shared/lib/permissions-config'];
    for (const path of sources) {
        const identifier = resolve(root, `${path}.ts`);
        const source = ts.transpileModule(readFileSync(identifier, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
        modules.set(identifier, new SourceTextModule(source, { context, identifier }));
    }
    const linker = (specifier, referencing) => {
        const identifier = specifier.startsWith('@/') ? resolve(root, `${specifier.slice(2)}.ts`)
            : specifier.startsWith('.') ? resolve(dirname(referencing.identifier), `${specifier}.ts`) : specifier;
        const dependency = modules.get(identifier);
        assert.ok(dependency, `Missing dependency ${identifier}`);
        return dependency;
    };
    const entry = modules.get(resolve(root, 'server/mobile/admin-widget.ts'));
    await entry.link(linker); await entry.evaluate();
    const http = modules.get(resolve(root, 'server/mobile/http.ts')).namespace;
    const permissions = modules.get(resolve(root, 'shared/lib/permissions-config.ts')).namespace;
    const native = modules.get(resolve(root, 'server/mobile/session.ts')).namespace;
    const admin = modules.get(resolve(root, 'server/mobile/activity-admin-auth.ts')).namespace;
    const security = modules.get(resolve(root, 'server/mobile/admin-widget-security.ts')).namespace;
    const committee = (id, role, leader = false) => ({ id, name: role, azure_group_id: permissions.COMMITTEES[role], is_leader: leader });
    state.committees = [committee(1, 'FEEST')];
    const event = (id, committee_id = 1) => ({ id, committee_id, name: `Event ${id}`, event_date: '2099-01-01', event_time: '12:00:00', event_date_end: null,
        event_time_end: null, status: 'draft', price_members: '0', price_non_members: '2.50', max_sign_ups: 30, confirmed_count: 4, pending_count: 2,
        checked_in_count: 1, description: 'PRIVATE DESCRIPTION', contact: 'private@example.test' });
    state.events = [event(1), event(2, 2)];
    const request = (token = nativeToken, method = 'GET') => new Request('https://acc.salvemundi.nl/api/mobile/v1/admin/widget-activities', {
        method, headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(method === 'POST' ? { body: '{}' } : {})
    });
    const issue = async (token = nativeToken) => http.mobileRoute(entry.namespace.createAdminWidgetSession)(request(token, 'POST'));
    const counts = async token => http.mobileRoute(entry.namespace.adminWidgetActivities)(request(token));
    return { state, redisValues, redisWrites, committee, event, issue, counts, request, native, admin, security };
}

test('widget grants are hashed in Redis, scoped-only and bounded by parent expiry', async () => {
    const h = await harness();
    const response = await h.issue();
    assert.equal(response.status, 200);
    const { data } = await response.json();
    assert.match(data.token, /^smw_[A-Za-z0-9_-]{43}$/);
    assert.ok(h.redisWrites[0].ttl <= 7 * 86400 && h.redisWrites[0].ttl > 0);
    assert.equal(h.redisWrites[0].key.includes(data.token), false);
    assert.equal(h.redisWrites[0].value.includes(nativeToken), false);
    await assert.rejects(h.native.requireMobileUser(h.request(data.token)), error => error.status === 401);
    await assert.rejects(h.admin.requireActivityAdmin(h.request(data.token)), error => error.status === 401);
    assert.equal((await h.issue(data.token)).status, 401);
    h.state.expiresAt = new Date(Date.now() + 60_000).toISOString();
    assert.equal((await h.issue()).status, 200);
    assert.ok(h.redisWrites.at(-1).ttl <= 60);
});

test('counts use the same live full permission matrix and project no participant information', async () => {
    const h = await harness();
    for (const [role, leader, expected] of [['ICT', false, 2], ['BESTUUR', false, 2], ['KANDI', false, 2], ['FEEST', true, 1], ['FEEST', false, 1], ['MEDIA', true, 0]]) {
        h.state.committees = [h.committee(1, role, leader)];
        const result = await h.counts(nativeToken);
        assert.equal(result.status, expected ? 200 : 403, role);
        if (!expected) continue;
        const { data } = await result.json();
        assert.equal(data.items.length, expected, role);
        assert.deepEqual(Object.keys(data.items[0]).sort(), ['capacity', 'checkedInCount', 'confirmedCount', 'id', 'pendingCount', 'startsAt', 'title'].sort());
        assert.equal(JSON.stringify(data).includes('PRIVATE DESCRIPTION'), false);
        assert.equal(JSON.stringify(data).includes('private@example.test'), false);
        assert.ok(Date.parse(data.expiresAt) - Date.parse(data.fetchedAt) <= 15 * 60_000);
    }
});

test('a scoped grant loses access immediately after parent revocation, expiry, suspension or role loss', async () => {
    const h = await harness();
    const { data: credential } = await (await h.issue()).json();
    assert.equal((await h.counts(credential.token)).status, 200);
    h.state.committees = [];
    assert.equal((await h.counts(credential.token)).status, 403);
    h.state.committees = [h.committee(1, 'FEEST')];
    h.state.active = false;
    assert.equal((await h.counts(credential.token)).status, 401);
    h.state.active = true;
    h.state.expiresAt = new Date(Date.now() - 1000).toISOString();
    assert.equal((await h.counts(credential.token)).status, 401);
    assert.ok(h.state.committeeReads >= 3, 'permissions are freshly queried, not cached in the grant');
});

test('valid grants cannot expand to foreign committees and returned event count is capped', async () => {
    const h = await harness();
    const { data: credential } = await (await h.issue()).json();
    h.state.events = Array.from({ length: 20 }, (_, i) => h.event(i + 1, i % 2 ? 1 : 2));
    const { data } = await (await h.counts(credential.token)).json();
    assert.equal(data.items.length, 8);
    assert.ok(data.items.every(item => Number(item.id.split(':')[1]) % 2 === 0));
});

test('current-day and ongoing events remain visible after start while yesterday-ended events are excluded', async () => {
    const h = await harness();
    const now = new Date('2026-11-10T19:00:00Z');
    assert.equal(h.security.isCurrentWidgetActivity('2026-11-10T08:00:00Z', null, now), true);
    assert.equal(h.security.isCurrentWidgetActivity('2026-11-09T08:00:00Z', null, now), false);
    assert.equal(h.security.isCurrentWidgetActivity('2026-11-09T08:00:00Z', '2026-11-11T19:00:00Z', now), true);
    assert.equal(h.security.isCurrentWidgetActivity('2026-11-10T23:30:00Z', null, now), true);
});
