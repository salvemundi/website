import { createBackendConfig } from "../../eslint.backend.mjs";

export default [
  { ignores: ["eslint.config.mjs"] },
  {
    files: ["scripts/**/*.mjs", "scripts/**/*.js"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly"
      }
    }
  },
  ...createBackendConfig(import.meta.dirname)
];
