import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const eslintConfig = [
    ...compat.extends("next/core-web-vitals", "next/typescript"),
    {
        rules: {
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": "warn",
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
