import { createDirectus, rest, staticToken, createItem } from '@directus/sdk';

const directusUrl = 'http://100.77.182.130:8055';
const token = 'iiAsTm_AsU3Y0rp-n9lkdjUGfjIEqPSI';

async function testCreateSystemLog() {
    try {
        const directus = createDirectus(directusUrl).with(staticToken(token)).with(rest());
        const result = await directus.request(createItem('system_logs' as any, {
            type: 'test_audit',
            status: 'SUCCESS',
            payload: JSON.stringify({
                user: 'Roan',
                action: 'testing_logging',
                details: 'This is a test log entry'
            })
        }));
        
        console.log('--- Created System Log ---');
        console.log(JSON.stringify(result, null, 2));

    } catch (e: any) {
        console.error('Failed to create system_log:', e.message || e);
    }
}

testCreateSystemLog();
