import { createBackendConfig } from "../../eslint.backend.mjs";
export default [
  { ignores: ["eslint.config.mjs"] },
  ...createBackendConfig(import.meta.dirname)
];
