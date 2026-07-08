import securityPlugin from "eslint-plugin-security";
import unusedImports from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";
import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";

export function createBackendConfig(serviceDirName) {
    return defineConfig([
        { ignores: ["dist/**", "build/**", ".next/**", "node_modules/**", "eslint.config.mjs", "eslint.config.js", "**/directus/schema.ts"] },
        eslint.configs.recommended,
        ...tseslint.configs.recommendedTypeChecked,
        {
            files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
            ...tseslint.configs.disableTypeChecked,
        },
        securityPlugin.configs.recommended,
        {
            files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
            languageOptions: {
                parserOptions: {
                    project: true,
                    tsconfigRootDir: serviceDirName,
                },
            },
        },
        {
            files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
            plugins: {
                "unused-imports": unusedImports,
            },
            rules: {
                "@typescript-eslint/no-unnecessary-condition": "error",
                "no-constant-condition": "error",
                "no-eval": "error",
                "no-implied-eval": "error",
                "eqeqeq": ["error", "always"],
                "@typescript-eslint/no-floating-promises": "error",
                "@typescript-eslint/await-thenable": "error",
                "@typescript-eslint/no-misused-promises": "error",
                "@typescript-eslint/require-await": "off",
                "@typescript-eslint/no-explicit-any": "off",
                "@typescript-eslint/no-unsafe-assignment": "off",
                "@typescript-eslint/no-unsafe-member-access": "off",
                "@typescript-eslint/no-unsafe-return": "off",
                "@typescript-eslint/no-unsafe-argument": "off",
                "@typescript-eslint/no-unsafe-call": "off",
                "@typescript-eslint/ban-ts-comment": "error",
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
                "prefer-const": "error",
                "prefer-rest-params": "error",
                "no-restricted-syntax": [
                    "error",
                    {
                        "selector": "CallExpression[callee.object.name='console'][callee.property.name=/^(log|warn|error|info|debug)$/]",
                        "message": "Do not use console methods directly. Use safeConsoleError or the centralized logger to ensure logs are tracked correctly."
                    }
                ]
            }
        },
        {
            files: ["src/utils/logger.ts", "src/utils/log-sanitizer.ts", "src/server.ts"],
            rules: {
                "no-restricted-syntax": "off",
                "@typescript-eslint/no-explicit-any": "off"
            }
        }
    ]);
}