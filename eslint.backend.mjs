import securityPlugin from "eslint-plugin-security";
import unusedImports from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";
import eslint from "@eslint/js";

export function createBackendConfig(serviceDirName) {
    return tseslint.config(
        { ignores: ["dist/**", "build/**", ".next/**", "node_modules/**"] },
        eslint.configs.recommended,
        ...tseslint.configs.recommendedTypeChecked,
        securityPlugin.configs.recommended,
        {
            languageOptions: {
                parserOptions: {
                    project: true,
                    tsconfigRootDir: serviceDirName,
                },
            },
            plugins: {
                "unused-imports": unusedImports,
            },
            rules: {
                // 1. HARDCORE SECURITY & LOGIC BUGS
                "@typescript-eslint/no-unnecessary-condition": "error",
                "no-constant-condition": "error",
                "no-eval": "error",
                "no-implied-eval": "error",
                "eqeqeq": ["error", "always"],

                // 2. ASYNC & DATABASE VEILIGHEID
                "@typescript-eslint/no-floating-promises": "error",
                "@typescript-eslint/await-thenable": "error",
                "@typescript-eslint/no-misused-promises": "error",

                // 3. STRICTE TYPE VEILIGHEID
                "@typescript-eslint/no-explicit-any": "error",
                "@typescript-eslint/no-unsafe-assignment": "error",
                "@typescript-eslint/no-unsafe-member-access": "error",
                "@typescript-eslint/no-unsafe-return": "error",
                "@typescript-eslint/no-unsafe-argument": "error",
                "@typescript-eslint/ban-ts-comment": "error",
                "@typescript-eslint/no-non-null-assertion": "error",

                // 4. CODE HYGIËNE & CLEANUP
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

                // 5. BACKEND ARCHITECTUUR REGELS
                "no-restricted-syntax": [
                    "error",
                    {
                        "selector": "CallExpression[callee.object.name='console'][callee.property.name=/^(log|warn|error|info|debug)$/]",
                        "message": "Do not use console methods directly. Use safeConsoleError or the centralized logger to ensure logs are tracked correctly."
                    }
                ]
            }
        },
        // UITZONDERINGEN VOOR DE BACKEND
        {
            files: ["src/utils/logger.ts", "src/utils/log-sanitizer.ts", "src/server.ts"],
            rules: {
                "no-restricted-syntax": "off",
                "@typescript-eslint/no-explicit-any": "off"
            }
        }
    );
}