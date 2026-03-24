import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';

const directusUrl = 'http://100.77.182.130:8055';
const token = 'iiAsTm_AsU3Y0rp-n9lkdjUGfjIEqPSI';

async function checkSystemLogsFields() {
    try {
        const directus = createDirectus(directusUrl).with(staticToken(token)).with(rest());
        const logs = await directus.request(readItems('system_logs' as any, {
            limit: 1,
            fields: ['*']
        }));
        
        console.log('--- System Logs Fields ---');
        if (logs.length > 0) {
            console.log(Object.keys(logs[0]));
            console.log('Example data:', JSON.stringify(logs[0], null, 2));
        } else {
            console.log('Collection is empty.');
        }

    } catch (e: any) {
        console.error('Failed to fetch system_logs:', e.message || e);
    }
}

checkSystemLogsFields();
