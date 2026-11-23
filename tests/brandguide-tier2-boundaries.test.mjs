import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import {
    DISALLOWED_MANTINE_COLOR_TOKENS,
    DOCUMENTED_DOM_PRIMITIVE_ALLOWLIST,
    FRONTEND_DIR,
    MANTINE_INPUT_COMPONENTS,
    MANTINE_SURFACE_COMPONENTS,
    OFFICIAL_HEX_SET,
    PERMITTED_MEDIA_UTILITY_RE,
    REPO_ROOT,
    formatViolations,
    getAuditSnapshot,
    getDisallowedColorTokensInFile,
    getDisallowedRawTagsInFile,
} from './brandguide/compliance-engine.mjs';

const require = createRequire(new URL('../apps/frontend/package.json', import.meta.url));
const snapshot = getAuditSnapshot();

describe('Brandguide Tier 2: Boundary & Corner Cases (F1-F11, 55 tests)', () => {
    // =========================================================================
    // F1: Palette Boundaries
    // =========================================================================
    describe('F1: Palette Boundaries', () => {
        it('T2-F1-01: color helpers and ternary props never emit unmapped Mantine color names', () => {
            const violations = [];
            for (const file of snapshot.uiFiles) {
                for (const hit of getDisallowedColorTokensInFile(file)) {
                    violations.push(`${file.relPath}:${hit.line} ${hit.propName}="${hit.token}"`);
                }
            }
            assert.equal(violations.length, 0, `Unmapped Mantine colors in props/helpers:${formatViolations(violations)}`);
        });

        it('T2-F1-02: zero rgb()/rgba()/hsl()/oklch() literals outside theme/ and globals.css', () => {
            const violations = [];
            for (const file of [...snapshot.uiFiles, ...snapshot.ogFiles]) {
                for (const fc of file.funcColorLiterals) {
                    violations.push(`${file.relPath}:${fc.line} ${fc.value}`);
                }
            }
            assert.equal(violations.length, 0, `Raw rgb()/rgba()/hsl()/oklch() outside theme & CSS:${formatViolations(violations)}`);
        });

        it('T2-F1-03: globals.css @theme declares --color-*: initial and zero raw hex/rgb/rgba', () => {
            assert.ok(snapshot.globalsCss.hasThemeBlock, 'globals.css missing @theme block');
            assert.ok(snapshot.globalsCss.hasColorWildcardInitial, 'globals.css @theme must wipe default Tailwind palette with --color-*: initial');
            assert.equal(snapshot.globalsCss.hexLiterals.length, 0, `Hex literals in globals.css:${formatViolations(snapshot.globalsCss.hexLiterals.map((h) => `L${h.line}: ${h.hex}`))}`);
            assert.equal(snapshot.globalsCss.funcColorLiterals.length, 0, `rgb/rgba in globals.css:${formatViolations(snapshot.globalsCss.funcColorLiterals.map((f) => `L${f.line}: ${f.value}`))}`);
        });

        it('T2-F1-04: Satori OG generators import BRAND_COLORS from theme and avoid duplicate BRAND_COLORS or legacy hexes', () => {
            const violations = [];
            for (const file of snapshot.ogFiles) {
                if (file.relPath === 'lib/utils/og-utils.tsx' && /export\s+const\s+BRAND_COLORS\s*=/.test(file.sourceText)) {
                    violations.push(`${file.relPath}: defines duplicate local BRAND_COLORS`);
                }
                const importsBrand = file.imports.some((i) => i.from.includes('theme') && i.specifiers.includes('BRAND_COLORS'));
                if (file.hexLiterals.length > 0 && !importsBrand) {
                    violations.push(`${file.relPath}:${file.hexLiterals[0].line} missing BRAND_COLORS import from @/lib/config/theme`);
                }
                for (const h of file.hexLiterals) {
                    if (!OFFICIAL_HEX_SET.has(h.hex)) {
                        violations.push(`${file.relPath}:${h.line} off-brand hex ${h.hex}`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Satori OG BRAND_COLORS drift:${formatViolations(violations)}`);
        });

        it('T2-F1-05: zero Tailwind arbitrary color or default palette classes in className', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const hit of file.tailwindColorClasses) {
                    violations.push(`${file.relPath}:${hit.line} <${hit.tagName} className="... ${hit.token}">`);
                }
            }
            assert.equal(violations.length, 0, `Tailwind color utilities found:${formatViolations(violations)}`);
        });
    });

    // =========================================================================
    // F2: Surface Boundaries
    // =========================================================================
    describe('F2: Surface Boundaries', () => {
        it('T2-F2-01: zero non-circular style={{ borderRadius }} overrides on Card, Paper, Box, Center', () => {
            const surfaceTags = new Set(['Card', 'Paper', 'Box', 'Center']);
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const ov of file.styleVisualOverrides) {
                    if (ov.prop !== 'borderRadius' || !surfaceTags.has(ov.tagName)) continue;
                    if (/9999px|50%|var\(--mantine-radius-/.test(ov.value)) continue;
                    violations.push(`${file.relPath}:${ov.line} <${ov.tagName} style={{ borderRadius: ${ov.value} }}>`);
                }
            }
            assert.equal(violations.length, 0, `Ad-hoc borderRadius on surfaces:${formatViolations(violations)}`);
        });

        it('T2-F2-02: numeric radius={0} and expression radius={...} caught on surface components', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if (MANTINE_SURFACE_COMPONENTS.has(el.tagName) && el.props.radius && el.props.radius.kind !== 'string') {
                        violations.push(`${file.relPath}:${el.line} <${el.tagName} radius={${el.props.radius.text}}>`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Numeric/expression radius on surfaces:${formatViolations(violations)}`);
        });

        it('T2-F2-03: inline style background/backgroundColor on surfaces never uses raw hex or rgb/rgba', () => {
            const surfaceTags = new Set(['Card', 'Paper', 'Container', 'Box', 'Center', 'Stack', 'Group']);
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const ov of file.styleVisualOverrides) {
                    if (!surfaceTags.has(ov.tagName)) continue;
                    if ((ov.prop === 'background' || ov.prop === 'backgroundColor') && (/#[0-9a-fA-F]{3,8}|\brgba?\s*\(/i.test(ov.value))) {
                        violations.push(`${file.relPath}:${ov.line} <${ov.tagName} style={{ ${ov.prop}: ${ov.value} }}>`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Raw color inline surface style:${formatViolations(violations)}`);
        });

        it('T2-F2-04: globals.css interactive card selectors use only theme CSS variables', () => {
            const css = snapshot.globalsCss.stripped;
            assert.match(css, /a:hover \.mantine-Card-root/);
            assert.match(css, /a:hover \.mantine-Paper-root/);
            assert.match(css, /--card-hover-transform/);
            assert.match(css, /--surface-subtle/);
        });

        it('T2-F2-05: app/layout.tsx viewport.themeColor uses BRAND_COLORS tokens', () => {
            const layout = snapshot.filesByRel.get('app/layout.tsx');
            assert.ok(layout, 'Missing app/layout.tsx');
            assert.match(layout.sourceText, /BRAND_COLORS\.lightSurface/);
            assert.match(layout.sourceText, /BRAND_COLORS\.darkBase/);
            assert.equal(layout.hexLiterals.length, 0, 'layout.tsx must not hardcode hex literals');
        });
    });

    // =========================================================================
    // F3: Typography Boundaries
    // =========================================================================
    describe('F3: Typography Boundaries', () => {
        it('T2-F3-01: inline semantic HTML tags missed by legacy ESLint (strong, em, u, br, wbr) are zero', () => {
            const inlineTags = new Set(['strong', 'em', 'u', 'br', 'wbr', 'b', 'i']);
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const hit of getDisallowedRawTagsInFile(file)) {
                    if (inlineTags.has(hit.tag)) violations.push(`${file.relPath}:${hit.line} <${hit.tag}>`);
                }
            }
            assert.equal(violations.length, 0, `Inline semantic HTML tags:${formatViolations(violations)}`);
        });

        it('T2-F3-02: Text and Title avoid arbitrary raw pixel size/fz literals (10px, 11px, fz={13}, etc.)', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if (el.tagName !== 'Text' && el.tagName !== 'Title') continue;
                    for (const pName of ['size', 'fz']) {
                        const p = el.props[pName];
                        if (!p) continue;
                        if (p.kind === 'string' && /^\d+(?:\.\d+)?px$/i.test(p.value)) {
                            violations.push(`${file.relPath}:${el.line} <${el.tagName} ${pName}="${p.value}">`);
                        } else if (p.kind === 'number') {
                            violations.push(`${file.relPath}:${el.line} <${el.tagName} ${pName}={${p.value}}>`);
                        }
                    }
                }
            }
            assert.equal(violations.length, 0, `Raw pixel/numeric Text/Title sizes:${formatViolations(violations)}`);
        });

        it('T2-F3-03: Title never overrides fw away from Poppins Black (900)', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if (el.tagName !== 'Title' || !el.props.fw) continue;
                    const fw = el.props.fw;
                    if ((fw.kind === 'number' && fw.value !== 900) || (fw.kind === 'string' && fw.value !== '900')) {
                        violations.push(`${file.relPath}:${el.line} <Title fw={${fw.text}}>`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Title fw override != 900:${formatViolations(violations)}`);
        });

        it('T2-F3-04: zero Tailwind typography classes outside exempted layout.tsx <body>', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const hit of file.tailwindTypographyClasses) {
                    if (file.relPath === 'app/layout.tsx' && hit.tagName === 'body') continue;
                    violations.push(`${file.relPath}:${hit.line} <${hit.tagName} className="... ${hit.token}">`);
                }
            }
            assert.equal(violations.length, 0, `Tailwind typography utilities:${formatViolations(violations)}`);
        });

        it('T2-F3-05: Text never bypasses raw-tag bans via component="div" or component="li"', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if (el.tagName === 'Text' && (el.props.component?.value === 'div' || el.props.component?.value === 'li')) {
                        violations.push(`${file.relPath}:${el.line} <Text component="${el.props.component.value}">`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Text component="div|li" bypass:${formatViolations(violations)}`);
        });
    });

    // =========================================================================
    // F4: Badge & Label Boundaries
    // =========================================================================
    describe('F4: Badge & Label Boundaries', () => {
        it('T2-F4-01: Badge never overrides tt="none" or tt="lowercase" or inline borderRadius', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if (el.tagName !== 'Badge') continue;
                    if (el.props.tt?.value === 'none' || el.props.tt?.value === 'lowercase') {
                        violations.push(`${file.relPath}:${el.line} <Badge tt="${el.props.tt.value}">`);
                    }
                    if (el.props.style?.entries?.borderRadius) {
                        violations.push(`${file.relPath}:${el.line} <Badge style={{ borderRadius }}>`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Badge tt/borderRadius drift:${formatViolations(violations)}`);
        });

        it('T2-F4-02: zero pseudo-pill raw <span>/<div> elements with rounded-full/pill className', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if ((el.tagName === 'span' || el.tagName === 'div') && el.props.className) {
                        violations.push(`${file.relPath}:${el.line} <${el.tagName} className=${el.props.className.text}>`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Pseudo-pill raw elements:${formatViolations(violations)}`);
        });

        it('T2-F4-03: dynamic Badge color expressions never evaluate to unmapped Mantine colors', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if (el.tagName !== 'Badge' || !el.props.color) continue;
                    for (const str of el.props.color.stringLiterals || []) {
                        if (DISALLOWED_MANTINE_COLOR_TOKENS.has(str) || str === 'dark') {
                            violations.push(`${file.relPath}:${el.line} <Badge color={... "${str}" ...}>`);
                        }
                    }
                }
            }
            assert.equal(violations.length, 0, `Dynamic Badge unmapped colors:${formatViolations(violations)}`);
        });

        it('T2-F4-04: eyebrow/kicker Text (tt="uppercase") uses Mantine token sizes (never px/numeric)', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if (el.tagName !== 'Text' || el.props.tt?.value !== 'uppercase') continue;
                    const sizeVal = el.props.size || el.props.fz;
                    if (sizeVal && (sizeVal.kind === 'number' || (sizeVal.kind === 'string' && /px$/i.test(sizeVal.value)))) {
                        violations.push(`${file.relPath}:${el.line} <Text tt="uppercase" size=${sizeVal.text}>`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Non-token eyebrow Text size:${formatViolations(violations)}`);
        });

        it('T2-F4-05: Badge never injects raw hex/rgba via styles or classNames', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if (el.tagName !== 'Badge') continue;
                    for (const propName of ['styles', 'classNames']) {
                        const p = el.props[propName];
                        if (!p) continue;
                        if (/#[0-9a-fA-F]{3,8}|\brgba?\s*\(/i.test(p.text)) {
                            violations.push(`${file.relPath}:${el.line} <Badge ${propName}={...}>`);
                        }
                    }
                }
            }
            assert.equal(violations.length, 0, `Badge styles/classNames raw color overrides:${formatViolations(violations)}`);
        });
    });

    // =========================================================================
    // F5: Button Boundaries
    // =========================================================================
    describe('F5: Button Boundaries', () => {
        it('T2-F5-01: Button avoids redundant default props (variant="filled", color="brand", fw={700}) and fw != 700', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if (el.tagName !== 'Button') continue;
                    if (el.props.variant?.value === 'filled') violations.push(`${file.relPath}:${el.line} redundant variant="filled"`);
                    if (el.props.color?.value === 'brand') violations.push(`${file.relPath}:${el.line} redundant color="brand"`);
                    if (el.props.fw?.value === 700) violations.push(`${file.relPath}:${el.line} redundant fw={700}`);
                    if (el.props.fw && el.props.fw.kind === 'number' && el.props.fw.value !== 700) {
                        violations.push(`${file.relPath}:${el.line} Button fw={${el.props.fw.value}} != 700`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Button default redundancy / fw drift:${formatViolations(violations)}`);
        });

        it('T2-F5-02: zero style borderRadius or raw hex/rgba background on Button or ActionIcon', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const ov of file.styleVisualOverrides) {
                    if (ov.tagName !== 'Button' && ov.tagName !== 'ActionIcon') continue;
                    if (ov.prop === 'borderRadius' || /#[0-9a-fA-F]{3,8}|\brgba?\s*\(/i.test(ov.value)) {
                        violations.push(`${file.relPath}:${ov.line} <${ov.tagName} style={{ ${ov.prop}: ${ov.value} }}>`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Inline style visual overrides on Button/ActionIcon:${formatViolations(violations)}`);
        });

        it('T2-F5-03: ActionIcon and icon-only Button include aria-label, title, or VisuallyHidden', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if (el.tagName !== 'ActionIcon') continue;
                    if (el.hasSpread) continue;
                    const hasA11y =
                        Boolean(el.props['aria-label']) ||
                        Boolean(el.props['aria-labelledby']) ||
                        Boolean(el.props.title) ||
                        el.hasVisuallyHiddenChild;
                    if (!hasA11y) {
                        violations.push(`${file.relPath}:${el.line} <ActionIcon> missing aria-label/title`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Icon-only ActionIcon missing accessible label:${formatViolations(violations)}`);
        });

        it('T2-F5-04: globals.css button hover/active & responsive only-child rules use theme CSS vars', () => {
            const css = snapshot.globalsCss.stripped;
            assert.match(css, /\.mantine-Button-root:hover:not\(/);
            assert.match(css, /--button-hover-transform/);
            assert.match(css, /--button-active-transform/);
            assert.match(css, /\.mantine-Button-label:has\(> \.mantine-visible-from-sm:only-child\)/);
        });

        it('T2-F5-05: Button and ActionIcon dynamic color expressions never emit unmapped colors', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if ((el.tagName !== 'Button' && el.tagName !== 'ActionIcon') || !el.props.color) continue;
                    for (const str of el.props.color.stringLiterals || []) {
                        if (DISALLOWED_MANTINE_COLOR_TOKENS.has(str) || str === 'dark') {
                            violations.push(`${file.relPath}:${el.line} <${el.tagName} color={... "${str}" ...}>`);
                        }
                    }
                }
            }
            assert.equal(violations.length, 0, `Unmapped Button/ActionIcon colors:${formatViolations(violations)}`);
        });
    });

    // =========================================================================
    // F6: Layout Boundaries
    // =========================================================================
    describe('F6: Layout Boundaries', () => {
        it('T2-F6-01: zero <hr>, <details>, <summary>, <figure>, <figcaption> tags', () => {
            const tags = new Set(['hr', 'details', 'summary', 'figure', 'figcaption']);
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const hit of getDisallowedRawTagsInFile(file)) {
                    if (tags.has(hit.tag)) violations.push(`${file.relPath}:${hit.line} <${hit.tag}>`);
                }
            }
            assert.equal(violations.length, 0, `Disallowed structural HTML tags:${formatViolations(violations)}`);
        });

        it('T2-F6-02: Box component="..." is never used with non-landmark raw UI tags (div, span, p, button)', () => {
            const nonLandmarks = new Set(['div', 'span', 'p', 'button']);
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if (el.tagName === 'Box' && nonLandmarks.has(el.props.component?.value)) {
                        violations.push(`${file.relPath}:${el.line} <Box component="${el.props.component.value}">`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Box component="..." abuse:${formatViolations(violations)}`);
        });

        it('T2-F6-03: ScrollArea never receives className or radius overrides', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if (el.tagName === 'ScrollArea' && (el.props.className || el.props.radius)) {
                        violations.push(`${file.relPath}:${el.line} <ScrollArea ${el.props.className ? 'className' : 'radius'}>`);
                    }
                }
            }
            assert.equal(violations.length, 0, `ScrollArea overrides:${formatViolations(violations)}`);
        });

        it('T2-F6-04: zero nested <Box component="main"> landmarks outside app/layout.tsx', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                if (file.relPath === 'app/layout.tsx') continue;
                for (const el of file.jsxElements) {
                    if (el.props.component?.value === 'main') {
                        violations.push(`${file.relPath}:${el.line} <${el.tagName} component="main">`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Duplicate nested <main> landmarks:${formatViolations(violations)}`);
        });

        it('T2-F6-05: layout.tsx wraps <Box component="main"> inside <MantineAppProvider> with defaultColorScheme="dark"', () => {
            const layout = snapshot.filesByRel.get('app/layout.tsx');
            const provider = snapshot.filesByRel.get('components/providers/MantineAppProvider.tsx');
            assert.ok(layout && provider);
            assert.ok(layout.jsxElements.some((el) => el.tagName === 'MantineAppProvider'));
            assert.ok(layout.jsxElements.some((el) => el.tagName === 'Box' && el.props.component?.value === 'main'));
            const mp = provider.jsxElements.find((el) => el.tagName === 'MantineProvider');
            assert.equal(mp?.props.defaultColorScheme?.value, 'dark');
        });
    });

    // =========================================================================
    // F7: Form Boundaries
    // =========================================================================
    describe('F7: Form Boundaries', () => {
        it('T2-F7-01: zero hidden/honeypot/file/checkbox raw <input> tags bypassing Mantine', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if (el.isIdentifier && el.tagName === 'input') {
                        const t = el.props.type?.value || 'text';
                        violations.push(`${file.relPath}:${el.line} <input type="${t}">`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Raw <input> elements:${formatViolations(violations)}`);
        });

        it('T2-F7-02: Mantine input color props use only Brandguide tokens', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const hit of getDisallowedColorTokensInFile(file)) {
                    if (MANTINE_INPUT_COMPONENTS.has(hit.tagName)) {
                        violations.push(`${file.relPath}:${hit.line} <${hit.tagName} ${hit.propName}="${hit.token}">`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Disallowed input color props:${formatViolations(violations)}`);
        });

        it('T2-F7-03: shared/ui form primitives (MarkdownEditor, PhoneInput, TagInput) use Mantine cleanly', () => {
            const targets = ['shared/ui/MarkdownEditor.tsx', 'shared/ui/PhoneInput.tsx', 'shared/ui/TagInput.tsx'];
            const violations = [];
            for (const rel of targets) {
                const file = snapshot.filesByRel.get(rel);
                if (!file) continue;
                for (const hit of getDisallowedRawTagsInFile(file)) {
                    violations.push(`${rel}:${hit.line} <${hit.tag}>`);
                }
                for (const el of file.jsxElements) {
                    if (el.isMantine && el.props.className) violations.push(`${rel}:${el.line} <${el.tagName} className>`);
                }
            }
            assert.equal(violations.length, 0, `shared/ui form primitive violations:${formatViolations(violations)}`);
        });

        it('T2-F7-04: Select and NativeSelect never pass raw <option> children instead of data prop', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if ((el.tagName === 'Select' || el.tagName === 'NativeSelect') && el.childTags.includes('option')) {
                        violations.push(`${file.relPath}:${el.line} <${el.tagName}> contains raw <option>`);
                    }
                }
            }
            assert.equal(violations.length, 0, `<option> inside Select/NativeSelect:${formatViolations(violations)}`);
        });

        it('T2-F7-05: zero styles/classNames on inputs injecting raw hex or rgba()', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if (!MANTINE_INPUT_COMPONENTS.has(el.baseTag)) continue;
                    for (const propName of ['styles', 'classNames']) {
                        const p = el.props[propName];
                        if (p && /#[0-9a-fA-F]{3,8}|\brgba?\s*\(/i.test(p.text)) {
                            violations.push(`${file.relPath}:${el.line} <${el.tagName} ${propName}>`);
                        }
                    }
                }
            }
            assert.equal(violations.length, 0, `Input styles/classNames raw colors:${formatViolations(violations)}`);
        });
    });

    // =========================================================================
    // F8: Navigation & Feedback Boundaries
    // =========================================================================
    describe('F8: Navigation & Feedback Boundaries', () => {
        it('T2-F8-01: Alert, ThemeIcon, Loader, Progress never receive unmapped color tokens', () => {
            const targets = new Set(['Alert', 'ThemeIcon', 'Loader', 'Progress']);
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const hit of getDisallowedColorTokensInFile(file)) {
                    if (targets.has(hit.tagName)) violations.push(`${file.relPath}:${hit.line} <${hit.tagName} ${hit.propName}="${hit.token}">`);
                }
            }
            assert.equal(violations.length, 0, `Feedback component unmapped colors:${formatViolations(violations)}`);
        });

        it('T2-F8-02: Link, ActiveLink, Tabs, and NavLink avoid className hacks duplicating globals.css', () => {
            const targets = new Set(['Link', 'ActiveLink', 'Tabs', 'Tabs.Tab', 'NavLink']);
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if (targets.has(el.tagName) && el.props.className) {
                        violations.push(`${file.relPath}:${el.line} <${el.tagName} className=${el.props.className.text}>`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Navigation className hacks:${formatViolations(violations)}`);
        });

        it('T2-F8-03: ThemeIcon uses Mantine token sizes (xs/sm/md/lg/xl) instead of arbitrary numeric pixels', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if (el.tagName !== 'ThemeIcon' || !el.props.size) continue;
                    if (el.props.size.kind === 'number') {
                        violations.push(`${file.relPath}:${el.line} <ThemeIcon size={${el.props.size.value}}>`);
                    }
                }
            }
            assert.equal(violations.length, 0, `ThemeIcon numeric pixel size drift:${formatViolations(violations)}`);
        });

        it('T2-F8-04: NavigationHeader and FooterIsland import routes from @/lib/config/routes', () => {
            for (const rel of ['components/islands/layout/NavigationHeader.tsx', 'components/islands/layout/FooterIsland.tsx']) {
                const file = snapshot.filesByRel.get(rel);
                assert.ok(file, `Missing ${rel}`);
                assert.ok(
                    file.imports.some((i) => i.from === '@/lib/config/routes'),
                    `${rel} must import routes from '@/lib/config/routes'`,
                );
            }
        });

        it('T2-F8-05: zero inline <style> tags inside .tsx components', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const hit of getDisallowedRawTagsInFile(file)) {
                    if (hit.tag === 'style') violations.push(`${file.relPath}:${hit.line} <style>`);
                }
            }
            assert.equal(violations.length, 0, `Inline <style> tags in components:${formatViolations(violations)}`);
        });
    });

    // =========================================================================
    // F9: Logo, Icon & Media Boundaries
    // =========================================================================
    describe('F9: Logo, Icon & Media Boundaries', () => {
        it('T2-F9-01: Image, FallbackLogo, and MediaAsset className contain ONLY permitted utilities', () => {
            const mediaTags = new Set(['Image', 'FallbackLogo', 'MediaAsset']);
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if (!mediaTags.has(el.tagName) || !el.props.className) continue;
                    // Skip pass-through className={className} inside FallbackLogo/MediaAsset definitions
                    if (file.relPath === 'components/ui/media/FallbackLogo.tsx' || file.relPath === 'components/ui/media/MediaAsset.tsx') {
                        continue;
                    }
                    const bad = [];
                    for (const str of el.props.className.stringLiterals || []) {
                        for (const tok of str.split(/\s+/).filter(Boolean)) {
                            if (!PERMITTED_MEDIA_UTILITY_RE.test(tok)) bad.push(tok);
                        }
                    }
                    if (bad.length > 0) {
                        violations.push(`${file.relPath}:${el.line} <${el.tagName} className="... ${bad.join(' ')}">`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Unpermitted Image/FallbackLogo/MediaAsset className utilities:${formatViolations(violations)}`);
        });

        it('T2-F9-02: logo Image/FallbackLogo components with width+height maintain aspect ratio via object-contain', () => {
            const violations = [];
            for (const file of snapshot.uiTsxFiles) {
                for (const el of file.jsxElements) {
                    if (el.tagName !== 'Image' && el.tagName !== 'FallbackLogo') continue;
                    const srcText = el.props.src?.text || '';
                    const isBrandLogo = /BRAND_CONFIG\.|Logo/.test(srcText) || el.tagName === 'FallbackLogo';
                    if (!isBrandLogo) continue;
                    if (
                        el.props.width &&
                        el.props.height &&
                        !el.props.className?.text.includes('object-contain') &&
                        !el.props.className?.text.includes('sponsor-logo') &&
                        !el.props.style?.text.includes('height')
                    ) {
                        if (file.relPath === 'components/ui/media/FallbackLogo.tsx') continue;
                        violations.push(`${file.relPath}:${el.line} <${el.tagName}> missing object-contain`);
                    }
                }
            }
            assert.equal(violations.length, 0, `Logo aspect-ratio risk:${formatViolations(violations)}`);
        });

        it('T2-F9-03: shared/icons/social.tsx defines icons with fill="currentColor" and width="1em" height="1em"', () => {
            const social = snapshot.filesByRel.get('shared/icons/social.tsx');
            assert.ok(social, 'Missing shared/icons/social.tsx');
            const svgs = social.jsxElements.filter((el) => el.tagName === 'svg');
            assert.equal(svgs.length, 5, 'Expected 5 social icon SVG definitions');
            for (const svg of svgs) {
                assert.equal(svg.props.fill?.value, 'currentColor', `L${svg.line}: svg must use fill="currentColor"`);
                assert.equal(svg.props.width?.value, '1em', `L${svg.line}: svg must use width="1em"`);
                assert.equal(svg.props.height?.value, '1em', `L${svg.line}: svg must use height="1em"`);
            }
            assert.equal(social.hexLiterals.length, 0);
        });

        it('T2-F9-04: QRDisplay.tsx avoids className on QRCodeSVG and inline borderRadius override', () => {
            const qr = snapshot.filesByRel.get('shared/ui/QRDisplay.tsx');
            assert.ok(qr, 'Missing shared/ui/QRDisplay.tsx');
            const svgEl = qr.jsxElements.find((el) => el.tagName === 'QRCodeSVG');
            assert.ok(svgEl, 'Missing QRCodeSVG in QRDisplay.tsx');
            assert.equal(svgEl.props.className, undefined, 'QRCodeSVG must not pass className');
            const brOverride = qr.styleVisualOverrides.filter((o) => o.prop === 'borderRadius');
            assert.equal(brOverride.length, 0, 'QRDisplay.tsx must not use inline style borderRadius override');
        });

        it('T2-F9-05: BRAND_CONFIG paths and dark/light logo surface pairings are consistent', () => {
            const cfg = snapshot.theme.brandConfig;
            assert.ok(cfg.logoLightMode && cfg.logoDarkMode && cfg.logoFallbackLight && cfg.logoFallbackDark);
            assert.notEqual(cfg.logoLightMode, cfg.logoDarkMode);
            assert.notEqual(cfg.logoFallbackLight, cfg.logoFallbackDark);
            // Verify logoDarkMode is always paired with dark:block when rendered alongside logoLightMode
            for (const file of snapshot.uiTsxFiles) {
                const imgs = file.jsxElements.filter((el) => el.tagName === 'Image');
                const hasDark = imgs.some((i) => i.props.src?.text.includes('logoDarkMode'));
                const hasLight = imgs.some((i) => i.props.src?.text.includes('logoLightMode'));
                if (hasDark && hasLight) {
                    const darkImg = imgs.find((i) => i.props.src?.text.includes('logoDarkMode'));
                    assert.ok(darkImg.props.className?.text.includes('dark:block'), `${file.relPath}:${darkImg.line} logoDarkMode must use dark:block`);
                }
            }
        });
    });

    // =========================================================================
    // F10: Scoped Exceptions & Coverage Boundaries
    // =========================================================================
    describe('F10: Scoped Exceptions & Coverage Boundaries', () => {
        it('T2-F10-01: documented DOM primitive files contain zero other disallowed HTML tags or unpermitted video className', () => {
            const violations = [];
            for (const rel of DOCUMENTED_DOM_PRIMITIVE_ALLOWLIST.keys()) {
                if (rel === 'app/layout.tsx') continue;
                const file = snapshot.filesByRel.get(rel);
                assert.ok(file, `Missing allowlisted file ${rel}`);
                for (const hit of getDisallowedRawTagsInFile(file)) {
                    violations.push(`${rel}:${hit.line} <${hit.tag}>`);
                }
            }
            assert.equal(violations.length, 0, `Extra raw HTML inside DOM primitive allowlist:${formatViolations(violations)}`);
        });

        it('T2-F10-02: app/layout.tsx limits className strictly to <body>', () => {
            const layout = snapshot.filesByRel.get('app/layout.tsx');
            assert.ok(layout);
            const bad = layout.jsxElements.filter((el) => el.props.className && el.tagName !== 'body');
            assert.equal(bad.length, 0, `Unexpected className in layout.tsx:${formatViolations(bad.map((b) => `L${b.line} <${b.tagName}>`))}`);
        });

        it('T2-F10-03: hooks/, types/, proxy.ts, sw.ts, and shared/lib/** contain zero JSX or UI markup', () => {
            const nonUiPrefixes = ['hooks/', 'types/', 'shared/lib/'];
            const nonUiExact = new Set(['proxy.ts', 'sw.ts']);
            const violations = [];
            for (const file of snapshot.files) {
                if (nonUiExact.has(file.relPath) || nonUiPrefixes.some((p) => file.relPath.startsWith(p))) {
                    if (file.hasJsx) violations.push(`${file.relPath}: contains JSX`);
                }
            }
            assert.equal(violations.length, 0, `UI/JSX found in non-UI modules:${formatViolations(violations)}`);
        });

        it('T2-F10-04: zero dangerouslySetInnerHTML across all apps/frontend/src/**', () => {
            const violations = [];
            for (const file of snapshot.files) {
                for (const hit of file.dangerouslySetInnerHTML) {
                    violations.push(`${file.relPath}:${hit.line} <${hit.tagName} dangerouslySetInnerHTML>`);
                }
            }
            assert.equal(violations.length, 0, `dangerouslySetInnerHTML usages:${formatViolations(violations)}`);
        });

        it('T2-F10-05: 100% file coverage across apps/frontend/src/** (zero skipped directories)', () => {
            assert.ok(snapshot.files.length >= 650, `Expected >=650 files scanned, got ${snapshot.files.length}`);
            for (const dir of ['app/', 'components/', 'features/', 'shared/', 'lib/', 'server/', 'hooks/', 'types/']) {
                assert.ok(
                    snapshot.files.some((f) => f.relPath.startsWith(dir)),
                    `Missing coverage for src/${dir}`,
                );
            }
        });
    });

    // =========================================================================
    // F11: ESLint & Suite Self-Integrity Boundaries
    // =========================================================================
    describe('F11: ESLint & Suite Self-Integrity Boundaries', () => {
        it('T2-F11-01: opaque-box ESLint rejects synthetic snippet with <header>, <strong>, <option>, radius={0}, UnstyledButton/Link/Icon className', async () => {
            const { ESLint } = require('eslint');
            const eslint = new ESLint({ cwd: FRONTEND_DIR });
            const syntheticTsx = [
                "import Link from 'next/link';",
                "import { Paper, UnstyledButton } from '@mantine/core';",
                "import { InstagramIcon } from '@/shared/icons/social';",
                'export function SyntheticNonCompliant() {',
                '  return (',
                '    <header>',
                '      <strong>bad</strong>',
                '      <select><option value="1">1</option></select>',
                '      <Paper radius={0}>x</Paper>',
                '      <UnstyledButton className="p-2">u</UnstyledButton>',
                '      <Link href="/" className="x">l</Link>',
                '      <InstagramIcon className="size-5" />',
                '    </header>',
                '  );',
                '}',
            ].join('\n');

            const results = await eslint.lintText(syntheticTsx, {
                filePath: path.join(FRONTEND_DIR, 'src', 'components', 'ui', 'Link.tsx'),
            });
            const restrictedMsgs = results[0].messages.filter((m) => m.ruleId === 'no-restricted-syntax');
            const hitLines = new Set(restrictedMsgs.map((m) => m.line));

            const expectedChecks = [
                [6, '<header>'],
                [7, '<strong>'],
                [8, '<option>'],
                [9, '<Paper radius={0}>'],
                [10, '<UnstyledButton className>'],
                [11, '<Link className>'],
                [12, '<InstagramIcon className>'],
            ];
            const missed = expectedChecks.filter(([line]) => !hitLines.has(line)).map(([line, label]) => `L${line}: ${label}`);
            assert.equal(missed.length, 0, `ESLint failed to reject synthetic bypasses:${formatViolations(missed)}`);
        });

        it('T2-F11-02: legacy lib/utils/cn.ts is removed or unused across src/**', () => {
            const cnExists = snapshot.filesByRel.has('lib/utils/cn.ts');
            const cnImports = [];
            for (const file of snapshot.files) {
                for (const imp of file.imports) {
                    if (imp.from.endsWith('/cn') || imp.from === '@/lib/utils/cn') {
                        cnImports.push(`${file.relPath}:${imp.line}`);
                    }
                }
            }
            assert.equal(cnImports.length, 0, `cn.ts still imported:${formatViolations(cnImports)}`);
            assert.equal(cnExists, false, 'Unused legacy src/lib/utils/cn.ts should be removed');
        });

        it('T2-F11-03: zero @ts-ignore / @ts-expect-error / @ts-nocheck / suppress comments in src/**', () => {
            const violations = [];
            for (const file of snapshot.files) {
                for (const c of file.suppressComments) {
                    violations.push(`${file.relPath}:${c.line} ${c.kind}`);
                }
            }
            assert.equal(violations.length, 0, `Compiler/linter suppressions found:${formatViolations(violations)}`);
        });

        it('T2-F11-04: zero no-restricted-syntax: "off" overrides on UI/component files in eslint.config.mjs', () => {
            const blocks = snapshot.eslintConfigText.split('files:').slice(1);
            const allowedOff = ['logger.ts', 'log-sanitizer.ts', 'auth-utils.ts', 'redis-session-plugin.ts', 'auth.ts', 'opengraph-image.tsx', 'twitter-image.tsx', 'og-utils.tsx'];
            for (const block of blocks) {
                if (!block.includes('"no-restricted-syntax": "off"') && !block.includes("'no-restricted-syntax': 'off'")) continue;
                const filesLine = block.split('\n')[0];
                const isAllowed = allowedOff.some((a) => filesLine.includes(a));
                assert.ok(isAllowed, `Unexpected no-restricted-syntax off override on: ${filesLine}`);
            }
        });

        it('T2-F11-05: brandguide test suite files contain zero node:vm module loaders, suppress comments, or repo-root writes', () => {
            const suiteFiles = [
                'tests/brandguide/compliance-engine.mjs',
                'tests/brandguide-tier1-features.test.mjs',
                'tests/brandguide-tier2-boundaries.test.mjs',
                'tests/brandguide-tier3-consistency.test.mjs',
                'tests/brandguide-tier4-e2e.test.mjs',
            ];
            const forbiddenVmLoader = 'SourceText' + 'Module';
            const forbiddenSuppress = 'eslint' + '-disable';
            for (const rel of suiteFiles) {
                const abs = path.join(REPO_ROOT, rel);
                if (!fs.existsSync(abs)) continue;
                const content = fs.readFileSync(abs, 'utf8');
                assert.equal(content.includes(forbiddenVmLoader), false, `${rel} must not use ${forbiddenVmLoader}`);
                assert.equal(content.includes(forbiddenSuppress), false, `${rel} must not contain suppress comments`);
            }
        });
    });
});
