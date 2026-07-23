import { parseEnv } from "./config/env.js";
import { MonitoringProvisioner } from "./services/provisioner.js";

async function main(): Promise<void> {
    try {
        const config = parseEnv();
        const provisioner = new MonitoringProvisioner(config);
        await provisioner.run();
        process.exit(0);
    } catch (error) {
        console.error("[index.ts][main] Fatal error during provisioning:", error);
        process.exit(1);
    }
}

void main();
