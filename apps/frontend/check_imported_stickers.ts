import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';

const directusUrl = 'http://100.77.182.130:8055';
const token = 'iiAsTm_AsU3Y0rp-n9lkdjUGfjIEqPSI';

async function checkStickers() {
    try {
        const directus = createDirectus(directusUrl).with(staticToken(token)).with(rest());
        const stickers = await directus.request(readItems('Stickers' as any, {
            filter: {
                location_name: {
                    _eq: 'Imported'
                }
            },
            limit: 5
        }));
        console.log('Sample Imported Stickers:', JSON.stringify(stickers, null, 2));
    } catch (e: any) {
        console.error('Error:', e.message || e);
    }
}

checkStickers();
