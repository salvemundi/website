import { createDirectus, rest, staticToken } from '@directus/sdk';

const directusUrl = 'http://100.77.182.130:8055';
const token = 'iiAsTm_AsU3Y0rp-n9lkdjUGfjIEqPSI';

async function listCollections() {
    try {
        const directus = createDirectus(directusUrl).with(staticToken(token)).with(rest());
        // In Directus SDK, listing collections is via system or just trying to read from well-known ones
        // But we can try to fetch from /collections (requires admin usually)
        
        const res = await fetch(`${directusUrl}/collections`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await res.json();
        
        console.log('--- All Collections ---');
        if (data.data) {
            data.data.forEach((c: any) => console.log(c.collection));
        } else {
            console.log('Permission denied for /collections listing.');
        }

    } catch (e: any) {
        console.error('Failed to list collections:', e.message || e);
    }
}

listCollections();
