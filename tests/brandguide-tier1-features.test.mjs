import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
    ALL_MANTINE_BAN_CLASSNAME,
    DOCUMENTED_DOM_PRIMITIVE_ALLOWLIST,
    EXPECTED_BRAND_HEXES,
    FRONTEND_DIR,
    MANTINE_BADGE_COMPONENTS,
    MANTINE_BUTTON_COMPONENTS,
    MANTINE_INPUT_COMPONENTS,
    MANTINE_LAYOUT_COMPONENTS,
    MANTINE_NAV_FEEDBACK_COMPONENTS,
    MANTINE_RADIUS_COMPONENTS,
    MANTINE_SURFACE_COMPONENTS,
    MANTINE_TYPOGRAPHY_COMPONENTS,
    OFFICIAL_HEX_SET,
    RAW_SVG_TAGS,
    SOCIAL_ICON_TAGS,
    formatViolations,
    getAuditSnapshot,
    getDisallowedColorTokensInFile,
    getDisallowedRawTagsInFile,
} from './brandguide/compliance-engine.mjs';

const snapshot = getAuditSnapshot();

describe('Brandguide Tier 1: Feature Coverage (F1-F11, 55 tests)', () => {
    // =========================================================================
    // F1: Official 9-Color Brandguide Palette
    // =========================================================================
    describe('F1: Official 9-Color Brandguide Palette', () => {
        it('T1-F1-01: theme/brand.ts exports exact 9 Brandguide colors with zero off-brand hexes', () => {
            const actual = snapshot.theme.brandColors;
            assert.deepEqual(Object.keys(actual).sort(), Object.keys(EXPECTED_BRAND_HEXES).sort());
            for (const [key, expectedHex] of Object.entries(EXPECTED_BRAND_HEXES)) {
                assert.equal(actual[key], expectedHex, `BRAND_COLORS.${key} mismatch`);
            }
            const brandFile = snapshot.filesByRel.get('lib/config/theme/brand.ts');
            assert.ok(brandFile, 'Missing lib/config/theme/brand.ts');
            const offBrand = brandFile.hexLiterals.filter((h) => !OFFICIAL_HEX_SET.has(h.hex));
            assert.equal(offBrand.length, 0, `Off-brand hexes in theme/brand.ts:${formatViolations(offBrand.map((h) => `L${h.line}: ${h.hex}`))}`);
        });

        it('T1-F1-02: theme/colors.ts maps 8 named tuples + brand virtualColor + dark/gray scales via BRAND_COLORS', () => {
            const { themeColorKeys, brandVirtualColor, scaleTuples } = snapshot.theme;
            for (const requiredKey of ['purple', 'lightPurple', 'accent', 'success', 'error', 'darkSurface', 'darkBase', 'lightBase', 'brand', 'dark', 'gray']) {
                assert.ok(themeColorKeys.has(requiredKey), `theme/colors.ts missing "${requiredKey}"`);
            }
            assert.equal(brandVirtualColor?.dark?.value, 'lightPurple');
            assert.equal(brandVirtualColor?.light?.value, 'purple');
            for (const scaleName of ['dark', 'gray']) {
                assert.equal(scaleTuples[scaleName]?.length, 10, `${scaleName} tuple must have 10 steps`);
                for (const item of scaleTuples[scaleName]) {
                    assert.ok(item.startsWith('BRAND_COLORS.'), `${scaleName} step "${item}" must reference BRAND_COLORS`);
                }
            }
        });

        it('T1-F1-03: non-theme UI .tsx files use only allowed semantic Mantine color tokens', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const hit of getDisallowedColorTokensInFile(file)) {
                    violations.push(`${file.relPath}:${hit.line} <${hit.tagName} ${hit.propName}="${hit.token}">`);
                }
            }
            assert.equal(violations.length, 0, `Disallowed Mantine color tokens:${formatViolations(violations)}`);
        });

        it('T1-F1-04: non-theme .ts/.tsx files contain zero hardcoded hex literals outside BRAND_COLORS', () => {
            const violations = [];
            for (const file of [...snapshot.uiFiles, ...snapshot.ogFiles]) {
                for (const hit of file.hexLiterals) {
                    if (file.category === 'og' && OFFICIAL_HEX_SET.has(hit.hex) && file.relPath !== 'lib/utils/og-utils.tsx') {
                        const importsBrand = file.imports.some((i) => i.from.includes('theme') && i.specifiers.includes('BRAND_COLORS'));
                        if (importsBrand) continue;
                    }
                    violations.push(`${file.relPath}:${hit.line} ${hit.hex}`);
                }
            }
            assert.equal(violations.length, 0, `Hardcoded hex literals outside theme/brand.ts:${formatViolations(violations)}`);
        });

        it('T1-F1-05: theme/resolver.ts resolves dark and light CSS vars via BRAND_COLORS and color-mix() only', () => {
            const resolverFile = snapshot.filesByRel.get('lib/config/theme/resolver.ts');
            assert.ok(resolverFile, 'Missing lib/config/theme/resolver.ts');
            assert.equal(resolverFile.hexLiterals.length, 0, `Raw hexes in resolver.ts:${formatViolations(resolverFile.hexLiterals.map((h) => `L${h.line}: ${h.hex}`))}`);
            assert.equal(resolverFile.funcColorLiterals.length, 0, `Raw rgb/rgba in resolver.ts:${formatViolations(resolverFile.funcColorLiterals.map((f) => `L${f.line}: ${f.value}`))}`);
            assert.ok(Object.keys(snapshot.theme.resolverVars.dark).length > 10, 'Dark resolver map populated');
            assert.ok(Object.keys(snapshot.theme.resolverVars.light).length > 10, 'Light resolver map populated');
        });
    });

    // =========================================================================
    // F2: Backgrounds & Surfaces
    // =========================================================================
    describe('F2: Backgrounds & Surfaces (Card, Paper, Container)', () => {
        it('T1-F2-01: theme/components/surfaces.ts configures canonical Card and Container defaults', () => {
            const { card, container } = {
                card: snapshot.theme.componentDefaults.Card,
                container: snapshot.theme.componentDefaults.Container,
            };
            assert.equal(card?.padding?.value, 'lg');
            assert.equal(card?.shadow?.value, 'md');
            assert.equal(card?.withBorder?.value, false);
            assert.equal(card?.bg?.value, 'var(--mantine-color-default)');
            assert.equal(container?.size?.value, 'xl');
            assert.equal(container?.py?.value, 'xl');
            assert.equal(container?.w?.value, '100%');
        });

        it('T1-F2-02: theme/resolver.ts defines core surface CSS custom properties in both dark and light modes', () => {
            const { dark, light } = snapshot.theme.resolverVars;
            for (const key of ['--mantine-color-body', '--mantine-color-default', '--surface-subtle', '--surface-subtle-border']) {
                assert.ok(Object.hasOwn(dark, key), `resolver dark missing ${key}`);
                assert.ok(Object.hasOwn(light, key), `resolver light missing ${key}`);
            }
        });

        it('T1-F2-03: Card and Paper use only semantic surface backgrounds (never bg="white" or raw hex/rgba)', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if (el.tagName !== 'Card' && el.tagName !== 'Paper') continue;
                    const bg = el.props.bg;
                    if (!bg) continue;
                    for (const str of bg.stringLiterals || []) {
                        if (str === 'white' || str === 'black' || /^#/.test(str) || /\brgba?\s*\(/i.test(str)) {
                            violations.push(`${file.relPath}:${el.line} <${el.tagName} bg="${str}">`);
                        }
                    }
                }
            }
            assert.equal(violations.length, 0, `Non-semantic Card/Paper bg:${formatViolations(violations)}`);
        });

        it('T1-F2-04: zero manual radius props (string or expression) on Card, Paper, and Container', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if (MANTINE_SURFACE_COMPONENTS.has(el.tagName) && el.props.radius) {
                        violations.push(`${file.relPath}:${el.line} <${el.tagName} radius=${el.props.radius.text}>`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Manual radius on surface components:${formatViolations(violations)}`);
        });

        it('T1-F2-05: zero className props on Card, Paper, and Container', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if (MANTINE_SURFACE_COMPONENTS.has(el.tagName) && el.props.className) {
                        violations.push(`${file.relPath}:${el.line} <${el.tagName} className>`);
                    }
                }
            }
            assert.equal(violations.length, 0, `className on surface components:${formatViolations(violations)}`);
        });
    });

    // =========================================================================
    // F3: Typography & Headings
    // =========================================================================
    describe('F3: Typography & Headings (Poppins, Title, Text)', () => {
        it('T1-F3-01: layout.tsx loads Poppins 100-900 and theme/index.ts binds Poppins + headings fw 900', () => {
            const layoutFile = snapshot.filesByRel.get('app/layout.tsx');
            assert.ok(layoutFile, 'Missing app/layout.tsx');
            assert.match(layoutFile.sourceText, /variable:\s*['"]--font-poppins['"]/);
            assert.match(layoutFile.sourceText, /Poppins-Black\.ttf/);
            const meta = snapshot.theme.themeMeta;
            assert.equal(meta.defaultRadius?.value, 'md');
            assert.equal(meta.primaryColor?.value, 'brand');
            assert.equal(meta.headings?.entries?.fontWeight?.value, '900');
        });

        it('T1-F3-02: zero raw HTML typography tags in non-OG .tsx files', () => {
            const typoTags = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'strong', 'b', 'em', 'i', 'u', 'small', 'code', 'pre', 'blockquote']);
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const hit of getDisallowedRawTagsInFile(file)) {
                    if (typoTags.has(hit.tag)) {
                        violations.push(`${file.relPath}:${hit.line} <${hit.tag}>`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Raw HTML typography tags:${formatViolations(violations)}`);
        });

        it('T1-F3-03: zero className props on Title and Text', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if (MANTINE_TYPOGRAPHY_COMPONENTS.has(el.tagName) && el.props.className) {
                        violations.push(`${file.relPath}:${el.line} <${el.tagName} className>`);
                    }
                }
            }
            assert.equal(violations.length, 0, `className on Title/Text:${formatViolations(violations)}`);
        });

        it('T1-F3-04: zero hardcoded non-Poppins fontFamily declarations in UI style props or globals.css', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const ov of file.fontFamilyStyleOverrides) {
                    if (!/poppins|--mantine-font-family/i.test(ov.value)) {
                        violations.push(`${file.relPath}:${ov.line} fontFamily=${ov.value}`);
                    }
                }
            }
            for (const decl of snapshot.globalsCss.fontFamilyDecls) {
                if (!/poppins|--mantine-font-family/i.test(decl.value)) {
                    violations.push(`app/globals.css:${decl.line} font-family: ${decl.value}`);
                }
            }
            assert.equal(violations.length, 0, `Non-Poppins fontFamily overrides:${formatViolations(violations)}`);
        });

        it('T1-F3-05: Title elements use valid order and allowed semantic color tokens', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if (el.tagName !== 'Title') continue;
                    if (el.props.order?.kind === 'number' && (el.props.order.value < 1 || el.props.order.value > 6)) {
                        violations.push(`${file.relPath}:${el.line} <Title order={${el.props.order.value}}>`);
                    }
                }
                for (const hit of getDisallowedColorTokensInFile(file).filter((h) => h.tagName === 'Title')) {
                    violations.push(`${file.relPath}:${hit.line} <Title ${hit.propName}="${hit.token}">`);
                }
            }
            assert.equal(violations.length, 0, `Invalid Title order/color:${formatViolations(violations)}`);
        });
    });

    // =========================================================================
    // F4: Badges, Labels & Pills
    // =========================================================================
    describe('F4: Badges, Labels & Pills', () => {
        it('T1-F4-01: theme/components/feedback.ts configures Badge defaults (light, brand, md)', () => {
            const badge = snapshot.theme.componentDefaults.Badge;
            assert.equal(badge?.variant?.value, 'light');
            assert.equal(badge?.color?.value, 'brand');
            assert.equal(badge?.radius?.value, 'md');
        });

        it('T1-F4-02: zero raw HTML <label> elements across non-OG .tsx files', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const hit of getDisallowedRawTagsInFile(file)) {
                    if (hit.tag === 'label') {
                        violations.push(`${file.relPath}:${hit.line} <label>`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Raw <label> elements:${formatViolations(violations)}`);
        });

        it('T1-F4-03: all Badge components use only official semantic colors', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const hit of getDisallowedColorTokensInFile(file)) {
                    if (hit.tagName === 'Badge') {
                        violations.push(`${file.relPath}:${hit.line} <Badge ${hit.propName}="${hit.token}">`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Disallowed Badge colors:${formatViolations(violations)}`);
        });

        it('T1-F4-04: zero manual radius props on Badge or Pill', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if ((el.tagName === 'Badge' || el.tagName === 'Pill') && el.props.radius) {
                        violations.push(`${file.relPath}:${el.line} <${el.tagName} radius=${el.props.radius.text}>`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Manual radius on Badge/Pill:${formatViolations(violations)}`);
        });

        it('T1-F4-05: zero className props on Badge, Pill, and Input.Label', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if (MANTINE_BADGE_COMPONENTS.has(el.tagName) && el.props.className) {
                        violations.push(`${file.relPath}:${el.line} <${el.tagName} className>`);
                    }
                }
            }
            assert.equal(violations.length, 0, `className on Badge/Pill/Input.Label:${formatViolations(violations)}`);
        });
    });

    // =========================================================================
    // F5: Buttons & Icon Buttons
    // =========================================================================
    describe('F5: Buttons & Icon Buttons (Button, ActionIcon)', () => {
        it('T1-F5-01: theme/components/buttons.ts configures Button and ActionIcon defaults', () => {
            const btn = snapshot.theme.componentDefaults.Button;
            const icon = snapshot.theme.componentDefaults.ActionIcon;
            assert.equal(btn?.variant?.value, 'filled');
            assert.equal(btn?.color?.value, 'brand');
            assert.equal(btn?.fw?.value, 700);
            assert.equal(icon?.variant?.value, 'subtle');
            assert.equal(icon?.color?.value, 'brand');
        });

        it('T1-F5-02: zero raw <button> elements across non-OG .tsx files', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const hit of getDisallowedRawTagsInFile(file)) {
                    if (hit.tag === 'button') violations.push(`${file.relPath}:${hit.line} <button>`);
                }
            }
            assert.equal(violations.length, 0, `Raw <button> elements:${formatViolations(violations)}`);
        });

        it('T1-F5-03: zero manual radius props on Button, ActionIcon, CloseButton, UnstyledButton', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if (MANTINE_BUTTON_COMPONENTS.has(el.tagName) && el.props.radius) {
                        violations.push(`${file.relPath}:${el.line} <${el.tagName} radius=${el.props.radius.text}>`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Manual radius on buttons:${formatViolations(violations)}`);
        });

        it('T1-F5-04: zero className props on Button, ActionIcon, CloseButton, UnstyledButton', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if (MANTINE_BUTTON_COMPONENTS.has(el.tagName) && el.props.className) {
                        violations.push(`${file.relPath}:${el.line} <${el.tagName} className>`);
                    }
                }
            }
            assert.equal(violations.length, 0, `className on button components:${formatViolations(violations)}`);
        });

        it('T1-F5-05: Button and ActionIcon color props use only Brandguide tokens', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const hit of getDisallowedColorTokensInFile(file)) {
                    if (MANTINE_BUTTON_COMPONENTS.has(hit.tagName)) {
                        violations.push(`${file.relPath}:${hit.line} <${hit.tagName} ${hit.propName}="${hit.token}">`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Non-brand colors on Button/ActionIcon:${formatViolations(violations)}`);
        });
    });

    // =========================================================================
    // F6: Layout & Core Containers
    // =========================================================================
    describe('F6: Layout & Core Containers', () => {
        it('T1-F6-01: zero raw <div> and <section> tags in non-OG .tsx files', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const hit of getDisallowedRawTagsInFile(file)) {
                    if (hit.tag === 'div' || hit.tag === 'section') {
                        violations.push(`${file.relPath}:${hit.line} <${hit.tag}>`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Raw <div>/<section>:${formatViolations(violations)}`);
        });

        it('T1-F6-02: zero raw structural landmark tags (<header>, <footer>, <nav>, <main>, <aside>, <article>)', () => {
            const landmarks = new Set(['header', 'footer', 'nav', 'main', 'aside', 'article']);
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const hit of getDisallowedRawTagsInFile(file)) {
                    if (landmarks.has(hit.tag)) violations.push(`${file.relPath}:${hit.line} <${hit.tag}>`);
                }
            }
            assert.equal(violations.length, 0, `Raw structural landmark tags:${formatViolations(violations)}`);
        });

        it('T1-F6-03: zero raw list HTML tags (<ul>, <ol>, <li>) in non-OG .tsx files', () => {
            const lists = new Set(['ul', 'ol', 'li']);
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const hit of getDisallowedRawTagsInFile(file)) {
                    if (lists.has(hit.tag)) violations.push(`${file.relPath}:${hit.line} <${hit.tag}>`);
                }
            }
            assert.equal(violations.length, 0, `Raw list tags:${formatViolations(violations)}`);
        });

        it('T1-F6-04: zero raw table HTML tags (<table>, <thead>, <tbody>, <tfoot>, <tr>, <th>, <td>)', () => {
            const tables = new Set(['table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td']);
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const hit of getDisallowedRawTagsInFile(file)) {
                    if (tables.has(hit.tag)) violations.push(`${file.relPath}:${hit.line} <${hit.tag}>`);
                }
            }
            assert.equal(violations.length, 0, `Raw table tags:${formatViolations(violations)}`);
        });

        it('T1-F6-05: zero className props on Mantine layout containers', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if (MANTINE_LAYOUT_COMPONENTS.has(el.tagName) && el.props.className) {
                        violations.push(`${file.relPath}:${el.line} <${el.tagName} className>`);
                    }
                }
            }
            assert.equal(violations.length, 0, `className on layout containers:${formatViolations(violations)}`);
        });
    });

    // =========================================================================
    // F7: Forms, Inputs & Controls
    // =========================================================================
    describe('F7: Forms, Inputs & Controls', () => {
        it('T1-F7-01: theme/components/inputs.ts configures Switch, Checkbox, Radio, SegmentedControl', () => {
            const defs = snapshot.theme.componentDefaults;
            for (const name of ['Switch', 'Checkbox', 'Radio', 'SegmentedControl']) {
                assert.equal(defs[name]?.color?.value, 'brand', `${name} default color must be brand`);
            }
        });

        it('T1-F7-02: zero raw <select>, <option>, and <textarea> tags in non-OG .tsx files', () => {
            const tags = new Set(['select', 'option', 'textarea']);
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const hit of getDisallowedRawTagsInFile(file)) {
                    if (tags.has(hit.tag)) violations.push(`${file.relPath}:${hit.line} <${hit.tag}>`);
                }
            }
            assert.equal(violations.length, 0, `Raw <select>/<option>/<textarea>:${formatViolations(violations)}`);
        });

        it('T1-F7-03: zero raw <form> and <input> tags in non-OG .tsx files', () => {
            const tags = new Set(['form', 'input']);
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const hit of getDisallowedRawTagsInFile(file)) {
                    if (tags.has(hit.tag)) violations.push(`${file.relPath}:${hit.line} <${hit.tag}>`);
                }
            }
            assert.equal(violations.length, 0, `Raw <form>/<input>:${formatViolations(violations)}`);
        });

        it('T1-F7-04: zero className props on all Mantine input controls', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if ((MANTINE_INPUT_COMPONENTS.has(el.tagName) || MANTINE_INPUT_COMPONENTS.has(el.baseTag)) && el.props.className) {
                        violations.push(`${file.relPath}:${el.line} <${el.tagName} className>`);
                    }
                }
            }
            assert.equal(violations.length, 0, `className on Mantine input controls:${formatViolations(violations)}`);
        });

        it('T1-F7-05: zero manual radius props on all Mantine input controls', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if (
                        (MANTINE_INPUT_COMPONENTS.has(el.tagName) || MANTINE_INPUT_COMPONENTS.has(el.baseTag)) &&
                        MANTINE_RADIUS_COMPONENTS.has(el.baseTag) &&
                        el.props.radius
                    ) {
                        violations.push(`${file.relPath}:${el.line} <${el.tagName} radius=${el.props.radius.text}>`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Manual radius on input controls:${formatViolations(violations)}`);
        });
    });

    // =========================================================================
    // F8: Navigation, Links & Feedback
    // =========================================================================
    describe('F8: Navigation, Links & Feedback', () => {
        it('T1-F8-01: theme/components/navigation.ts and feedback.ts configure Tabs, NavLink, Alert, ThemeIcon, Loader, Progress', () => {
            const d = snapshot.theme.componentDefaults;
            assert.equal(d.Tabs?.color?.value, 'brand');
            assert.equal(d.Tabs?.variant?.value, 'pills');
            assert.equal(d.NavLink?.color?.value, 'brand');
            assert.equal(d.Alert?.variant?.value, 'light');
            assert.equal(d.Alert?.color?.value, 'brand');
            assert.equal(d.ThemeIcon?.variant?.value, 'light');
            assert.equal(d.ThemeIcon?.color?.value, 'brand');
            assert.equal(d.Loader?.color?.value, 'brand');
            assert.equal(d.Progress?.color?.value, 'brand');
            assert.equal(d.Progress?.radius?.value, 'md');
        });

        it('T1-F8-02: zero raw HTML <a> tags across non-OG .tsx files', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const hit of getDisallowedRawTagsInFile(file)) {
                    if (hit.tag === 'a') violations.push(`${file.relPath}:${hit.line} <a>`);
                }
            }
            assert.equal(violations.length, 0, `Raw <a> tags:${formatViolations(violations)}`);
        });

        it('T1-F8-03: zero <Suspense> usage across all .tsx files', () => {
            const violations = [];
            for (const file of snapshot.tsxFiles) {
                for (const el of file.jsxElements) {
                    if (el.tagName === 'Suspense') violations.push(`${file.relPath}:${el.line} <Suspense>`);
                }
            }
            assert.equal(violations.length, 0, `Forbidden <Suspense> usage:${formatViolations(violations)}`);
        });

        it('T1-F8-04: zero className props on Anchor, Link, ActiveLink, Tabs, NavLink, Alert, ThemeIcon, Modal, Drawer, Loader, Progress, Menu, Popover, Tooltip', () => {
            const targets = new Set([...MANTINE_NAV_FEEDBACK_COMPONENTS, 'Link', 'ActiveLink']);
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if ((targets.has(el.tagName) || targets.has(el.baseTag)) && el.props.className) {
                        violations.push(`${file.relPath}:${el.line} <${el.tagName} className>`);
                    }
                }
            }
            assert.equal(violations.length, 0, `className on navigation/feedback components:${formatViolations(violations)}`);
        });

        it('T1-F8-05: zero manual radius props on Alert, ThemeIcon, Modal, Drawer, Tabs, Progress', () => {
            const targets = new Set(['Alert', 'ThemeIcon', 'Modal', 'Drawer', 'Tabs', 'Progress']);
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if (targets.has(el.tagName) && el.props.radius) {
                        violations.push(`${file.relPath}:${el.line} <${el.tagName} radius=${el.props.radius.text}>`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Manual radius on feedback/nav components:${formatViolations(violations)}`);
        });
    });

    // =========================================================================
    // F9: Logos, Icons & Media
    // =========================================================================
    describe('F9: Logos, Icons & Media', () => {
        it('T1-F9-01: BRAND_CONFIG paths all resolve to existing files in apps/frontend/public/', () => {
            const cfg = snapshot.theme.brandConfig;
            const requiredKeys = ['logoLightMode', 'logoDarkMode', 'logoFallbackLight', 'logoFallbackDark'];
            if (Object.hasOwn(cfg, 'logoYellow')) requiredKeys.push('logoYellow');
            for (const key of requiredKeys) {
                const relUrl = cfg[key];
                assert.ok(relUrl && relUrl.startsWith('/'), `BRAND_CONFIG.${key} missing or invalid`);
                const abs = path.join(FRONTEND_DIR, 'public', relUrl.replace(/^\//, ''));
                assert.ok(fs.existsSync(abs), `BRAND_CONFIG.${key} target does not exist: ${abs}`);
            }
        });

        it('T1-F9-02: zero className props on lucide-react icons and social SVG components', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if ((el.isLucide || SOCIAL_ICON_TAGS.has(el.tagName)) && el.props.className) {
                        violations.push(`${file.relPath}:${el.line} <${el.tagName} className=${el.props.className.text}>`);
                    }
                }
            }
            assert.equal(violations.length, 0, `className on icon components:${formatViolations(violations)}`);
        });

        it('T1-F9-03: zero raw <svg>/<path>/<polyline>/<circle>/<rect>/<line> tags outside OG files and shared/icons/social.tsx', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                if (file.relPath === 'shared/icons/social.tsx') continue;
                for (const hit of getDisallowedRawTagsInFile(file)) {
                    if (RAW_SVG_TAGS.has(hit.tag)) {
                        violations.push(`${file.relPath}:${hit.line} <${hit.tag}>`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Raw SVG markup outside OG/social.tsx:${formatViolations(violations)}`);
        });

        it('T1-F9-04: FallbackLogo.tsx pairs logoFallbackLight (dark:hidden) with logoFallbackDark (hidden dark:block)', () => {
            const fallback = snapshot.filesByRel.get('components/ui/media/FallbackLogo.tsx');
            assert.ok(fallback, 'Missing FallbackLogo.tsx');
            const images = fallback.jsxElements.filter((el) => el.tagName === 'Image');
            assert.equal(images.length, 2, 'FallbackLogo must render light & dark Image pair');
            assert.ok(images.some((i) => i.props.src?.text.includes('logoFallbackLight') && i.props.className?.text.includes('dark:hidden')));
            assert.ok(images.some((i) => i.props.src?.text.includes('logoFallbackDark') && i.props.className?.text.includes('dark:block')));
        });

        it('T1-F9-05: zero raw <img> elements outside Satori OG files', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const hit of getDisallowedRawTagsInFile(file)) {
                    if (hit.tag === 'img') violations.push(`${file.relPath}:${hit.line} <img>`);
                }
            }
            assert.equal(violations.length, 0, `Raw <img> tags:${formatViolations(violations)}`);
        });
    });

    // =========================================================================
    // F10: Scoped Exceptions & server/ Non-UI Verification
    // =========================================================================
    describe('F10: Scoped Exceptions & server/ Non-UI Verification', () => {
        it('T1-F10-01: server/ contains zero .tsx files, zero JSX syntax, and zero @mantine/core UI imports', () => {
            const violations = [];
            assert.ok(snapshot.serverFiles.length >= 100, `Expected >=100 server files, got ${snapshot.serverFiles.length}`);
            for (const file of snapshot.serverFiles) {
                if (file.ext === '.tsx') violations.push(`${file.relPath}: .tsx file in server/`);
                if (file.hasJsx) violations.push(`${file.relPath}: JSX nodes in server/`);
                for (const imp of file.imports) {
                    if (imp.from.startsWith('@mantine/')) violations.push(`${file.relPath}:${imp.line} imports ${imp.from}`);
                }
            }
            assert.equal(violations.length, 0, `UI leaks in server/:${formatViolations(violations)}`);
        });

        it('T1-F10-02: Satori OG files are the only HTML/img OG generators and conform to BRAND_COLORS', () => {
            assert.ok(snapshot.ogFiles.length >= 10, `Expected OG files, found ${snapshot.ogFiles.length}`);
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
            }
            assert.equal(violations.length, 0, `Satori OG palette violations:${formatViolations(violations)}`);
        });

        it('T1-F10-03: app/layout.tsx is the ONLY file allowed to render <html> and <body>', () => {
            const violations = [];
            for (const file of snapshot.tsxFiles) {
                if (file.relPath === 'app/layout.tsx') continue;
                for (const el of file.jsxElements) {
                    if (el.isIdentifier && (el.tagName === 'html' || el.tagName === 'body')) {
                        violations.push(`${file.relPath}:${el.line} <${el.tagName}>`);
                    }
                }
            }
            const layout = snapshot.filesByRel.get('app/layout.tsx');
            assert.ok(layout?.jsxElements.some((el) => el.tagName === 'html'));
            assert.ok(layout?.jsxElements.some((el) => el.tagName === 'body'));
            assert.equal(violations.length, 0, `Unexpected <html>/<body>:${formatViolations(violations)}`);
        });

        it('T1-F10-04: SafeMarkdown.tsx uses Mantine <Typography> without raw HTML <div className="prose">', () => {
            const md = snapshot.filesByRel.get('components/ui/security/SafeMarkdown.tsx');
            assert.ok(md, 'Missing SafeMarkdown.tsx');
            const typo = md.jsxElements.find((el) => el.tagName === 'Typography');
            assert.ok(typo, 'SafeMarkdown.tsx must render <Typography>');
            assert.equal(typo.props.className, undefined, 'Typography must not pass className');
            assert.equal(getDisallowedRawTagsInFile(md).length, 0);
        });

        it('T1-F10-05: <canvas> and <video> appear ONLY in documented DOM-API primitive files', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                const allowed = DOCUMENTED_DOM_PRIMITIVE_ALLOWLIST.get(file.relPath) || new Set();
                for (const el of file.jsxElements) {
                    if (el.isIdentifier && (el.tagName === 'canvas' || el.tagName === 'video') && !allowed.has(el.tagName)) {
                        violations.push(`${file.relPath}:${el.line} undocumented <${el.tagName}>`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Undocumented DOM primitives:${formatViolations(violations)}`);
        });
    });

    // =========================================================================
    // F11: ESLint Hardening & Full Repository Quality Gate
    // =========================================================================
    describe('F11: ESLint Hardening & Quality Gate', () => {
        it('T1-F11-01: zero ESLint disable comments anywhere in apps/frontend/src/**', () => {
            const violations = [];
            for (const file of snapshot.files) {
                for (const c of file.suppressComments.filter((s) => s.kind !== '@ts-ignore' && s.kind !== '@ts-expect-error' && s.kind !== '@ts-nocheck')) {
                    violations.push(`${file.relPath}:${c.line} ${c.kind}`);
                }
            }
            assert.equal(violations.length, 0, `Suppress comments found:${formatViolations(violations)}`);
        });

        it('T1-F11-02: zero direct console.* calls outside server/utils/logger.ts and log-sanitizer.ts', () => {
            const allowedConsoleFiles = new Set(['server/utils/logger.ts', 'server/utils/log-sanitizer.ts']);
            const violations = [];
            for (const file of snapshot.files) {
                if (allowedConsoleFiles.has(file.relPath)) continue;
                for (const c of file.consoleCalls) {
                    violations.push(`${file.relPath}:${c.line} console.${c.method}()`);
                }
            }
            assert.equal(violations.length, 0, `Forbidden console.* calls:${formatViolations(violations)}`);
        });

        it('T1-F11-03: eslint.config.mjs bans extended raw HTML, list, table, form, svg, and style tags', () => {
            const requiredTags = [
                'header', 'footer', 'nav', 'main', 'aside', 'article',
                'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
                'label', 'option', 'input', 'form', 'a', 'hr',
                'strong', 'b', 'em', 'i', 'u', 'br', 'wbr', 'style', 'svg', 'path', 'polyline',
            ];
            const missing = requiredTags.filter((tag) => !new RegExp(`\\b${tag}\\b`).test(snapshot.eslintConfigText));
            assert.equal(missing.length, 0, `eslint.config.mjs missing raw HTML tag bans: ${missing.join(', ')}`);
        });

        it('T1-F11-04: eslint.config.mjs bans className on extended Mantine components, Link, and icons', () => {
            const requiredNames = [
                'UnstyledButton', 'CloseButton', 'PasswordInput', 'FileInput', 'MultiSelect',
                'SegmentedControl', 'Table', 'List', 'Menu', 'Popover', 'Tooltip',
                'Loader', 'Progress', 'ScrollArea', 'Link',
            ];
            const missing = requiredNames.filter((name) => !new RegExp(`\\b${name}\\b`).test(snapshot.eslintConfigText));
            assert.equal(missing.length, 0, `eslint.config.mjs missing className bans: ${missing.join(', ')}`);
        });

        it('T1-F11-05: eslint.config.mjs bans BOTH literal and numeric/expression radius props', () => {
            assert.ok(
                !snapshot.eslintConfigText.includes("JSXAttribute[name.name='radius'][value.type='Literal']"),
                "eslint.config.mjs still restricts radius ban to [value.type='Literal'] (misses radius={0})",
            );
            assert.ok(
                snapshot.eslintConfigText.includes("JSXAttribute[name.name='radius']"),
                "eslint.config.mjs must include JSXAttribute[name.name='radius']",
            );
        });
    });
});

// Re-export check to keep ALL_MANTINE_BAN_CLASSNAME referenced if needed
void ALL_MANTINE_BAN_CLASSNAME;
