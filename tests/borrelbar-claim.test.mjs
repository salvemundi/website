import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { SourceTextModule, SyntheticModule, createContext } from 'node:vm';

const require = createRequire(new URL('../apps/frontend/package.json', import.meta.url));
const ts = require('typescript');

async function harness(options = {}) {
    let claim = options.claim;
    const state = { writes: 0, requests: 0 };
    const db = {
        query: {
            borrelbar_settings: { async findFirst() { return { is_active: true, claim_url: options.invalidUrl ? 'invalid' : 'https://portal.onme.nl/pass/activation/quiz-123' }; } },
            borrelbar_claims: { async findFirst() { return claim; } },
            sponsors: { async findFirst() { return null; } },
            directus_users: { async findFirst() { return { first_name: 'Test', last_name: 'Member', email: 'member@example.com' }; } }
        },
        insert() { return { values(values) { return { async onConflictDoUpdate() { state.writes++; claim = values; } }; } }; }
    };
    const context = createContext({
        AbortSignal,
        fetch: async () => {
            state.requests++;
            if (options.networkError) throw new Error('offline');
            return { ok: !options.httpError, status: options.httpError ? 503 : 200, async json() { return options.emptyResponse ? {} : { passHolderId: 'holder-123' }; } };
        }
    });
    const schema = new Proxy({}, { get: () => new Proxy({}, { get: (_, key) => key }) });
    const dependencies = {
        '@/server/auth/auth-utils': { async getEnrichedSession() { return { user: { id: 'member', membership_status: options.inactive ? 'expired' : 'active' } }; } },
        '@salvemundi/db': { db, schema },
        'drizzle-orm': { eq() {}, isNull() {} },
        '@/server/utils/logger': { safeConsoleError() {} }
    };
    const source = readFileSync(new URL('../apps/frontend/src/server/actions/profile/borrelbar-claim.actions.ts', import.meta.url), 'utf8');
    const module = new SourceTextModule(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText, { context });
    await module.link(specifier => {
        const exports = dependencies[specifier];
        assert.ok(exports, specifier);
        return new SyntheticModule(Object.keys(exports), function () { for (const [key, value] of Object.entries(exports)) this.setExport(key, value); }, { context });
    });
    await module.evaluate();
    return { state, claim: module.namespace.claimBorrelBarLink, status: module.namespace.getBorrelBarClaimStatus };
}

for (const failure of ['networkError', 'httpError', 'emptyResponse', 'invalidUrl']) {
    test(`${failure} leaves the claim available for retry`, async () => {
        const h = await harness({ [failure]: true });
        assert.equal((await h.claim()).success, false);
        assert.equal(h.state.writes, 0);
        assert.equal((await h.status()).hasClaimed, false);
    });
}
test('successful creation saves a usable pass and repeated claims reuse it', async () => {
    const h = await harness();
    const result = await h.claim();
    assert.equal(result.success, true);
    assert.equal(result.passUrl, 'https://portal.onme.nl/pass/acquisition/quiz-123/holder-123');
    assert.equal((await h.claim()).passUrl, result.passUrl);
    assert.equal(h.state.requests, 1);
    assert.equal(h.state.writes, 1);
});
test('a legacy claim without a URL can be repaired', async () => {
    const h = await harness({ claim: { pass_url: null } });
    assert.equal((await h.status()).hasClaimed, false);
    assert.equal((await h.claim()).success, true);
    assert.equal((await h.status()).hasClaimed, true);
});
test('inactive members cannot claim a pass', async () => {
    const h = await harness({ inactive: true });
    assert.equal((await h.claim()).success, false);
    assert.equal(h.state.requests, 0);
    assert.equal(h.state.writes, 0);
});

test('a rejected server action displays an inline error instead of escaping the transition', async () => {
    const errors = [];
    let transition;
    let stateIndex = 0;
    const react = {
        createElement(type, props, ...children) { return { type, props: props ?? {}, children }; },
        useState(value) { const index = stateIndex++; return [value, next => { if (index === 1) errors.push(next); }]; },
        useTransition() { return [false, callback => { transition = callback(); }]; }
    };
    const dependencies = {
        react: { default: react, ...react },
        'next/image': { default: 'image' },
        'lucide-react': Object.fromEntries(['Gift', 'CheckCircle2', 'Loader2', 'AlertCircle', 'ExternalLink'].map(key => [key, key])),
        '@/server/actions/profile/borrelbar-claim.actions': { async claimBorrelBarLink() { throw new Error('Server Components render failed'); } },
        '@/lib/utils/image-utils': { getImageUrl() {} }
    };
    const source = readFileSync(new URL('../apps/frontend/src/components/islands/account/profile/BorrelBarClaimCard.tsx', import.meta.url), 'utf8');
    const context = createContext({});
    const module = new SourceTextModule(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React } }).outputText, { context });
    await module.link(specifier => {
        const exports = dependencies[specifier];
        assert.ok(exports, specifier);
        return new SyntheticModule(Object.keys(exports), function () { for (const [key, value] of Object.entries(exports)) this.setExport(key, value); }, { context });
    });
    await module.evaluate();
    const tree = module.namespace.default({ initialStatus: { isActive: true, hasClaimed: false } });
    function findButton(node) {
        if (!node || typeof node !== 'object') return null;
        if (node.type === 'button') return node;
        return node.children?.flat(Infinity).map(findButton).find(Boolean);
    }
    findButton(tree).props.onClick();
    await assert.doesNotReject(transition);
    assert.match(errors.at(-1), /Vernieuw de pagina/);
});
