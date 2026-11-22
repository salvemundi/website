import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

import securityPlugin from "eslint-plugin-security";
import unusedImports from "eslint-plugin-unused-imports";
import eslintComments from "eslint-plugin-eslint-comments";
import nextConfig from "eslint-config-next";
import tsEslint from "@typescript-eslint/eslint-plugin";
import tailwindPlugin from "eslint-plugin-tailwindcss";

const eslintConfig = [
    { ignores: [".next/", "node_modules/", "dist/", "public/sw.js", "public/workbox-*.js"] },
    ...nextConfig,
    securityPlugin.configs.recommended,
    tailwindPlugin.configs.recommended,
    {
        settings: {
            tailwindcss: {
                callees: ["cn", "clsx", "cva"],
                cssConfigPath: "src/app/globals.css",
            },
        },
        rules: {
            "tailwindcss/no-custom-classname": "off",
        },
    },
    {
        files: ["src/**/*.{js,mjs,cjs,ts,jsx,tsx}"],
        languageOptions: {
            parserOptions: {
                project: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            "unused-imports": unusedImports,
            "eslint-comments": eslintComments,
            "@typescript-eslint": tsEslint,
        },
        rules: {
            "eslint-comments/no-restricted-disable": ["error", "security/detect-object-injection"],
            "@typescript-eslint/no-unnecessary-condition": "error",
            "no-constant-condition": "error",
            "no-eval": "error",
            "no-implied-eval": "error",
            "eqeqeq": ["error", "always"],

            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/await-thenable": "error",
            "@typescript-eslint/no-misused-promises": "error",

            "react/no-danger": "error",
            "react/jsx-no-target-blank": "error",

            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-unsafe-assignment": "error",
            "@typescript-eslint/no-unsafe-member-access": "error",
            "@typescript-eslint/no-unsafe-return": "error",
            "@typescript-eslint/no-unsafe-argument": "error",
            "@typescript-eslint/ban-ts-comment": "error",
            "@typescript-eslint/no-non-null-asserted-optional-chain": "error",
            "@typescript-eslint/no-non-null-assertion": "error",
            "@typescript-eslint/only-throw-error": "error",

            "@typescript-eslint/no-unused-vars": "off",
            "unused-imports/no-unused-imports": "error",
            "unused-imports/no-unused-vars": [
                "error",
                {
                    "vars": "all",
                    "varsIgnorePattern": "^_",
                    "args": "after-used",
                    "argsIgnorePattern": "^_",
                    "caughtErrors": "all",
                    "caughtErrorsIgnorePattern": "^_"
                },
            ],
            "react/no-unescaped-entities": "error",
            "prefer-const": "error",
            "prefer-rest-params": "error",
            "@next/next/no-html-link-for-pages": "error",

            "no-restricted-syntax": [
                "error",
                {
                    "selector": "CallExpression[callee.object.name='console'][callee.property.name=/^(log|warn|error|info|debug)$/]",
                    "message": "Do not use console methods directly. Use safeConsoleError or logInternalError from '@/server/utils/logger' to ensure PII is sanitized and logs are centralized."
                },
                {
                    "selector": "CallExpression[callee.object.object.name='auth'][callee.object.property.name='api'][callee.property.name='getSession']",
                    "message": "Direct calls to auth.api.getSession are strictly forbidden in the frontend. Always use await getEnrichedSession() from '@/server/auth/auth-utils' instead."
                },
                {
                    "selector": "TSTypeReference[typeName.name='Record']:has(TSTypeParameterInstantiation > TSStringKeyword + TSUnknownKeyword)",
                    "message": "No Record<string, unknown>: Strictly forbidden in the project. Use explicit interfaces, Zod-inferred types, or unknown with type guards."
                },
                {
                    "selector": "JSXIdentifier[name='Suspense']",
                    "message": "Zero-Skeleton rendering: `<Suspense>` is strictly forbidden. Await data directly at the component/page level to ensure atomic page loads without intermediate loading states."
                },
                {
                    "selector": "JSXOpeningElement[name.name=/^(div|span|p|h[1-6]|button|select|option|textarea|details|summary|section|header|footer|nav|main|aside|article|ul|ol|li|table|thead|tbody|tfoot|tr|th|td|label|input|form|a|hr|strong|b|em|i|u|br|wbr|style|svg|path|polyline)$/]",
                    "message": "Raw HTML layout, typography, form, table, list, style, and SVG elements are forbidden. Use Mantine components (Box, Flex, Group, Stack, Grid, SimpleGrid, Text, Title, Button, ActionIcon, Select, Textarea, Table, List, Spoiler, VisuallyHidden) or lucide-react icons instead."
                },
                {
                    "selector": "JSXOpeningElement[name.name=/^(Box|Flex|Group|Stack|Grid|GridCol|SimpleGrid|Container|Center|Card|Paper|Button|ActionIcon|CloseButton|UnstyledButton|Text|Title|Anchor|Badge|Pill|Avatar|ThemeIcon|Alert|Modal|Drawer|Tabs|NavLink|Spoiler|Divider|TextInput|Select|NativeSelect|Textarea|Checkbox|Switch|Radio|NumberInput|ColorInput|PasswordInput|FileInput|MultiSelect|DateInput|SegmentedControl|Table|List|Menu|Popover|Tooltip|Loader|Progress|ScrollArea|Typography|Link|ActiveLink|InstagramIcon|FacebookIcon|TiktokIcon|LinkedinIcon|DiscordIcon|SiInstagram|SiFacebook|SiTiktok|FaLinkedin)$/] > JSXAttribute[name.name='className']",
                    "message": "Passing className to Mantine components, Link, or icons is forbidden. Use Mantine style props (p, px, py, gap, fz, fw, c, bg, visibleFrom, hiddenFrom, mod, style) and global theme configuration in theme.ts instead."
                },
                {
                    "selector": "JSXOpeningElement[name.name=/^(Button|ActionIcon|CloseButton|UnstyledButton|Card|Paper|Container|Alert|Badge|Pill|ThemeIcon|Modal|Drawer|Switch|Checkbox|Radio|Progress|TextInput|Select|NativeSelect|Textarea|NumberInput|PasswordInput|FileInput|MultiSelect|DateInput|ColorInput|SegmentedControl|Tabs|ScrollArea)$/] > JSXAttribute[name.name='radius']",
                    "message": "Passing a manual radius prop to Mantine components is forbidden. Radius is managed centrally via the dynamic scale in theme/radius.ts."
                }
            ],

            "react-hooks/set-state-in-effect": "off",
            "react-hooks/incompatible-library": "off"
        }
    },
    {
        files: ["src/server/utils/logger.ts", "src/server/utils/log-sanitizer.ts"],
        rules: {
            "no-restricted-syntax": "off"
        }
    },
    {
        files: ["src/server/auth/auth-utils.ts", "src/server/auth/redis-session-plugin.ts", "src/server/auth/auth.ts"],
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-return": "off",
            "@typescript-eslint/no-unsafe-argument": "off",
            "no-restricted-syntax": "off"
        }
    },
    {
        files: ["src/server/actions/**/*"],
        rules: {
            "security/detect-object-injection": "off"
        }
    },
    {
        files: ["src/app/**/opengraph-image.tsx", "src/app/**/twitter-image.tsx", "src/lib/utils/og-utils.tsx", "src/shared/icons/social.tsx"],
        rules: {
            "@next/next/no-img-element": "off",
            "no-restricted-syntax": "off"
        }
    }
];

export default eslintConfig;