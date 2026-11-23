import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
    CORE_VARIANT_COMPONENTS,
    DEFAULT_REPORT_PATH,
    DISALLOWED_MANTINE_COLOR_TOKENS,
    OFFICIAL_HEX_SET,
    REPO_ROOT,
    buildComplianceReport,
    formatViolations,
    getAuditSnapshot,
} from './brandguide/compliance-engine.mjs';

const snapshot = getAuditSnapshot();

describe('Brandguide Tier 3: Cross-Feature Consistency & Variant Consolidation (12 tests)', () => {
    it('T3-01: 10-component variant extraction covers all 10 core Mantine components across 100% of UI .tsx files', () => {
        for (const comp of CORE_VARIANT_COMPONENTS) {
            const entry = snapshot.variantInventory.components[comp];
            assert.ok(entry, `Missing variant inventory for ${comp}`);
            assert.ok(entry.totalInstances > 0, `Expected >0 instances of ${comp}`);
            assert.ok(entry.variants.length > 0, `Expected >=1 variant signature for ${comp}`);
        }
    });

    it('T3-02: Button and ActionIcon variant consolidation (zero radius/className/unmapped color/redundant defaults)', () => {
        const violations = [];
        for (const comp of ['Button', 'ActionIcon']) {
            const entry = snapshot.variantInventory.components[comp];
            if (entry.redundantDefaultCount > 0 || entry.disallowedVariantCount > 0) {
                violations.push(
                    `${comp}: ${entry.distinctVariants} variants across ${entry.totalInstances} instances (redundant=${entry.redundantDefaultCount}, disallowed=${entry.disallowedVariantCount})`,
                );
            }
        }
        assert.equal(violations.length, 0, `Button/ActionIcon variant consolidation gaps:${formatViolations(violations)}`);
    });

    it('T3-03: Badge variant consolidation (zero radius, unmapped color, or ad-hoc tt="none" overrides)', () => {
        const badge = snapshot.variantInventory.components.Badge;
        const violations = [];
        if (badge.disallowedVariantCount > 0) {
            violations.push(`Badge disallowedVariantCount=${badge.disallowedVariantCount}`);
        }
        for (const file of snapshot.uiTsxFiles) {
            for (const el of file.jsxElements) {
                if (el.tagName !== 'Badge') continue;
                const v = el.props.variant?.value;
                if (v && !['light', 'filled', 'outline'].includes(v)) {
                    violations.push(`${file.relPath}:${el.line} <Badge variant="${v}">`);
                }
            }
        }
        assert.equal(violations.length, 0, `Badge variant drift:${formatViolations(violations)}`);
    });

    it('T3-04: Card and Paper surface consolidation (zero radius={0}, bg="white", or raw rgba)', () => {
        const violations = [];
        for (const comp of ['Card', 'Paper']) {
            const entry = snapshot.variantInventory.components[comp];
            if (entry.disallowedVariantCount > 0) {
                violations.push(`${comp}: disallowedVariantCount=${entry.disallowedVariantCount}`);
            }
        }
        for (const file of snapshot.uiTsxFiles) {
            for (const el of file.jsxElements) {
                if (el.tagName !== 'Card' && el.tagName !== 'Paper') continue;
                if (el.props.radius) violations.push(`${file.relPath}:${el.line} <${el.tagName} radius=${el.props.radius.text}>`);
                if (el.props.bg?.value === 'white') violations.push(`${file.relPath}:${el.line} <${el.tagName} bg="white">`);
            }
        }
        assert.equal(violations.length, 0, `Card/Paper surface drift:${formatViolations(violations)}`);
    });

    it('T3-05: Title and Text typography consolidation (Poppins 900 headings, no raw px, consistent stat labels)', () => {
        const violations = [];
        for (const comp of ['Title', 'Text']) {
            const entry = snapshot.variantInventory.components[comp];
            if (entry.disallowedVariantCount > 0) {
                violations.push(`${comp}: disallowedVariantCount=${entry.disallowedVariantCount}`);
            }
        }
        // Check beheer stat-bar label consistency (no fw={700} tt="uppercase" drift on stat labels)
        for (const file of snapshot.uiTsxFiles) {
            if (!file.relPath.startsWith('app/beheer/') && !file.relPath.startsWith('components/islands/beheer/')) continue;
            for (const el of file.jsxElements) {
                if (el.tagName === 'Text' && el.props.c?.value === 'dimmed' && el.props.tt?.value === 'uppercase' && el.props.fw?.value === 700) {
                    violations.push(`${file.relPath}:${el.line} beheer stat label uses fw={700} tt="uppercase" instead of fw={600}`);
                }
            }
        }
        assert.equal(violations.length, 0, `Title/Text typography drift:${formatViolations(violations)}`);
    });

    it('T3-06: ThemeIcon size and color consolidation (token sizes, semantic colors, zero radius)', () => {
        const violations = [];
        for (const file of snapshot.uiTsxFiles) {
            for (const el of file.jsxElements) {
                if (el.tagName !== 'ThemeIcon') continue;
                if (el.props.radius) violations.push(`${file.relPath}:${el.line} radius=${el.props.radius.text}`);
                if (el.props.size?.kind === 'number') violations.push(`${file.relPath}:${el.line} numeric size={${el.props.size.value}}`);
                for (const s of el.props.color?.stringLiterals || []) {
                    if (DISALLOWED_MANTINE_COLOR_TOKENS.has(s) || s === 'dark') {
                        violations.push(`${file.relPath}:${el.line} color="${s}"`);
                    }
                }
            }
        }
        assert.equal(violations.length, 0, `ThemeIcon variant drift:${formatViolations(violations)}`);
    });

    it('T3-07: Alert and Modal feedback consolidation (zero radius, className, unmapped color, or rgba overlays)', () => {
        const violations = [];
        for (const comp of ['Alert', 'Modal']) {
            const entry = snapshot.variantInventory.components[comp];
            if (entry.disallowedVariantCount > 0) violations.push(`${comp}: disallowedVariantCount=${entry.disallowedVariantCount}`);
        }
        for (const file of snapshot.uiTsxFiles) {
            for (const el of file.jsxElements) {
                if (el.tagName !== 'Alert' && el.tagName !== 'Modal') continue;
                if (el.props.overlayProps && /\brgba?\s*\(/i.test(el.props.overlayProps.text)) {
                    violations.push(`${file.relPath}:${el.line} <Modal overlayProps> uses rgba()`);
                }
            }
        }
        assert.equal(violations.length, 0, `Alert/Modal drift:${formatViolations(violations)}`);
    });

    it('T3-08: inline style={{ ... }} visual prop hygiene across UI .tsx files', () => {
        const violations = [];
        for (const file of snapshot.uiTsxFiles) {
            for (const ov of file.styleVisualOverrides) {
                if (/#[0-9a-fA-F]{3,8}|\brgba?\s*\(/i.test(ov.value)) {
                    violations.push(`${file.relPath}:${ov.line} <${ov.tagName} style={{ ${ov.prop}: ${ov.value} }}>`);
                }
                if (ov.prop === 'borderRadius' && !/9999px|50%|var\(--mantine-radius-/.test(ov.value)) {
                    violations.push(`${file.relPath}:${ov.line} <${ov.tagName} style={{ borderRadius: ${ov.value} }}>`);
                }
            }
        }
        assert.equal(violations.length, 0, `Inline style visual overrides:${formatViolations(violations)}`);
    });

    it('T3-09: BRAND_COLORS alignment across og-utils.tsx and all standalone opengraph-image.tsx files', () => {
        const violations = [];
        for (const file of snapshot.ogFiles) {
            const importsBrand = file.imports.some((i) => i.from.includes('theme') && i.specifiers.includes('BRAND_COLORS'));
            if (file.hexLiterals.length > 0 && !importsBrand) {
                violations.push(`${file.relPath}:${file.hexLiterals[0].line} missing BRAND_COLORS import`);
            }
            for (const h of file.hexLiterals) {
                if (!OFFICIAL_HEX_SET.has(h.hex) || file.relPath === 'lib/utils/og-utils.tsx') {
                    violations.push(`${file.relPath}:${h.line} hardcoded ${h.hex}`);
                }
            }
            for (const fc of file.funcColorLiterals) {
                violations.push(`${file.relPath}:${fc.line} ${fc.value}`);
            }
        }
        assert.equal(violations.length, 0, `OG palette alignment gaps:${formatViolations(violations)}`);
    });

    it('T3-10: BRAND_COLORS & resolver alignment in globals.css (@theme wipe + zero raw hex/rgba)', () => {
        assert.ok(snapshot.globalsCss.hasThemeBlock, 'globals.css missing @theme');
        assert.ok(snapshot.globalsCss.hasColorWildcardInitial, 'globals.css missing --color-*: initial');
        assert.equal(snapshot.globalsCss.hexLiterals.length, 0);
        assert.equal(snapshot.globalsCss.funcColorLiterals.length, 0);
    });

    it('T3-11: cross-page landmark and central navigation consistency', () => {
        const nestedMain = [];
        for (const file of snapshot.uiTsxFiles) {
            if (file.relPath === 'app/layout.tsx') continue;
            for (const el of file.jsxElements) {
                if (el.props.component?.value === 'main') {
                    nestedMain.push(`${file.relPath}:${el.line} <${el.tagName} component="main">`);
                }
            }
        }
        assert.equal(nestedMain.length, 0, `Nested <main> landmarks:${formatViolations(nestedMain)}`);

        const header = snapshot.filesByRel.get('components/islands/layout/NavigationHeader.tsx');
        const footer = snapshot.filesByRel.get('components/islands/layout/FooterIsland.tsx');
        assert.ok(header?.imports.some((i) => i.from === '@/lib/config/routes'));
        assert.ok(footer?.imports.some((i) => i.from === '@/lib/config/routes'));
    });

    it('T3-12: generates machine-readable variant & compliance JSON report outside repo root', (t) => {
        const report = buildComplianceReport(snapshot);
        assert.ok(report.totalFilesScanned >= 650);
        assert.equal(typeof report.compliantFiles, 'number');
        assert.equal(typeof report.nonCompliantFilesCount, 'number');
        assert.deepEqual(Object.keys(report.variantInventory), CORE_VARIANT_COMPONENTS);

        const resolvedOut = path.resolve(DEFAULT_REPORT_PATH);
        const relToRepo = path.relative(REPO_ROOT, resolvedOut);
        const isInsideRepoRoot = relToRepo === path.basename(resolvedOut) && !relToRepo.startsWith('..');
        assert.equal(isInsideRepoRoot, false, `Refusing to write report to repo root: ${resolvedOut}`);
        assert.equal(resolvedOut.startsWith(path.join(REPO_ROOT, 'apps', 'frontend', 'src')), false, 'Refusing to write inside apps/frontend/src');

        fs.mkdirSync(path.dirname(resolvedOut), { recursive: true });
        fs.writeFileSync(resolvedOut, JSON.stringify(report, null, 2), 'utf8');
        const parsed = JSON.parse(fs.readFileSync(resolvedOut, 'utf8'));
        assert.equal(parsed.totalFilesScanned, report.totalFilesScanned);

        const summary = CORE_VARIANT_COMPONENTS.map(
            (c) => `${c}: ${report.variantInventory[c].distinctVariants}v/${report.variantInventory[c].totalInstances}i`,
        ).join(', ');
        t.diagnostic(
            `Brandguide report written to ${resolvedOut} | scanned=${report.totalFilesScanned} compliant=${report.compliantFiles} nonCompliant=${report.nonCompliantFilesCount} | ${summary}`,
        );
    });
});
