import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { SourceTextModule, SyntheticModule, createContext } from 'node:vm';

const require = createRequire(new URL('../apps/frontend/package.json', import.meta.url));
const ts = require('typescript');
const { z } = require('zod');

async function harness(options = {}) {
    const state = { requests: [], qrTokens: [], reads: 0, authorized: false };
    const signup = { name: 'Test Buyer', email: 'buyer@example.com', paymentStatus: 'paid', amountTickets: 2, eventName: 'Kroegentocht', whatsappCommunityUrl: null, ...options.signup };
    const tickets = options.tickets ?? [{ name: 'First', qrToken: 'existing-qr-1' }, { name: 'Second', qrToken: 'existing-qr-2' }];
    const db = { select() {
        assert.equal(state.authorized, true, 'authorization must precede database access');
        const rows = state.reads++ === 0 ? (options.missing ? [] : [signup]) : tickets;
        const chain = { from() { return chain; }, leftJoin() { return chain; }, where() { return chain; }, limit() { return Promise.resolve(rows); }, then(resolve) { return Promise.resolve(rows).then(resolve); } };
        return chain;
    } };
    const context = createContext({
        process: { env: { MAIL_SERVICE_URL: 'https://mail.invalid', INTERNAL_SERVICE_TOKEN: 'fixture-token' } },
        AbortSignal,
        fetch: async (url, init) => {
            state.requests.push({ url, init, body: JSON.parse(init.body) });
            return { ok: !options.mailFailure, status: options.mailFailure ? 503 : 200 };
        }
    });
    const schema = new Proxy({}, { get: () => new Proxy({}, { get: (_, key) => key }) });
    const dependencies = {
        'server-only': {},
        'next/cache': { revalidateTag() {}, unstable_noStore() {} },
        '@salvemundi/db': { db, schema },
        'drizzle-orm': { eq() {} },
        'qrcode': { default: { async toDataURL(token) { state.qrTokens.push(token); return `data:image/png;base64,${token}`; } } },
        'zod': { z },
        '@/server/internal/kroegentocht/kroegentocht-signup-db.utils': { fetchPubCrawlSignupsDb() {}, fetchPubCrawlSignupByIdDb() {}, updatePubCrawlSignupDb() {}, deletePubCrawlSignupDb() {} },
        './beheer-kroegentocht-event.actions': { async requireKroegAdmin() { if (options.denied) throw new Error('Forbidden'); state.authorized = true; } },
        '@/server/utils/logger': { safeConsoleError() {} }
    };
    const source = readFileSync(new URL('../apps/frontend/src/server/actions/beheer/kroegentocht/beheer-kroegentocht-signup.actions.ts', import.meta.url), 'utf8');
    const module = new SourceTextModule(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText, { context });
    await module.link(specifier => {
        const exports = dependencies[specifier];
        assert.ok(exports, `unexpected dependency ${specifier}`);
        return new SyntheticModule(Object.keys(exports), function () { for (const [key, value] of Object.entries(exports)) this.setExport(key, value); }, { context });
    });
    await module.evaluate();
    return { state, send: module.namespace.resendPubCrawlTicketEmail };
}

test('queues all existing ticket QR codes to the saved recipient without a payment request', async () => {
    const { state, send } = await harness();
    assert.equal((await send(42)).success, true);
    assert.deepEqual(state.qrTokens, ['existing-qr-1', 'existing-qr-2']);
    assert.equal(state.requests.length, 1);
    const { url, init, body } = state.requests[0];
    assert.equal(url, 'https://mail.invalid/api/mail/send');
    assert.equal(init.headers.Authorization, 'Bearer fixture-token');
    assert.equal(body.to, 'buyer@example.com');
    assert.equal(body.templateId, 'pub_crawl_ticket');
    assert.equal(body.data.signupId, 42);
    assert.equal(body.data.totalTickets, 2);
    assert.equal(body.data.tickets.length, 2);
});

test('rejects unauthorized access before reading signup data', async () => {
    const { state, send } = await harness({ denied: true });
    await assert.rejects(send(42), /Forbidden/);
    assert.equal(state.reads, 0);
    assert.equal(state.requests.length, 0);
});

for (const [name, options, id] of [
    ['invalid ID', {}, -1],
    ['missing signup', { missing: true }, 42],
    ['unpaid signup', { signup: { paymentStatus: 'open' } }, 42],
    ['invalid email', { signup: { email: 'invalid' } }, 42],
    ['missing tickets', { tickets: [] }, 42],
    ['incomplete tickets', { tickets: [{ name: 'One', qrToken: 'qr' }] }, 42],
    ['missing QR token', { tickets: [{ name: 'One', qrToken: '' }, { name: 'Two', qrToken: 'qr' }] }, 42]
]) {
    test(`does not queue mail for ${name}`, async () => {
        const { state, send } = await harness(options);
        assert.equal((await send(id)).success, false);
        assert.equal(state.requests.length, 0);
    });
}

test('reports mail service failure without claiming delivery', async () => {
    const { send } = await harness({ mailFailure: true });
    const result = await send(42);
    assert.equal(result.success, false);
    assert.match(result.error, /niet worden klaargezet/);
});
