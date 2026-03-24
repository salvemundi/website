import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';

const directusUrl = 'http://100.77.182.130:8055';
const token = 'iiAsTm_AsU3Y0rp-n9lkdjUGfjIEqPSI';

async function checkSystemLogs() {
    try {
        const directus = createDirectus(directusUrl).with(staticToken(token)).with(rest());
        const logs = await directus.request(readItems('system_logs' as any, {
            limit: 5
        }));
        
        console.log('--- System Logs (Success) ---');
        console.log(JSON.stringify(logs, null, 2));

    } catch (e: any) {
        console.error('Failed to fetch system_logs:', e.message || e);
    }
}

checkSystemLogs();
