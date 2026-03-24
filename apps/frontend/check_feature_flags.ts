import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';

const directusUrl = 'http://100.77.182.130:8055';
const token = 'iiAsTm_AsU3Y0rp-n9lkdjUGfjIEqPSI';

async function checkFeatureFlags() {
    try {
        const directus = createDirectus(directusUrl).with(staticToken(token)).with(rest());
        const flags = await directus.request(readItems('feature_flags' as any, {
            limit: 5
        }));
        
        console.log('--- Feature Flags (Success) ---');
        console.log(JSON.stringify(flags, null, 2));

    } catch (e: any) {
        console.error('Failed to fetch feature_flags:', e.message || e);
    }
}

checkFeatureFlags();
