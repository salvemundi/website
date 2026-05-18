// apps/services/finance-service/eslint.config.mjs
import { createBackendConfig } from "../../../eslint.backend.mjs";

// We geven de lokale mapnaam door aan de centrale functie
export default createBackendConfig(import.meta.dirname);