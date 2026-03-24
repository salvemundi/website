import { createDirectus, rest, staticToken, deleteItem, createItem, readItem } from '@directus/sdk';

const directusUrl = 'http://100.77.182.130:8055';
const token = 'iiAsTm_AsU3Y0rp-n9lkdjUGfjIEqPSI';

async function testDelete() {
    try {
        const directus = createDirectus(directusUrl).with(staticToken(token)).with(rest());
        
        // 1. Create a dummy sticker
        console.log('Creating dummy sticker...');
        const newSticker = await directus.request(createItem('Stickers' as any, {
            location_name: 'Test Delete',
            latitude: 0,
            longitude: 0
        }));
        console.log('Created sticker ID:', newSticker.id);

        // 2. Try to delete it
        console.log('Attempting to delete...');
        await directus.request(deleteItem('Stickers' as any, newSticker.id));
        console.log('Delete call finished.');

        // 3. Verify it's gone
        try {
            await directus.request(readItem('Stickers' as any, newSticker.id));
            console.log('ERROR: Sticker still exists!');
        } catch (e) {
            console.log('SUCCESS: Sticker is gone (caught 404/error).');
        }

    } catch (e: any) {
        console.error('Test failed with error:', e.message || e);
        if (e.response) {
            console.error('Response data:', JSON.stringify(e.response, null, 2));
        }
    }
}

testDelete();
