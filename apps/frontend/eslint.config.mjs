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
    ...compat.extends("next/core-web-vitals", "next/typescript"),
    securityPlugin.configs.recommended,
    {
        plugins: {
            "unused-imports": unusedImports,
        },
        rules: {
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": "off",
            "unused-imports/no-unused-imports": "error",
            "unused-imports/no-unused-vars": [
                "warn",
                {
                    "vars": "all",
                    "varsIgnorePattern": "^_",
                    "args": "after-used",
                    "argsIgnorePattern": "^_",
                },
            ],
            "react/no-unescaped-entities": "warn",
            "@typescript-eslint/no-non-null-asserted-optional-chain": "warn",
            "prefer-const": "warn",
            "prefer-rest-params": "warn",
            "@typescript-eslint/ban-ts-comment": "warn",
            "@next/next/no-html-link-for-pages": "warn"
        }
    }
];

export default eslintConfig;
