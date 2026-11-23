// apps/services/mobile-notification-service/eslint.config.mjs
import globals from "globals";
import { createBackendConfig } from "../../../eslint.backend.mjs";

// Plain .mjs worker: backend config plus Node globals
export default [
    ...createBackendConfig(import.meta.dirname),
    { languageOptions: { globals: globals.node } },
];
