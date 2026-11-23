import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../../apps/frontend/package.json', import.meta.url));
export const ts = require('typescript');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const REPO_ROOT = path.resolve(__dirname, '..', '..');
export const FRONTEND_DIR = path.join(REPO_ROOT, 'apps', 'frontend');
export const SRC_DIR = path.join(FRONTEND_DIR, 'src');
export const PUBLIC_IMG_DIR = path.join(FRONTEND_DIR, 'public', 'img');
export const DEFAULT_REPORT_PATH =
    process.env.BRANDGUIDE_REPORT_PATH || path.join(os.tmpdir(), 'salvemundi-brandguide-report.json');

export const EXPECTED_BRAND_HEXES = Object.freeze({
    purple: '#5A3761',
    lightPurple: '#936695',
    lightBase: '#F0F1F9',
    darkBase: '#1E1221',
    darkSurface: '#36213A',
    lightSurface: '#FFFFFF',
    accent: '#F0A202',
    success: '#3E6137',
    error: '#B5474B',
});

export const OFFICIAL_HEX_SET = new Set(Object.values(EXPECTED_BRAND_HEXES).map((h) => h.toUpperCase()));

export const ALLOWED_MANTINE_COLOR_TOKENS = new Set([
    'brand',
    'purple',
    'lightPurple',
    'accent',
    'success',
    'error',
    'darkSurface',
    'darkBase',
    'lightBase',
    'dimmed',
    'white',
    'inherit',
    'transparent',
    'currentColor',
]);

export const DISALLOWED_MANTINE_COLOR_TOKENS = new Set([
    'red',
    'pink',
    'grape',
    'violet',
    'indigo',
    'blue',
    'cyan',
    'teal',
    'green',
    'lime',
    'yellow',
    'orange',
    'gray',
    'grey',
    'black',
]);

export const DISALLOWED_RAW_HTML_TAGS = new Set([
    'div',
    'span',
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'button',
    'select',
    'option',
    'textarea',
    'details',
    'summary',
    'section',
    'header',
    'footer',
    'nav',
    'main',
    'aside',
    'article',
    'ul',
    'ol',
    'li',
    'table',
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'th',
    'td',
    'label',
    'input',
    'form',
    'a',
    'hr',
    'strong',
    'b',
    'em',
    'i',
    'u',
    'small',
    'code',
    'pre',
    'blockquote',
    'br',
    'wbr',
    'style',
    'svg',
    'path',
    'polyline',
    'circle',
    'rect',
    'line',
    'polygon',
    'figure',
    'figcaption',
    'img',
    'html',
    'body',
    'canvas',
    'video',
]);

export const DOCUMENTED_DOM_PRIMITIVE_ALLOWLIST = new Map([
    ['app/layout.tsx', new Set(['html', 'body'])],
    ['components/ui/forms/SignaturePad.tsx', new Set(['canvas'])],
    ['components/islands/beheer/nda/NdaSignatureLayoutEditor.tsx', new Set(['canvas'])],
    ['components/ui/media/MediaAsset.tsx', new Set(['video'])],
]);

export const PERMITTED_MEDIA_UTILITY_RE = /^(object-cover|object-contain|dark:hidden|dark:block|hidden|block|sponsor-logo)$/;

export const MANTINE_SURFACE_COMPONENTS = new Set(['Card', 'Paper', 'Container']);
export const MANTINE_TYPOGRAPHY_COMPONENTS = new Set(['Title', 'Text']);
export const MANTINE_BADGE_COMPONENTS = new Set(['Badge', 'Pill', 'Input.Label']);
export const MANTINE_BUTTON_COMPONENTS = new Set(['Button', 'ActionIcon', 'CloseButton', 'UnstyledButton']);
export const MANTINE_LAYOUT_COMPONENTS = new Set([
    'Box',
    'Flex',
    'Group',
    'Stack',
    'Grid',
    'Grid.Col',
    'GridCol',
    'SimpleGrid',
    'Container',
    'Center',
    'ScrollArea',
    'Divider',
]);
export const MANTINE_INPUT_COMPONENTS = new Set([
    'TextInput',
    'Select',
    'NativeSelect',
    'Textarea',
    'Checkbox',
    'Switch',
    'NumberInput',
    'ColorInput',
    'PasswordInput',
    'FileInput',
    'MultiSelect',
    'Autocomplete',
    'DateInput',
    'DatePickerInput',
    'DateTimePicker',
    'SegmentedControl',
    'Radio',
    'Radio.Group',
    'TagsInput',
    'PinInput',
    'Slider',
]);
export const MANTINE_NAV_FEEDBACK_COMPONENTS = new Set([
    'Anchor',
    'Tabs',
    'Tabs.List',
    'Tabs.Tab',
    'Tabs.Panel',
    'NavLink',
    'Alert',
    'ThemeIcon',
    'Modal',
    'Drawer',
    'Loader',
    'Progress',
    'Menu',
    'Menu.Target',
    'Menu.Dropdown',
    'Menu.Item',
    'Popover',
    'Popover.Target',
    'Popover.Dropdown',
    'Tooltip',
]);

export const MANTINE_RADIUS_COMPONENTS = new Set([
    'Button',
    'ActionIcon',
    'CloseButton',
    'UnstyledButton',
    'Card',
    'Paper',
    'Container',
    'Alert',
    'Badge',
    'Pill',
    'ThemeIcon',
    'Modal',
    'Drawer',
    'Switch',
    'Checkbox',
    'Radio',
    'Progress',
    'TextInput',
    'Select',
    'NativeSelect',
    'Textarea',
    'NumberInput',
    'PasswordInput',
    'FileInput',
    'MultiSelect',
    'Autocomplete',
    'DateInput',
    'DatePickerInput',
    'DateTimePicker',
    'ColorInput',
    'SegmentedControl',
    'Tabs',
    'ScrollArea',
    'TagsInput',
    'PinInput',
]);

export const ALL_MANTINE_BAN_CLASSNAME = new Set([
    ...MANTINE_LAYOUT_COMPONENTS,
    ...MANTINE_SURFACE_COMPONENTS,
    ...MANTINE_TYPOGRAPHY_COMPONENTS,
    ...MANTINE_BADGE_COMPONENTS,
    ...MANTINE_BUTTON_COMPONENTS,
    ...MANTINE_INPUT_COMPONENTS,
    ...MANTINE_NAV_FEEDBACK_COMPONENTS,
    'Avatar',
    'Spoiler',
    'Typography',
    'List',
    'List.Item',
    'Table',
    'Table.Thead',
    'Table.Tbody',
    'Table.Tr',
    'Table.Th',
    'Table.Td',
    'Skeleton',
    'Pagination',
    'Stepper',
    'Accordion',
    'Indicator',
    'RingProgress',
    'ColorSwatch',
    'VisuallyHidden',
    'Overlay',
    'AppShell',
    'Breadcrumbs',
    'Notification',
]);

export const CORE_VARIANT_COMPONENTS = [
    'Button',
    'ActionIcon',
    'Badge',
    'Card',
    'Paper',
    'Title',
    'Text',
    'ThemeIcon',
    'Alert',
    'Modal',
];

export const VARIANT_SIGNATURE_PROPS = {
    Button: ['variant', 'color', 'size', 'fw', 'fz', 'c', 'bg', 'radius', 'tt', 'px', 'py', 'p', 'component'],
    ActionIcon: ['variant', 'color', 'size', 'radius', 'c', 'bg', 'component'],
    Badge: ['variant', 'color', 'size', 'radius', 'tt', 'fw', 'fz', 'c', 'bg'],
    Card: ['variant', 'padding', 'p', 'px', 'py', 'shadow', 'withBorder', 'bg', 'c', 'radius', 'component'],
    Paper: ['variant', 'p', 'px', 'py', 'shadow', 'withBorder', 'bg', 'c', 'radius', 'component'],
    Title: ['order', 'size', 'fz', 'fw', 'ff', 'c', 'tt', 'ta', 'lh', 'component'],
    Text: ['size', 'fz', 'fw', 'ff', 'c', 'tt', 'ta', 'lh', 'fs', 'td', 'variant', 'span', 'component'],
    ThemeIcon: ['variant', 'color', 'size', 'radius', 'c', 'bg'],
    Alert: ['variant', 'color', 'radius', 'p', 'c', 'bg'],
    Modal: ['size', 'centered', 'radius', 'padding', 'withCloseButton', 'overlayProps'],
};

export const SOCIAL_ICON_TAGS = new Set([
    'InstagramIcon',
    'FacebookIcon',
    'TiktokIcon',
    'LinkedinIcon',
    'DiscordIcon',
    'SiInstagram',
    'SiFacebook',
    'SiTiktok',
    'FaLinkedin',
    'QRCodeSVG',
]);

export const RAW_SVG_TAGS = new Set(['svg', 'path', 'polyline', 'circle', 'rect', 'line', 'polygon']);

const ESLINT_DISABLE_NEEDLE = 'eslint' + '-disable';

function toPosix(p) {
    return p.split(path.sep).join('/');
}

function walkDir(dir, out = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkDir(full, out);
        } else if (entry.isFile()) {
            out.push(full);
        }
    }
    return out;
}

function isOgFile(relPath) {
    return (
        relPath === 'lib/utils/og-utils.tsx' ||
        /^app\/.*\/(?:opengraph-image|twitter-image)\.tsx$/.test(relPath) ||
        /^(?:app\/)?(?:opengraph-image|twitter-image)\.tsx$/.test(relPath)
    );
}

function classifyFile(relPath) {
    if (relPath.startsWith('server/')) return 'server';
    if (relPath.startsWith('lib/config/theme/')) return 'theme';
    if (isOgFile(relPath)) return 'og';
    if (relPath.endsWith('.css')) return 'css';
    if (relPath.endsWith('.tsx') || relPath.endsWith('.ts')) return 'ui';
    return 'other';
}

function getLine(sf, pos) {
    return sf.getLineAndCharacterOfPosition(pos).line + 1;
}

function collectStringLiterals(node, sf, out = []) {
    if (!node) return out;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        out.push({ value: node.text, line: getLine(sf, node.getStart(sf)) });
        return out;
    }
    ts.forEachChild(node, (child) => {
        collectStringLiterals(child, sf, out);
    });
    return out;
}

function extractObjectEntries(objNode, sf) {
    const entries = {};
    for (const prop of objNode.properties) {
        if (ts.isPropertyAssignment(prop)) {
            const key = ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name) ? prop.name.text : prop.name.getText(sf);
            const init = prop.initializer;
            if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) {
                entries[key] = { kind: 'string', value: init.text, text: init.getText(sf) };
            } else if (ts.isNumericLiteral(init)) {
                entries[key] = { kind: 'number', value: Number(init.text), text: init.text };
            } else if (init.kind === ts.SyntaxKind.TrueKeyword || init.kind === ts.SyntaxKind.FalseKeyword) {
                entries[key] = { kind: 'boolean', value: init.kind === ts.SyntaxKind.TrueKeyword, text: init.getText(sf) };
            } else if (ts.isObjectLiteralExpression(init)) {
                entries[key] = { kind: 'object', entries: extractObjectEntries(init, sf), text: init.getText(sf) };
            } else {
                entries[key] = {
                    kind: 'expression',
                    text: init.getText(sf),
                    stringLiterals: collectStringLiterals(init, sf),
                };
            }
        } else if (ts.isShorthandPropertyAssignment(prop)) {
            entries[prop.name.text] = { kind: 'shorthand', text: prop.name.text };
        }
    }
    return entries;
}

function extractJsxProps(attributesNode, sf) {
    const props = {};
    let hasSpread = false;
    if (!attributesNode) return { props, hasSpread };

    for (const attr of attributesNode.properties) {
        if (ts.isJsxSpreadAttribute(attr)) {
            hasSpread = true;
            continue;
        }
        if (!ts.isJsxAttribute(attr)) continue;
        const name = attr.name.getText(sf);
        const init = attr.initializer;
        if (!init) {
            props[name] = { kind: 'boolean', value: true, text: 'true', stringLiterals: [] };
        } else if (ts.isStringLiteral(init)) {
            props[name] = { kind: 'string', value: init.text, text: init.getText(sf), stringLiterals: [init.text] };
        } else if (ts.isJsxExpression(init)) {
            const expr = init.expression;
            if (!expr) {
                props[name] = { kind: 'expression', text: '{}', stringLiterals: [] };
            } else if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
                props[name] = { kind: 'string', value: expr.text, text: expr.getText(sf), stringLiterals: [expr.text] };
            } else if (ts.isNumericLiteral(expr)) {
                props[name] = { kind: 'number', value: Number(expr.text), text: expr.text, stringLiterals: [] };
            } else if (
                ts.isPrefixUnaryExpression(expr) &&
                expr.operator === ts.SyntaxKind.MinusToken &&
                ts.isNumericLiteral(expr.operand)
            ) {
                const n = -Number(expr.operand.text);
                props[name] = { kind: 'number', value: n, text: expr.getText(sf), stringLiterals: [] };
            } else if (expr.kind === ts.SyntaxKind.TrueKeyword || expr.kind === ts.SyntaxKind.FalseKeyword) {
                const b = expr.kind === ts.SyntaxKind.TrueKeyword;
                props[name] = { kind: 'boolean', value: b, text: String(b), stringLiterals: [] };
            } else if (ts.isObjectLiteralExpression(expr)) {
                props[name] = {
                    kind: 'object',
                    entries: extractObjectEntries(expr, sf),
                    text: expr.getText(sf),
                    stringLiterals: collectStringLiterals(expr, sf).map((s) => s.value),
                };
            } else {
                props[name] = {
                    kind: 'expression',
                    text: expr.getText(sf),
                    stringLiterals: collectStringLiterals(expr, sf).map((s) => s.value),
                };
            }
        }
    }
    return { props, hasSpread };
}

function scanHexAndFuncColors(text, line, relPath, hexLiterals, funcColorLiterals) {
    if (!text) return;
    // Skip URLs or SVG path data or hash anchors like #section
    if (/^(?:https?:\/\/|mailto:|tel:|\/|#[^0-9a-fA-F])/i.test(text.trim())) {
        // Still check if it's a CSS string containing multiple parts, unless it's strictly a URL
        if (/^(?:https?:\/\/|mailto:|tel:)/i.test(text.trim())) return;
    }
    // Skip qr-render.ts SVG markup builder
    if (relPath === 'components/islands/qr-generator/qr-render.ts') return;

    const hexStandalone = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
    const trimmed = text.trim();
    if (hexStandalone.test(trimmed)) {
        hexLiterals.push({ hex: trimmed.toUpperCase(), line, text: trimmed });
    } else if (!/https?:\/\//i.test(text)) {
        const hexRe = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8}|[0-9a-fA-F]{3})\b/g;
        // Guard against Tailwind arbitrary class or CSS color values vs anchor IDs
        let m;
        while ((m = hexRe.exec(text)) !== null) {
            const idx = m.index;
            const prev = idx > 0 ? text[idx - 1] : '';
            // Ignore URL hash fragments like `/foo#abc` or `id#abc`
            if (/[a-zA-Z0-9/_-]/.test(prev)) continue;
            const candidate = m[0];
            // 3-char hex like #fff or #000: avoid matching Dutch/English short ids like #cat if non-hex letters aren't present (regex already limits to hex)
            // Avoid matching #dad or #bed unless preceded by CSS/color punctuation like :, [, space, (, quote
            if (candidate.length === 4 && prev && !/[\s:(\[,]/.test(prev)) continue;
            hexLiterals.push({ hex: candidate.toUpperCase(), line, text: candidate });
        }
    }

    const funcRe = /\b(?:rgba?|hsla?|oklch)\s*\([^)]*\)/gi;
    let fm;
    while ((fm = funcRe.exec(text)) !== null) {
        funcColorLiterals.push({ value: fm[0], line });
    }
}

function scanComments(sourceText, sf) {
    const suppressComments = [];
    const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.TSX, sourceText);
    let token = scanner.scan();
    while (token !== ts.SyntaxKind.EndOfFileToken) {
        if (
            token === ts.SyntaxKind.SingleLineCommentTrivia ||
            token === ts.SyntaxKind.MultiLineCommentTrivia
        ) {
            const text = scanner.getTokenText();
            const line = getLine(sf, scanner.getTokenPos());
            if (text.includes(ESLINT_DISABLE_NEEDLE)) {
                suppressComments.push({ kind: ESLINT_DISABLE_NEEDLE, line, text: text.trim() });
            }
            if (/@ts-ignore\b/.test(text)) {
                suppressComments.push({ kind: '@ts-ignore', line, text: text.trim() });
            }
            if (/@ts-expect-error\b/.test(text)) {
                suppressComments.push({ kind: '@ts-expect-error', line, text: text.trim() });
            }
            if (/@ts-nocheck\b/.test(text)) {
                suppressComments.push({ kind: '@ts-nocheck', line, text: text.trim() });
            }
        }
        token = scanner.scan();
    }
    return suppressComments;
}

function getTagNameDetails(tagNameNode, sf) {
    const tagName = tagNameNode.getText(sf);
    const isIdentifier = ts.isIdentifier(tagNameNode);
    const isMemberExpression = ts.isPropertyAccessExpression(tagNameNode);
    const baseTag = tagName.split('.')[0];
    const isLowerHtml = isIdentifier && /^[a-z]/.test(tagName);
    return { tagName, baseTag, isIdentifier, isMemberExpression, isLowerHtml };
}

function inspectJsxChildren(jsxElementNode, sf) {
    let hasTextChild = false;
    let hasVisuallyHiddenChild = false;
    const childTags = [];

    for (const child of jsxElementNode.children) {
        if (ts.isJsxText(child)) {
            if (child.getText(sf).trim().length > 0) {
                hasTextChild = true;
            }
        } else if (ts.isJsxExpression(child) && child.expression) {
            if (
                ts.isStringLiteral(child.expression) ||
                ts.isNoSubstitutionTemplateLiteral(child.expression) ||
                ts.isIdentifier(child.expression) ||
                ts.isPropertyAccessExpression(child.expression) ||
                ts.isCallExpression(child.expression) ||
                ts.isConditionalExpression(child.expression)
            ) {
                // Might render text or label
                const txt = child.expression.getText(sf);
                if (!/Icon\b/.test(txt)) {
                    hasTextChild = true;
                }
            }
        } else if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
            const opening = ts.isJsxElement(child) ? child.openingElement : child;
            const cTag = opening.tagName.getText(sf);
            childTags.push(cTag);
            if (cTag === 'VisuallyHidden') hasVisuallyHiddenChild = true;
            if (cTag === 'Text' || cTag === 'Title' || cTag === 'Box' || cTag === 'Group' || cTag === 'Stack') {
                hasTextChild = true;
            }
        }
    }
    return {
        hasChildren: jsxElementNode.children.length > 0,
        hasTextChild,
        hasVisuallyHiddenChild,
        childTags,
    };
}

function extractClassTokens(propInfo) {
    if (!propInfo) return [];
    const tokens = [];
    for (const str of propInfo.stringLiterals || []) {
        for (const part of str.split(/\s+/)) {
            const trimmed = part.trim();
            if (trimmed) tokens.push(trimmed);
        }
    }
    return tokens;
}

function analyzeTsFile(absPath, relPath) {
    const sourceText = fs.readFileSync(absPath, 'utf8');
    const isTsx = relPath.endsWith('.tsx') || relPath.endsWith('.jsx');
    const sf = ts.createSourceFile(
        absPath,
        sourceText,
        ts.ScriptTarget.Latest,
        true,
        isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );

    const imports = [];
    const jsxElements = [];
    const hexLiterals = [];
    const funcColorLiterals = [];
    const colorHelperLiterals = [];
    const consoleCalls = [];
    const dangerouslySetInnerHTML = [];
    const fontFamilyStyleOverrides = [];
    const styleVisualOverrides = [];
    const tailwindColorClasses = [];
    const tailwindTypographyClasses = [];

    const mantineImported = new Set();
    const lucideImported = new Set();
    let hasNextLinkImport = false;
    let hasCustomLinkImport = false;
    let hasNextImageImport = false;

    const suppressComments = scanComments(sourceText, sf);

    function visit(node, contextFlags = { inColorHelper: false }) {
        if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
            const from = node.moduleSpecifier.text;
            const specifiers = [];
            let defaultImport = null;
            let namespaceImport = null;
            const clause = node.importClause;
            if (clause) {
                if (clause.name) defaultImport = clause.name.text;
                if (clause.namedBindings) {
                    if (ts.isNamespaceImport(clause.namedBindings)) {
                        namespaceImport = clause.namedBindings.name.text;
                    } else if (ts.isNamedImports(clause.namedBindings)) {
                        for (const el of clause.namedBindings.elements) {
                            specifiers.push(el.name.text);
                        }
                    }
                }
            }
            imports.push({ from, specifiers, defaultImport, namespaceImport, line: getLine(sf, node.getStart(sf)) });
            if (from === '@mantine/core' || from === '@mantine/dates' || from === '@mantine/notifications') {
                for (const s of specifiers) mantineImported.add(s);
            }
            if (from === 'lucide-react') {
                for (const s of specifiers) lucideImported.add(s);
            }
            if (from === 'next/link') hasNextLinkImport = true;
            if (from === '@/components/ui/Link') hasCustomLinkImport = true;
            if (from === 'next/image') hasNextImageImport = true;
        }

        // Detect color-helper declarations/functions (e.g. badgeColor, statusColor, getStatusColor)
        let nextColorHelper = contextFlags.inColorHelper;
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
            if (/(?:color|badgeColor|statusColor|variantColor|tone)/i.test(node.name.text)) {
                nextColorHelper = true;
            }
        } else if (ts.isFunctionDeclaration(node) && node.name) {
            if (/(?:color|badge|status)/i.test(node.name.text)) {
                nextColorHelper = true;
            }
        }

        if (nextColorHelper && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))) {
            const val = node.text;
            if (DISALLOWED_MANTINE_COLOR_TOKENS.has(val)) {
                colorHelperLiterals.push({ token: val, line: getLine(sf, node.getStart(sf)) });
            }
        }

        // Check string literals & template chunks for #hex and rgb()/rgba()
        if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
            scanHexAndFuncColors(node.text, getLine(sf, node.getStart(sf)), relPath, hexLiterals, funcColorLiterals);
        } else if (ts.isTemplateExpression(node)) {
            scanHexAndFuncColors(node.head.text, getLine(sf, node.head.getStart(sf)), relPath, hexLiterals, funcColorLiterals);
            for (const span of node.templateSpans) {
                scanHexAndFuncColors(
                    span.literal.text,
                    getLine(sf, span.literal.getStart(sf)),
                    relPath,
                    hexLiterals,
                    funcColorLiterals,
                );
            }
        }

        // Check console.* calls
        if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
            const obj = node.expression.expression;
            const prop = node.expression.name;
            if (
                ts.isIdentifier(obj) &&
                obj.text === 'console' &&
                ts.isIdentifier(prop) &&
                /^(log|warn|error|info|debug)$/.test(prop.text)
            ) {
                consoleCalls.push({ method: prop.text, line: getLine(sf, node.getStart(sf)) });
            }
        }

        // Visit JSX opening and self-closing elements
        if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
            const { tagName, baseTag, isIdentifier, isMemberExpression, isLowerHtml } = getTagNameDetails(
                node.tagName,
                sf,
            );
            const line = getLine(sf, node.getStart(sf));
            const { props, hasSpread } = extractJsxProps(node.attributes, sf);
            const childrenInfo = ts.isJsxOpeningElement(node) && ts.isJsxElement(node.parent)
                ? inspectJsxChildren(node.parent, sf)
                : { hasChildren: false, hasTextChild: false, hasVisuallyHiddenChild: false, childTags: [] };

            const isMantine =
                mantineImported.has(baseTag) || ALL_MANTINE_BAN_CLASSNAME.has(tagName) || ALL_MANTINE_BAN_CLASSNAME.has(baseTag);
            const isLucide = lucideImported.has(baseTag);

            if (props.dangerouslySetInnerHTML) {
                dangerouslySetInnerHTML.push({ line, tagName });
            }

            if (props.style && props.style.kind === 'object') {
                const entries = props.style.entries || {};
                for (const [styleProp, styleVal] of Object.entries(entries)) {
                    const txt = styleVal.value !== undefined ? String(styleVal.value) : styleVal.text || '';
                    if (styleProp === 'fontFamily') {
                        fontFamilyStyleOverrides.push({ value: txt, line, tagName });
                    }
                    if (
                        ['background', 'backgroundColor', 'borderColor', 'color', 'borderRadius'].includes(styleProp)
                    ) {
                        styleVisualOverrides.push({ prop: styleProp, value: txt, line, tagName });
                    }
                }
            }

            if (props.className) {
                const tokens = extractClassTokens(props.className);
                for (const tok of tokens) {
                    if (
                        /^(?:bg|text|border|ring|fill|stroke)-\[#/.test(tok) ||
                        /^(?:bg|text|border)-(?:gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-|$)/.test(
                            tok,
                        ) ||
                        /^(?:bg|text|border)-(?:white|black)$/.test(tok)
                    ) {
                        tailwindColorClasses.push({ token: tok, line, tagName });
                    }
                    if (
                        /^(?:text-(?:xs|sm|base|lg|xl|[2-9]xl)|font-(?:sans|mono|serif|thin|light|normal|medium|semibold|bold|extrabold|black)|uppercase|lowercase|capitalize|tracking-)/.test(
                            tok,
                        )
                    ) {
                        tailwindTypographyClasses.push({ token: tok, line, tagName });
                    }
                }
            }

            jsxElements.push({
                tagName,
                baseTag,
                isIdentifier,
                isMemberExpression,
                isLowerHtml,
                isMantine,
                isLucide,
                line,
                props,
                hasSpread,
                ...childrenInfo,
            });
        }

        ts.forEachChild(node, (child) => visit(child, { inColorHelper: nextColorHelper }));
    }

    visit(sf);

    return {
        absPath,
        relPath,
        repoRelPath: `apps/frontend/src/${relPath}`,
        ext: path.extname(relPath),
        category: classifyFile(relPath),
        sourceText,
        sf,
        imports,
        mantineImported,
        lucideImported,
        hasNextLinkImport,
        hasCustomLinkImport,
        hasNextImageImport,
        jsxElements,
        hasJsx: jsxElements.length > 0,
        hexLiterals,
        funcColorLiterals,
        colorHelperLiterals,
        suppressComments,
        consoleCalls,
        dangerouslySetInnerHTML,
        fontFamilyStyleOverrides,
        styleVisualOverrides,
        tailwindColorClasses,
        tailwindTypographyClasses,
    };
}

function stripCssComments(css) {
    return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

function parseGlobalsCss(absPath) {
    const raw = fs.readFileSync(absPath, 'utf8');
    const stripped = stripCssComments(raw);
    const lines = stripped.split(/\r?\n/);

    const hexLiterals = [];
    const funcColorLiterals = [];
    const fontFamilyDecls = [];
    let hasColorWildcardInitial = false;
    let hasThemeBlock = false;

    const themeMatch = /@theme\s*\{([\s\S]*?)\}/m.exec(stripped);
    if (themeMatch) {
        hasThemeBlock = true;
        if (/--color-\*\s*:\s*initial\s*;/.test(themeMatch[1])) {
            hasColorWildcardInitial = true;
        }
    }

    lines.forEach((lineText, idx) => {
        const line = idx + 1;
        const hexRe = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
        let hm;
        while ((hm = hexRe.exec(lineText)) !== null) {
            hexLiterals.push({ hex: hm[0].toUpperCase(), line });
        }
        const funcRe = /\b(?:rgba?|hsla?|oklch)\s*\([^)]*\)/gi;
        let fm;
        while ((fm = funcRe.exec(lineText)) !== null) {
            funcColorLiterals.push({ value: fm[0], line });
        }
        const ffMatch = /font-family\s*:\s*([^;]+);/i.exec(lineText);
        if (ffMatch) {
            fontFamilyDecls.push({ value: ffMatch[1].trim(), line });
        }
    });

    return {
        raw,
        stripped,
        hasThemeBlock,
        hasColorWildcardInitial,
        hexLiterals,
        funcColorLiterals,
        fontFamilyDecls,
    };
}

function parseBrandThemeFiles(filesByRel) {
    // 1. theme/brand.ts
    const brandFile = filesByRel.get('lib/config/theme/brand.ts');
    const brandColors = {};
    if (brandFile) {
        ts.forEachChild(brandFile.sf, function walk(node) {
            if (
                ts.isVariableDeclaration(node) &&
                ts.isIdentifier(node.name) &&
                node.name.text === 'BRAND_COLORS' &&
                node.initializer
            ) {
                const init = ts.isAsExpression(node.initializer) ? node.initializer.expression : node.initializer;
                if (ts.isObjectLiteralExpression(init)) {
                    const entries = extractObjectEntries(init, brandFile.sf);
                    for (const [k, v] of Object.entries(entries)) {
                        if (v.kind === 'string') brandColors[k] = v.value.toUpperCase();
                    }
                }
            }
            ts.forEachChild(node, walk);
        });
    }

    // 2. theme/colors.ts
    const colorsFile = filesByRel.get('lib/config/theme/colors.ts');
    const themeColorKeys = new Set();
    let brandVirtualColor = null;
    const scaleTuples = {};
    if (colorsFile) {
        ts.forEachChild(colorsFile.sf, function walk(node) {
            if (
                ts.isVariableDeclaration(node) &&
                ts.isIdentifier(node.name) &&
                node.name.text === 'themeColors' &&
                node.initializer &&
                ts.isObjectLiteralExpression(node.initializer)
            ) {
                for (const prop of node.initializer.properties) {
                    if (!ts.isPropertyAssignment(prop)) continue;
                    const key = prop.name.getText(colorsFile.sf);
                    themeColorKeys.add(key);
                    if (key === 'brand' && ts.isCallExpression(prop.initializer)) {
                        const arg = prop.initializer.arguments[0];
                        if (arg && ts.isObjectLiteralExpression(arg)) {
                            brandVirtualColor = extractObjectEntries(arg, colorsFile.sf);
                        }
                    }
                    if ((key === 'dark' || key === 'gray') && ts.isArrayLiteralExpression(prop.initializer)) {
                        scaleTuples[key] = prop.initializer.elements.map((e) => e.getText(colorsFile.sf));
                    }
                }
            }
            ts.forEachChild(node, walk);
        });
    }

    // 3. theme/index.ts
    const indexFile = filesByRel.get('lib/config/theme/index.ts');
    let themeMeta = {};
    if (indexFile) {
        ts.forEachChild(indexFile.sf, function walk(node) {
            if (
                ts.isVariableDeclaration(node) &&
                ts.isIdentifier(node.name) &&
                node.name.text === 'salveMundiTheme' &&
                node.initializer &&
                ts.isCallExpression(node.initializer)
            ) {
                const arg = node.initializer.arguments[0];
                if (arg && ts.isObjectLiteralExpression(arg)) {
                    themeMeta = extractObjectEntries(arg, indexFile.sf);
                }
            }
            ts.forEachChild(node, walk);
        });
    }

    // 4. theme/resolver.ts
    const resolverFile = filesByRel.get('lib/config/theme/resolver.ts');
    const resolverVars = { variables: {}, dark: {}, light: {} };
    if (resolverFile) {
        ts.forEachChild(resolverFile.sf, function walk(node) {
            if (ts.isObjectLiteralExpression(node)) {
                const entries = extractObjectEntries(node, resolverFile.sf);
                if (entries.variables && entries.dark && entries.light) {
                    if (entries.variables.kind === 'object') resolverVars.variables = entries.variables.entries;
                    if (entries.dark.kind === 'object') resolverVars.dark = entries.dark.entries;
                    if (entries.light.kind === 'object') resolverVars.light = entries.light.entries;
                }
            }
            ts.forEachChild(node, walk);
        });
    }

    // 5. theme/components/*.ts
    const componentDefaults = {};
    for (const [rel, f] of filesByRel.entries()) {
        if (!rel.startsWith('lib/config/theme/components/') || rel.endsWith('index.ts')) continue;
        ts.forEachChild(f.sf, function walk(node) {
            if (
                ts.isPropertyAssignment(node) &&
                ts.isIdentifier(node.name) &&
                ts.isObjectLiteralExpression(node.initializer)
            ) {
                const compName = node.name.text;
                const entries = extractObjectEntries(node.initializer, f.sf);
                if (entries.defaultProps && entries.defaultProps.kind === 'object') {
                    componentDefaults[compName] = entries.defaultProps.entries;
                }
            }
            ts.forEachChild(node, walk);
        });
    }

    // 6. lib/config/brand.ts
    const brandConfigFile = filesByRel.get('lib/config/brand.ts');
    const brandConfig = {};
    if (brandConfigFile) {
        ts.forEachChild(brandConfigFile.sf, function walk(node) {
            if (
                ts.isVariableDeclaration(node) &&
                ts.isIdentifier(node.name) &&
                node.name.text === 'BRAND_CONFIG' &&
                node.initializer &&
                ts.isObjectLiteralExpression(node.initializer)
            ) {
                const entries = extractObjectEntries(node.initializer, brandConfigFile.sf);
                for (const [k, v] of Object.entries(entries)) {
                    if (v.kind === 'string') brandConfig[k] = v.value;
                }
            }
            ts.forEachChild(node, walk);
        });
    }

    return {
        brandColors,
        themeColorKeys,
        brandVirtualColor,
        scaleTuples,
        themeMeta,
        resolverVars,
        componentDefaults,
        brandConfig,
    };
}

function formatPropValueForSig(propInfo) {
    if (!propInfo) return '';
    if (propInfo.kind === 'boolean') return propInfo.value ? 'true' : 'false';
    if (propInfo.kind === 'string') return JSON.stringify(propInfo.value);
    if (propInfo.kind === 'number') return String(propInfo.value);
    return propInfo.text.replace(/\s+/g, ' ').trim();
}

function buildVariantInventory(files) {
    const inventory = {};
    for (const comp of CORE_VARIANT_COMPONENTS) {
        inventory[comp] = {
            totalInstances: 0,
            fileSet: new Set(),
            variantMap: new Map(),
            redundantDefaultCount: 0,
            disallowedVariantCount: 0,
        };
    }

    const rawHtmlCounts = {};
    const uiFiles = files.filter((f) => f.category === 'ui' && f.ext === '.tsx');

    for (const file of uiFiles) {
        for (const el of file.jsxElements) {
            if (el.isLowerHtml) {
                rawHtmlCounts[el.tagName] = (rawHtmlCounts[el.tagName] || 0) + 1;
            }
            if (!CORE_VARIANT_COMPONENTS.includes(el.tagName)) continue;

            const bucket = inventory[el.tagName];
            bucket.totalInstances += 1;
            bucket.fileSet.add(file.relPath);

            const sigProps = [...VARIANT_SIGNATURE_PROPS[el.tagName]].sort();
            const parts = [];
            for (const pName of sigProps) {
                if (Object.hasOwn(el.props, pName)) {
                    parts.push(`${pName}=${formatPropValueForSig(el.props[pName])}`);
                }
            }
            const signature = parts.length > 0 ? parts.join(' ') : '(default)';
            if (!bucket.variantMap.has(signature)) {
                bucket.variantMap.set(signature, { signature, count: 0, files: [] });
            }
            const entry = bucket.variantMap.get(signature);
            entry.count += 1;
            entry.files.push(`${file.relPath}:${el.line}`);

            // Check redundant defaults & disallowed props
            const p = el.props;
            if (p.radius || p.className) bucket.disallowedVariantCount += 1;
            if (el.tagName === 'Button') {
                if (p.variant?.value === 'filled') bucket.redundantDefaultCount += 1;
                if (p.color?.value === 'brand') bucket.redundantDefaultCount += 1;
                if (p.fw?.value === 700) bucket.redundantDefaultCount += 1;
                if (p.fw && p.fw.kind === 'number' && p.fw.value !== 700) bucket.disallowedVariantCount += 1;
                if (p.color?.kind === 'string' && DISALLOWED_MANTINE_COLOR_TOKENS.has(p.color.value)) {
                    bucket.disallowedVariantCount += 1;
                }
            } else if (el.tagName === 'ActionIcon') {
                if (p.variant?.value === 'subtle') bucket.redundantDefaultCount += 1;
                if (p.color?.value === 'brand') bucket.redundantDefaultCount += 1;
                if (p.color?.kind === 'string' && DISALLOWED_MANTINE_COLOR_TOKENS.has(p.color.value)) {
                    bucket.disallowedVariantCount += 1;
                }
            } else if (el.tagName === 'Badge') {
                if (p.variant?.value === 'light') bucket.redundantDefaultCount += 1;
                if (p.color?.value === 'brand') bucket.redundantDefaultCount += 1;
                if (p.tt?.value === 'none' || p.tt?.value === 'lowercase') bucket.disallowedVariantCount += 1;
                if (p.color?.stringLiterals?.some((s) => DISALLOWED_MANTINE_COLOR_TOKENS.has(s))) {
                    bucket.disallowedVariantCount += 1;
                }
            } else if (el.tagName === 'Card') {
                if (p.padding?.value === 'lg') bucket.redundantDefaultCount += 1;
                if (p.shadow?.value === 'md') bucket.redundantDefaultCount += 1;
                if (p.withBorder?.kind === 'boolean' && p.withBorder.value === false) bucket.redundantDefaultCount += 1;
                if (p.bg?.value === 'white') bucket.disallowedVariantCount += 1;
            } else if (el.tagName === 'Paper') {
                if (p.bg?.value === 'white') bucket.disallowedVariantCount += 1;
            } else if (el.tagName === 'Title') {
                if (p.fw?.kind === 'number' && p.fw.value !== 900) bucket.disallowedVariantCount += 1;
            } else if (el.tagName === 'Text') {
                if (p.component?.value === 'div' || p.component?.value === 'li') bucket.disallowedVariantCount += 1;
                if (
                    (p.size?.kind === 'string' && /^\d+px$/.test(p.size.value)) ||
                    (p.fz?.kind === 'string' && /^\d+px$/.test(p.fz.value)) ||
                    (p.fz?.kind === 'number' && p.fz.value < 16)
                ) {
                    bucket.disallowedVariantCount += 1;
                }
            } else if (el.tagName === 'ThemeIcon') {
                if (p.variant?.value === 'light') bucket.redundantDefaultCount += 1;
                if (p.color?.value === 'brand') bucket.redundantDefaultCount += 1;
            } else if (el.tagName === 'Alert') {
                if (p.variant?.value === 'light') bucket.redundantDefaultCount += 1;
                if (p.color?.value === 'brand') bucket.redundantDefaultCount += 1;
            }
        }
    }

    const formatted = {};
    for (const comp of CORE_VARIANT_COMPONENTS) {
        const b = inventory[comp];
        const variants = [...b.variantMap.values()].sort((a, z) => z.count - a.count || a.signature.localeCompare(z.signature));
        formatted[comp] = {
            totalInstances: b.totalInstances,
            fileCount: b.fileSet.size,
            distinctVariants: variants.length,
            redundantDefaultCount: b.redundantDefaultCount,
            disallowedVariantCount: b.disallowedVariantCount,
            variants,
        };
    }

    return { components: formatted, rawHtmlCounts };
}

let cachedSnapshot = null;

export function getAuditSnapshot() {
    if (cachedSnapshot) return cachedSnapshot;

    const absPaths = walkDir(SRC_DIR);
    const files = [];
    const filesByRel = new Map();

    for (const absPath of absPaths) {
        const relPath = toPosix(path.relative(SRC_DIR, absPath));
        if (relPath.endsWith('.ts') || relPath.endsWith('.tsx') || relPath.endsWith('.js') || relPath.endsWith('.mjs')) {
            const parsed = analyzeTsFile(absPath, relPath);
            files.push(parsed);
            filesByRel.set(relPath, parsed);
        } else {
            files.push({
                absPath,
                relPath,
                repoRelPath: `apps/frontend/src/${relPath}`,
                ext: path.extname(relPath),
                category: classifyFile(relPath),
                sourceText: fs.readFileSync(absPath, 'utf8'),
                imports: [],
                jsxElements: [],
                hasJsx: false,
                hexLiterals: [],
                funcColorLiterals: [],
                colorHelperLiterals: [],
                suppressComments: [],
                consoleCalls: [],
                dangerouslySetInnerHTML: [],
                fontFamilyStyleOverrides: [],
                styleVisualOverrides: [],
                tailwindColorClasses: [],
                tailwindTypographyClasses: [],
            });
            filesByRel.set(relPath, files[files.length - 1]);
        }
    }

    const globalsCssPath = path.join(SRC_DIR, 'app', 'globals.css');
    const globalsCss = parseGlobalsCss(globalsCssPath);
    const theme = parseBrandThemeFiles(filesByRel);
    const eslintConfigText = fs.readFileSync(path.join(FRONTEND_DIR, 'eslint.config.mjs'), 'utf8');
    const variantInventory = buildVariantInventory(files);

    cachedSnapshot = {
        files,
        filesByRel,
        tsxFiles: files.filter((f) => f.ext === '.tsx'),
        uiFiles: files.filter((f) => f.category === 'ui'),
        uiTsxFiles: files.filter((f) => f.category === 'ui' && f.ext === '.tsx'),
        ogFiles: files.filter((f) => f.category === 'og'),
        serverFiles: files.filter((f) => f.category === 'server'),
        themeFiles: files.filter((f) => f.category === 'theme'),
        globalsCss,
        theme,
        eslintConfigText,
        variantInventory,
    };

    return cachedSnapshot;
}

export function getDisallowedRawTagsInFile(file) {
    const allowed = DOCUMENTED_DOM_PRIMITIVE_ALLOWLIST.get(file.relPath) || new Set();
    const hits = [];
    for (const el of file.jsxElements) {
        if (!el.isLowerHtml) continue;
        if (allowed.has(el.tagName)) continue;
        if (DISALLOWED_RAW_HTML_TAGS.has(el.tagName)) {
            hits.push({ tag: el.tagName, line: el.line });
        }
    }
    return hits;
}

export function getDisallowedColorTokensInFile(file) {
    const hits = [];
    for (const el of file.jsxElements) {
        for (const propName of ['color', 'c', 'bg']) {
            const p = el.props[propName];
            if (!p) continue;
            for (const s of p.stringLiterals || []) {
                if (DISALLOWED_MANTINE_COLOR_TOKENS.has(s) || (el.isMantine && s === 'dark')) {
                    hits.push({ token: s, propName, line: el.line, tagName: el.tagName });
                }
            }
        }
    }
    for (const h of file.colorHelperLiterals) {
        hits.push({ token: h.token, propName: 'helper', line: h.line, tagName: '(helper)' });
    }
    return hits;
}

export function buildComplianceReport(snapshot = getAuditSnapshot()) {
    const nonCompliantDetails = {};
    const addViolation = (relPath, rule, line, detail) => {
        if (!nonCompliantDetails[relPath]) nonCompliantDetails[relPath] = [];
        nonCompliantDetails[relPath].push({ rule, line, detail });
    };

    for (const file of snapshot.files) {
        if (file.category === 'server') {
            if (file.hasJsx) addViolation(file.relPath, 'F10-server-jsx', 1, 'JSX found in server/ file');
            continue;
        }
        if (file.category === 'css') {
            for (const h of snapshot.globalsCss.hexLiterals) {
                addViolation(file.relPath, 'F1-css-hex', h.line, `Raw hex ${h.hex}`);
            }
            for (const f of snapshot.globalsCss.funcColorLiterals) {
                addViolation(file.relPath, 'F1-css-func-color', f.line, `Raw color function ${f.value}`);
            }
            continue;
        }

        if (file.suppressComments.length > 0) {
            for (const c of file.suppressComments) {
                addViolation(file.relPath, 'F11-suppress-comment', c.line, c.kind);
            }
        }
        for (const c of file.consoleCalls) {
            addViolation(file.relPath, 'F11-console-call', c.line, `console.${c.method}`);
        }
        for (const d of file.dangerouslySetInnerHTML) {
            addViolation(file.relPath, 'F10-dangerous-html', d.line, d.tagName);
        }

        if (file.category === 'og') {
            const importsBrandColors = file.imports.some(
                (i) =>
                    i.from.includes('theme') &&
                    (i.specifiers.includes('BRAND_COLORS') || i.namespaceImport !== null),
            );
            const hasHexOutsideBrand = file.hexLiterals.filter(
                (h) => !OFFICIAL_HEX_SET.has(h.hex) || file.relPath === 'lib/utils/og-utils.tsx',
            );
            if (file.hexLiterals.length > 0 && !importsBrandColors) {
                addViolation(file.relPath, 'F1-og-brand-colors', file.hexLiterals[0].line, 'OG file missing BRAND_COLORS import');
            }
            for (const h of hasHexOutsideBrand) {
                addViolation(file.relPath, 'F1-og-offbrand-hex', h.line, h.hex);
            }
            for (const fc of file.funcColorLiterals) {
                addViolation(file.relPath, 'F1-og-func-color', fc.line, fc.value);
            }
            continue;
        }

        if (file.category === 'theme') continue;

        for (const raw of getDisallowedRawTagsInFile(file)) {
            if (RAW_SVG_TAGS.has(raw.tag) && file.relPath === 'shared/icons/social.tsx') continue;
            addViolation(file.relPath, 'F6-raw-html', raw.line, `<${raw.tag}>`);
        }

        for (const h of file.hexLiterals) {
            addViolation(file.relPath, 'F1-raw-hex', h.line, h.hex);
        }
        for (const fc of file.funcColorLiterals) {
            addViolation(file.relPath, 'F1-raw-rgba', fc.line, fc.value);
        }
        for (const ct of getDisallowedColorTokensInFile(file)) {
            addViolation(file.relPath, 'F1-unmapped-mantine-color', ct.line, `${ct.propName}="${ct.token}"`);
        }

        for (const el of file.jsxElements) {
            if (el.isMantine && el.props.radius) {
                addViolation(file.relPath, 'F2-manual-radius', el.line, `<${el.tagName} radius=${el.props.radius.text}>`);
            }
            if (el.isMantine && el.props.className) {
                addViolation(file.relPath, 'F6-mantine-classname', el.line, `<${el.tagName} className>`);
            }
            if ((el.tagName === 'Link' || el.tagName === 'ActiveLink') && el.props.className) {
                addViolation(file.relPath, 'F8-link-classname', el.line, `<${el.tagName} className>`);
            }
            if ((el.isLucide || SOCIAL_ICON_TAGS.has(el.tagName)) && el.props.className) {
                addViolation(file.relPath, 'F9-icon-classname', el.line, `<${el.tagName} className>`);
            }
            if (el.tagName === 'Suspense') {
                addViolation(file.relPath, 'F8-suspense', el.line, '<Suspense>');
            }
        }
    }

    const nonCompliantFiles = Object.keys(nonCompliantDetails).sort();
    const totalFilesScanned = snapshot.files.length;

    return {
        generatedAt: new Date().toISOString(),
        totalFilesScanned,
        compliantFiles: totalFilesScanned - nonCompliantFiles.length,
        nonCompliantFilesCount: nonCompliantFiles.length,
        nonCompliantFiles,
        nonCompliantDetails,
        brandColors: snapshot.theme.brandColors,
        variantInventory: snapshot.variantInventory.components,
        totals: {
            rawHtmlTags: snapshot.variantInventory.rawHtmlCounts,
            totalCoreComponentInstances: Object.values(snapshot.variantInventory.components).reduce(
                (sum, c) => sum + c.totalInstances,
                0,
            ),
            totalDistinctVariants: Object.values(snapshot.variantInventory.components).reduce(
                (sum, c) => sum + c.distinctVariants,
                0,
            ),
        },
    };
}

export function formatViolations(list, limit = 15) {
    if (list.length === 0) return 'none';
    const head = list.slice(0, limit).join('\n  - ');
    const extra = list.length > limit ? `\n  ... (+${list.length - limit} more)` : '';
    return `\n  - ${head}${extra}`;
}
