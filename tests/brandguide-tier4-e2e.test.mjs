import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { FRONTEND_DIR, REPO_ROOT, formatViolations } from './brandguide/compliance-engine.mjs';

if (process.env.SALVEMUNDI_E2E_ACTIVE === '1') {
    throw new Error('Recursive Tier 4 E2E invocation detected (SALVEMUNDI_E2E_ACTIVE=1)');
}

function runCmd(command, args, timeout = 120_000) {
    return spawnSync(command, args, {
        cwd: REPO_ROOT,
        shell: process.platform === 'win32',
        encoding: 'utf8',
        maxBuffer: 20 * 1024 * 1024,
        timeout,
        env: {
            ...process.env,
            SALVEMUNDI_E2E_ACTIVE: '1',
        },
    });
}

describe('Brandguide Tier 4: End-to-End Repository Validation (6 tests)', () => {
    it('T4-01: frontend TypeScript type-check passes cleanly', () => {
        const res = runCmd('pnpm', ['--filter', '@salvemundi/frontend', 'type-check'], 120_000);
        assert.equal(res.status, 0, `Frontend type-check failed (exit ${res.status}):\n${res.stdout}\n${res.stderr}`);
    });

    it('T4-02: frontend ESLint passes with 0 errors and 0 warnings (--format json)', () => {
        const res = runCmd('pnpm', ['--filter', '@salvemundi/frontend', 'exec', 'eslint', 'src', '--format', 'json'], 120_000);
        const raw = res.stdout || '';
        const start = raw.indexOf('[');
        const end = raw.lastIndexOf(']');
        assert.ok(start !== -1 && end > start, `Expected JSON array from eslint, got:\n${raw}\n${res.stderr}`);

        const parsed = JSON.parse(raw.slice(start, end + 1));
        let totalErrors = 0;
        let totalWarnings = 0;
        const details = [];
        for (const fileRes of parsed) {
            totalErrors += fileRes.errorCount || 0;
            totalWarnings += fileRes.warningCount || 0;
            for (const msg of fileRes.messages || []) {
                details.push(`${path.relative(REPO_ROOT, fileRes.filePath)}:${msg.line} [${msg.ruleId}] ${msg.message}`);
            }
        }
        assert.equal(res.status, 0, `ESLint exited with ${res.status}:${formatViolations(details)}`);
        assert.equal(totalErrors, 0, `ESLint errors > 0:${formatViolations(details)}`);
        assert.equal(totalWarnings, 0, `ESLint warnings > 0:${formatViolations(details)}`);
    });

    it('T4-03: monorepo workspace type-check passes cleanly', () => {
        const res = runCmd('pnpm', ['type-check'], 180_000);
        assert.equal(res.status, 0, `Monorepo type-check failed (exit ${res.status}):\n${res.stdout}\n${res.stderr}`);
    });

    it('T4-04: monorepo workspace lint passes cleanly', () => {
        const res = runCmd('pnpm', ['lint'], 180_000);
        assert.equal(res.status, 0, `Monorepo lint failed (exit ${res.status}):\n${res.stdout}\n${res.stderr}`);
    });

    it('T4-05: frontend production build gate (runs full next build when RUN_FULL_BUILD=1)', (t) => {
        const nextConfigPath = path.join(FRONTEND_DIR, 'next.config.ts');
        const pkgPath = path.join(FRONTEND_DIR, 'package.json');
        assert.ok(fs.existsSync(nextConfigPath), 'Missing apps/frontend/next.config.ts');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        assert.ok(pkg.scripts?.prebuild && pkg.scripts?.build, 'Missing prebuild/build scripts in apps/frontend/package.json');

        if (process.env.RUN_FULL_BUILD !== '1') {
            t.skip('Set RUN_FULL_BUILD=1 to execute full Next.js production build');
            return;
        }

        const res = runCmd('pnpm', ['--filter', '@salvemundi/frontend', 'build'], 300_000);
        assert.equal(res.status, 0, `Frontend production build failed (exit ${res.status}):\n${res.stdout}\n${res.stderr}`);
        assert.ok(fs.existsSync(path.join(FRONTEND_DIR, '.next', 'BUILD_ID')), 'Missing .next/BUILD_ID after build');
    });

    it('T4-06: test suite syntax, anti-recursion guard, and repo-root cleanliness verification', () => {
        const ownedFiles = [
            'tests/brandguide/compliance-engine.mjs',
            'tests/brandguide-tier1-features.test.mjs',
            'tests/brandguide-tier2-boundaries.test.mjs',
            'tests/brandguide-tier3-consistency.test.mjs',
            'tests/brandguide-tier4-e2e.test.mjs',
        ];
        const forbiddenVmLoader = 'SourceText' + 'Module';
        const forbiddenSuppress = 'eslint' + '-disable';

        for (const rel of ownedFiles) {
            const abs = path.join(REPO_ROOT, rel);
            assert.ok(fs.existsSync(abs), `Missing test file ${rel}`);
            const check = spawnSync(process.execPath, ['--check', abs], {
                cwd: REPO_ROOT,
                encoding: 'utf8',
            });
            assert.equal(check.status, 0, `Syntax check failed for ${rel}:\n${check.stderr}`);

            const text = fs.readFileSync(abs, 'utf8');
            assert.equal(text.includes(forbiddenVmLoader), false, `${rel} must not use ${forbiddenVmLoader}`);
            assert.equal(text.includes(forbiddenSuppress), false, `${rel} must not use suppress comments`);
        }

        const tier4Text = fs.readFileSync(path.join(REPO_ROOT, 'tests', 'brandguide-tier4-e2e.test.mjs'), 'utf8');
        assert.ok(tier4Text.includes('SALVEMUNDI_E2E_ACTIVE'), 'Tier 4 must enforce SALVEMUNDI_E2E_ACTIVE anti-recursion guard');

        const gitRes = spawnSync('git', ['status', '--porcelain'], {
            cwd: REPO_ROOT,
            encoding: 'utf8',
        });
        assert.equal(gitRes.status, 0, 'git status failed');
        const rootUntrackedJson = gitRes.stdout
            .split(/\r?\n/)
            .filter(Boolean)
            .map((line) => line.slice(3).trim())
            .filter((p) => !p.includes('/') && p.endsWith('.json') && /brandguide|variant|report/i.test(p));

        assert.equal(
            rootUntrackedJson.length,
            0,
            `Generated JSON report files must not pollute repo root:${formatViolations(rootUntrackedJson)}`,
        );
    });
});
