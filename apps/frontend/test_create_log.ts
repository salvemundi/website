import { createDirectus, rest, staticToken, createItem } from '@directus/sdk';

const directusUrl = 'http://100.77.182.130:8055';
const token = 'iiAsTm_AsU3Y0rp-n9lkdjUGfjIEqPSI';

async function testCreateLog() {
    try {
        const directus = createDirectus(directusUrl).with(staticToken(token)).with(rest());
        const result = await directus.request(createItem('audit_logs' as any, {
            action: 'test_action',
            target_collection: 'test',
            target_id: '123'
        }));
        
        console.log('--- Created Audit Log ---');
        console.log(JSON.stringify(result, null, 2));

    } catch (e: any) {
        console.error('Failed to create audit_log:', e.message || e);
    }
}

testCreateLog();
