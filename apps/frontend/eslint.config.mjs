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

const eslintConfig = [
    { ignores: [".next/", "node_modules/", "dist/"] },
    ...nextConfig,
    securityPlugin.configs.recommended,
    {
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
                "warn",
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
                    "selector": "JSXOpeningElement[name.name='input']:not(:has(JSXAttribute[name.name='type'][value.value=/hidden|checkbox|radio|file/])):not(:has(JSXAttribute[name.name='className'] Literal[value=/form-input|beheer-input|sr-only|hidden/])):not(:has(JSXAttribute[name.name='className'] TemplateElement[value.raw=/form-input|beheer-input|sr-only|hidden/]))",
                    "message": "Zichtbare rauwe <input> gevonden zonder 'form-input' of 'beheer-input' klasse."
                },
                {
                    "selector": "JSXOpeningElement[name.name='button']:not(:has(JSXAttribute[name.name='className'] Literal[value=/form-button|beheer-button|icon-button|tab-button|btn-/])):not(:has(JSXAttribute[name.name='className'] TemplateElement[value.raw=/form-button|beheer-button|icon-button|tab-button|btn-/]))",
                    "message": "Rauwe <button> gevonden zonder 'form-button', 'beheer-button', 'icon-button', 'tab-button' of 'btn-*' klasse."
                },
                {
                    "selector": "JSXOpeningElement[name.name='select']:not(:has(JSXAttribute[name.name='className'] Literal[value=/form-input|beheer-input|beheer-select/])):not(:has(JSXAttribute[name.name='className'] TemplateElement[value.raw=/form-input|beheer-input|beheer-select/]))",
                    "message": "Rauwe <select> gevonden zonder geldige klasse."
                },
                {
                    "selector": "JSXOpeningElement[name.name='textarea']:not(:has(JSXAttribute[name.name='className'] Literal[value=/form-input|beheer-input/])):not(:has(JSXAttribute[name.name='className'] TemplateElement[value.raw=/form-input|beheer-input/]))",
                    "message": "Rauwe <textarea> gevonden zonder 'form-input' of 'beheer-input' klasse."
                }
            ],

            "react-hooks/set-state-in-effect": "off",
            "react-hooks/incompatible-library": "off"
        }
    },
    {
        files: ["src/shared/ui/**/*", "src/components/ui/**/*"],
        rules: {
            "no-restricted-syntax": "off"
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
        files: ["src/app/**/opengraph-image.tsx", "src/app/**/twitter-image.tsx"],
        rules: {
            "@next/next/no-img-element": "off"
        }
    }
];

export default eslintConfig;