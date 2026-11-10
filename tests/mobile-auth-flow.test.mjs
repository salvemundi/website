import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as crypto from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { SourceTextModule, SyntheticModule, createContext } from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

// Run the actual route/service sources, including SQL, against an isolated real
// relational database. Only Microsoft/browser authentication and Redis I/O are
// injected boundaries. No production credentials or database are accessed.
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = resolve(repo, 'apps/frontend/src');
const userID = '11111111-1111-4111-8111-111111111111';
const otherUserID = '22222222-2222-4222-8222-222222222222';
const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
const challenge = createHash('sha256').update(verifier).digest('base64url');
const state = 'test-app-state-012345678901234567890123456789';
const callback = 'salvemundi://auth/callback';
const mappings = {
    camel: { userId: 'userId', expiresAt: 'expiresAt', createdAt: 'createdAt', updatedAt: 'updatedAt', userAgent: 'userAgent' },
    snake: { userId: 'user_id', expiresAt: 'expires_at', createdAt: 'created_at', updatedAt: 'updated_at', userAgent: 'user_agent' }
};

async function harness(t, layout, { sessionOwner = userID, sessionUser = userID, expired = false, revoked = false } = {}) {
    const columns = mappings[layout];
    const database = new DatabaseSync(':memory:');
    t.after(() => database.close());
    database.function('NOW', () => new Date().toISOString());
    database.exec(`
        CREATE TABLE directus_users (
            id TEXT PRIMARY KEY, status TEXT NOT NULL, name TEXT, email TEXT,
            first_name TEXT, last_name TEXT, phone_number TEXT,
            membership_status TEXT, membership_expiry TEXT, entra_id TEXT
        );
        CREATE TABLE auth_sessions (
            id TEXT PRIMARY KEY, token TEXT NOT NULL UNIQUE,
            "${columns.userId}" TEXT NOT NULL, "${columns.expiresAt}" TEXT NOT NULL,
            "${columns.createdAt}" TEXT NOT NULL, "${columns.updatedAt}" TEXT NOT NULL,
            "${columns.userAgent}" TEXT
        );
    `);
    const insertUser = database.prepare(`INSERT INTO directus_users VALUES (?, 'active', 'Test Member', ?, 'Test', 'Member', '+31612345678', 'active', '2027-01-01', 'test-entra')`);
    insertUser.run(userID, 'member@example.test'); insertUser.run(otherUserID, 'other@example.test');
    const expires = new Date(Date.now() + (expired ? -60_000 : 60_000)).toISOString();
    if (!revoked) database.prepare(`INSERT INTO auth_sessions VALUES ('browser-session', 'browser-secret', ?, ?, ?, ?, 'Browser')`).run(sessionOwner, expires, new Date().toISOString(), new Date().toISOString());
    const redisValues = new Map();
    const grants = [];
    let metadataQueries = 0;
    let metadataFailures = 0;
    let removedDevices = 0;
    const queries = [];
    const pool = {
        async query(statement, values = []) {
            queries.push(statement);
            if (statement.includes('information_schema.columns')) {
                metadataQueries++;
                if (metadataFailures > 0) { metadataFailures--; throw new Error('synthetic metadata connection failure'); }
                return { rows: database.prepare(`SELECT name AS column_name FROM pragma_table_info('auth_sessions')`).all() };
            }
            // SQLite supports the same bound $N parameters. This is the only
            // PostgreSQL syntax conversion: a text cast, not identifier names.
            const query = database.prepare(statement.replace(/::text\b/g, ''));
            const parameters = Object.fromEntries(values.map((value, index) => [String(index + 1), value]));
            if (query.columns().length) {
                const rows = query.all(parameters);
                return { rows, rowCount: rows.length };
            }
            const result = query.run(parameters);
            return { rows: [], rowCount: Number(result.changes) };
        }
    };
    const redis = {
        async get(key) { return redisValues.get(key) ?? null; },
        async getdel(key) { const value = redisValues.get(key) ?? null; redisValues.delete(key); return value; },
        async set(key, value, mode, seconds) {
            assert.equal(mode, 'EX'); assert.ok(seconds > 0);
            redisValues.set(key, value);
            if (key.startsWith('mobile:grant:')) grants.push(JSON.parse(value));
            return 'OK';
        }
    };
    const context = createContext({
        URL, Request, Response, Headers, Buffer, console,
        process: { env: { ENV_NAME: 'acc', MOBILE_API_ENABLED: 'true', BETTER_AUTH_URL: 'https://acc.salvemundi.nl' } }
    });
    const modules = new Map();
    function synthetic(identifier, exports) {
        const module = new SyntheticModule(Object.keys(exports), function () {
            for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
        }, { context, identifier });
        modules.set(identifier, module);
    }
    synthetic('server-only', {});
    synthetic('node:crypto', crypto);
    synthetic(resolve(sourceRoot, 'lib/database/db.ts'), { pool });
    synthetic(resolve(sourceRoot, 'server/auth/redis-client.ts'), { getRedis: async () => redis });
    synthetic(resolve(sourceRoot, 'server/utils/logger.ts'), { safeConsoleError: () => {} });
    synthetic(resolve(sourceRoot, 'server/utils/ratelimit.ts'), { rateLimit: async () => ({ success: true }) });
    synthetic(resolve(sourceRoot, 'server/auth/auth.ts'), {
        auth: { api: { signInSocial: async () => Response.json({ url: 'https://login.microsoftonline.com/test' }) } }
    });
    synthetic(resolve(sourceRoot, 'server/auth/auth-utils.ts'), {
        getEnrichedSession: async headers => {
            assert.equal(headers.has('authorization'), false, 'native bearer must not authenticate browser callback');
            assert.equal(headers.get('cookie')?.includes('directus_impersonation_token='), false, 'impersonation cookies must be stripped');
            return headers.get('cookie')?.includes('web-auth=verified') ? { user: { id: sessionUser }, session: { id: 'browser-session' } } : null;
        }
    });
    synthetic(resolve(sourceRoot, 'server/mobile/notifications.ts'), {
        removeMobileDevicesForSession: async (id, sessionID) => {
            assert.equal(id, userID); assert.match(sessionID, /^mobile:/); removedDevices++;
        }
    });
    const sourceFiles = ['auth', 'session', 'session-columns', 'security', 'http', 'policy'];
    for (const name of sourceFiles) {
        const identifier = resolve(sourceRoot, `server/mobile/${name}.ts`);
        const source = stripTypeScriptTypes(readFileSync(identifier, 'utf8'), { mode: 'strip', sourceUrl: pathToFileURL(identifier).href });
        modules.set(identifier, new SourceTextModule(source, { context, identifier, importModuleDynamically: async specifier => {
            const imported = modules.get(resolve(dirname(identifier), `${specifier}.ts`));
            assert.ok(imported, `unregistered dynamic dependency ${specifier}`);
            if (imported.status === 'unlinked') await imported.link(linker);
            if (imported.status === 'linked') await imported.evaluate();
            return imported;
        } }));
    }
    function linker(specifier, referencing) {
        let identifier = specifier;
        if (specifier.startsWith('@/')) identifier = resolve(sourceRoot, `${specifier.slice(2)}.ts`);
        else if (specifier.startsWith('.')) identifier = resolve(dirname(referencing.identifier), `${specifier}.ts`);
        const imported = modules.get(identifier);
        assert.ok(imported, `unregistered dependency ${identifier}`);
        return imported;
    }
    const auth = modules.get(resolve(sourceRoot, 'server/mobile/auth.ts'));
    await auth.link(linker); await auth.evaluate();
    const session = modules.get(resolve(sourceRoot, 'server/mobile/session.ts')).namespace;
    const http = modules.get(resolve(sourceRoot, 'server/mobile/http.ts')).namespace;
    const schema = modules.get(resolve(sourceRoot, 'server/mobile/session-columns.ts')).namespace;
    async function begin() {
        const url = new URL('https://acc.salvemundi.nl/api/mobile/v1/auth/start');
        url.searchParams.set('code_challenge', challenge); url.searchParams.set('state', state); url.searchParams.set('redirect_uri', callback);
        const response = await http.mobileRoute(auth.namespace.startMobileLogin)(new Request(url));
        assert.equal(response.status, 302);
        const cookie = response.headers.getSetCookie().find(value => value.startsWith('sm_mobile_flow='));
        assert.ok(cookie); assert.match(cookie, /HttpOnly/); assert.match(cookie, /Secure/);
        const pair = cookie.split(';')[0];
        const flowID = pair.slice('sm_mobile_flow='.length).split('.')[0];
        return { pair, flowID };
    }
    async function complete(flow, overrides = {}) {
        const cookie = overrides.cookie ?? `${flow.pair}; web-auth=verified; directus_impersonation_token=ignored`;
        const request = new Request(`https://acc.salvemundi.nl/api/mobile/v1/auth/complete?flow=${flow.flowID}`, {
            headers: { cookie, authorization: 'Bearer ignored-native-credential' }
        });
        return http.mobileRoute(auth.namespace.completeMobileLogin)(request);
    }
    async function exchange(code, codeVerifier = verifier) {
        return http.mobileRoute(auth.namespace.exchangeMobileLogin)(new Request('https://acc.salvemundi.nl/api/mobile/v1/auth/exchange', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, code_verifier: codeVerifier, redirect_uri: callback })
        }));
    }
    return {
        database, columns, begin, complete, exchange, redisValues, grants, session, http, schema, queries,
        logout: request => http.mobileRoute(auth.namespace.logoutMobileSession)(request),
        metadataCount: () => metadataQueries, failNextMetadata: () => { metadataFailures++; },
        devicesRemoved: () => removedDevices
    };
}

for (const layout of ['camel', 'snake']) {
    test(`${layout}: actual callback, credential exchange, authenticated SQL lookup, logout and replay protection`, async t => {
        const h = await harness(t, layout);
        const flow = await h.begin();
        const response = await h.complete(flow);
        assert.equal(response.status, 302, await response.clone().text());
        const url = new URL(response.headers.get('location'));
        assert.equal(`${url.protocol}//${url.host}${url.pathname}`, callback);
        assert.equal(url.searchParams.get('state'), state);
        const code = url.searchParams.get('code'); assert.ok(code);
        assert.equal(h.redisValues.has(`mobile:login:${flow.flowID}`), false);
        const completedTwice = await h.complete(flow); assert.equal(completedTwice.status, 401);
        const exchange = await h.exchange(code); assert.equal(exchange.status, 200, await exchange.clone().text());
        const { data: credentials } = await exchange.json();
        assert.match(credentials.token, /^smi_[A-Za-z0-9_-]{43}$/);
        const row = h.database.prepare(`SELECT * FROM auth_sessions WHERE id LIKE 'mobile:%'`).get();
        assert.equal(row[h.columns.userId], userID); assert.notEqual(row.token, credentials.token); assert.match(row.token, /^mobile-sha256:/);
        assert.ok(Date.parse(row[h.columns.expiresAt]) > Date.now());
        const request = new Request('https://acc.salvemundi.nl/api/mobile/v1/me', { headers: { Authorization: `Bearer ${credentials.token}` } });
        const user = await h.session.requireMobileUser(request); assert.equal(user.id, userID); assert.equal(user.email, 'member@example.test');
        assert.equal((await h.exchange(code)).status, 401, 'grant must be one-use');
        const logout = await h.logout(request); assert.equal(logout.status, 200); assert.equal(h.devicesRemoved(), 1);
        await assert.rejects(h.session.requireMobileUser(request), error => error.status === 401);
        assert.equal(h.metadataCount(), 1, 'successful schema metadata is cached across the full flow');
    });
    for (const reason of ['revoked', 'expired', 'wrong-owner']) {
        test(`${layout}: database ${reason} browser session cannot mint native credentials`, async t => {
            const h = await harness(t, layout, reason === 'wrong-owner' ? { sessionOwner: otherUserID } : { [reason]: true });
            const flow = await h.begin();
            const response = await h.complete(flow);
            assert.equal(response.status, 401, await response.clone().text()); assert.equal(h.grants.length, 0);
            assert.equal(h.redisValues.has(`mobile:login:${flow.flowID}`), true, 'failed identity check must not consume legitimate flow');
        });
    }
    test(`${layout}: wrong/missing browser nonce is rejected before identity lookup or flow consumption`, async t => {
        const h = await harness(t, layout); const flow = await h.begin();
        for (const cookie of ['web-auth=verified', 'sm_mobile_flow=wrong; web-auth=verified']) {
            assert.equal((await h.complete(flow, { cookie })).status, 401);
        }
        assert.equal(h.metadataCount(), 0); assert.equal(h.grants.length, 0);
        assert.equal((await h.complete(flow)).status, 302, 'valid initiating browser can still finish');
    });
    test(`${layout}: incorrect PKCE verifier never creates a native database session`, async t => {
        const h = await harness(t, layout); const flow = await h.begin();
        const complete = await h.complete(flow); const code = new URL(complete.headers.get('location')).searchParams.get('code');
        assert.equal((await h.exchange(code, 'x'.repeat(43))).status, 401);
        assert.equal(h.database.prepare(`SELECT COUNT(*) AS n FROM auth_sessions WHERE id LIKE 'mobile:%'`).get().n, 0);
        assert.equal((await h.exchange(code)).status, 401, 'rejected code must remain single-use');
    });
    test(`${layout}: transient metadata failures can recover and are not cached`, async t => {
        const h = await harness(t, layout); h.failNextMetadata();
        await assert.rejects(h.schema.getSessionColumns(), /synthetic metadata connection failure/);
        const columns = await h.schema.getSessionColumns();
        assert.equal(columns.userId, `"${h.columns.userId}"`); assert.equal(h.metadataCount(), 2);
        await h.schema.getSessionColumns(); assert.equal(h.metadataCount(), 2);
    });
    test(`${layout}: ambiguous session ownership columns fail closed with a generic 503`, async t => {
        const h = await harness(t, layout);
        h.database.exec(`ALTER TABLE auth_sessions ADD COLUMN "${layout === 'camel' ? 'user_id' : 'userId'}" TEXT`);
        const flow = await h.begin(); const response = await h.complete(flow);
        assert.equal(response.status, 503); const error = await response.json(); assert.equal(error.error.code, 'configuration_error');
        assert.equal(JSON.stringify(error).includes('userId'), false); assert.equal(h.grants.length, 0);
    });
    test(`${layout}: missing mandatory session columns fail closed instead of selecting a fallback`, async t => {
        const h = await harness(t, layout);
        h.database.exec(`ALTER TABLE auth_sessions DROP COLUMN "${h.columns.userAgent}"`);
        const flow = await h.begin(); const response = await h.complete(flow);
        assert.equal(response.status, 503); assert.equal((await response.json()).error.code, 'configuration_error'); assert.equal(h.grants.length, 0);
    });
}
