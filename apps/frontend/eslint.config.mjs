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

const eslintConfig = [
    { ignores: [".next/", "node_modules/", "dist/"] },
    ...compat.extends("next/core-web-vitals", "next/typescript"),
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
        },
        rules: {
            // ==========================================
            // 🚨 1. HARDCORE SECURITY & LOGIC BUGS (CodeQL)
            // ==========================================
            "@typescript-eslint/no-unnecessary-condition": "error",
            "no-constant-condition": "error",
            "no-eval": "error", // Blokkeert eval() (RCE gevaar)
            "no-implied-eval": "error", // Blokkeert setTimeout("string")
            "eqeqeq": ["error", "always"], // Forceert === (Voorkomt Type Coercion bugs)

            // ==========================================
            // ⏱️ 2. ASYNC & RACE CONDITION PREVENTIE
            // ==========================================
            // Dit is cruciaal voor je finance-service en ticket-verkoop!
            // Blokkeert promises die je vergeet te 'awaiten' (voorkomt ghost-processen en unhandled rejections).
            "@typescript-eslint/no-floating-promises": "error",
            // Voorkomt dat je 'await' gebruikt op iets dat geen promise is.
            "@typescript-eslint/await-thenable": "error",
            // Voorkomt dat je een asynchrone functie meegeeft aan een event handler die dat niet verwacht.
            "@typescript-eslint/no-misused-promises": "error",

            // ==========================================
            // 🛡️ 3. REACT & XSS PREVENTIE
            // ==========================================
            // Verbiedt het direct injecteren van ongewassen HTML.
            // Dit dwingt ontwikkelaars om <SafeMarkdown> componenten te gebruiken!
            "react/no-danger": "error",
            // Voorkomt Reverse Tabnabbing bij externe links.
            "react/jsx-no-target-blank": "error",

            // ==========================================
            // 🧱 4. STRICTE TYPE VEILIGHEID (Geen 'Any' sluiproutes)
            // ==========================================
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-unsafe-assignment": "error",
            "@typescript-eslint/no-unsafe-member-access": "error",
            "@typescript-eslint/no-unsafe-return": "error",
            "@typescript-eslint/no-unsafe-argument": "error",
            "@typescript-eslint/ban-ts-comment": "error", // @ts-ignore is verboden
            "@typescript-eslint/no-non-null-asserted-optional-chain": "error",
            "@typescript-eslint/no-non-null-assertion": "error", // Verbiedt obj!.property (forceert nette checks)

            // ==========================================
            // 🧹 5. CODE HYGIËNE & CLEANUP
            // ==========================================
            "@typescript-eslint/no-unused-vars": "off", // Uitgezet ten gunste van unused-imports
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

            // ==========================================
            // 🚫 6. CUSTOM RESTRICTIONS (Architectuur)
            // ==========================================
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
                }
            ]
        }
    },
    // ---- UITZONDERINGEN (Tenzij het echt niet anders kan) ----
    {
        files: ["src/server/utils/logger.ts", "src/server/utils/log-sanitizer.ts"],
        rules: {
            "no-restricted-syntax": "off"
        }
    },
    {
        files: ["src/server/auth/auth-utils.ts", "src/server/auth/redis-session-plugin.ts", "src/server/auth/auth.ts"],
        rules: {
            // Deze bestanden interacteren direct met externe library types (Better Auth) die intern 'any' gebruiken
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
    }
];

export default eslintConfig;
