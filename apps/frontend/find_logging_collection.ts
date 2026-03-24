import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';

const directusUrl = 'http://100.77.182.130:8055';
const token = 'iiAsTm_AsU3Y0rp-n9lkdjUGfjIEqPSI';

async function findLoggingCollection() {
    const names = ['audit_logs', 'Audit_Logs', 'audit_log', 'AuditLog', 'Audit_log', 'directus_activity', 'logs', 'AdminLogs'];
    const directus = createDirectus(directusUrl).with(staticToken(token)).with(rest());
    
    console.log('--- Testing Collection Names ---');
    for (const name of names) {
        try {
            const result = await directus.request(readItems(name as any, { limit: 1 }));
            console.log(`[FOUND] ${name} (count: ${result.length})`);
        } catch (e: any) {
            console.log(`[NOT FOUND/DENIED] ${name}: ${e.message}`);
        }
    }
}

findLoggingCollection();
