import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';

const directusUrl = 'http://100.77.182.130:8055';
const token = 'iiAsTm_AsU3Y0rp-n9lkdjUGfjIEqPSI';

async function checkAuditLogs() {
    try {
        const directus = createDirectus(directusUrl).with(staticToken(token)).with(rest());
        const logs = await directus.request(readItems('audit_logs' as any, {
            limit: 10,
            sort: ['-date_created'] as any,
            fields: ['*']
        }));
        
        console.log('--- Recent Audit Logs ---');
        console.log(JSON.stringify(logs, null, 2));

    } catch (e: any) {
        console.error('Failed to fetch audit_logs:', e.message || e);
    }
}

checkAuditLogs();
