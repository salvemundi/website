// apps/services/monitoring-service/eslint.config.mjs
import { createBackendConfig } from "../../../eslint.backend.mjs";

const baseConfig = createBackendConfig(import.meta.dirname);

export default [
    ...baseConfig,
    {
        rules: {
            "no-restricted-syntax": "off",
        },
    },
];
