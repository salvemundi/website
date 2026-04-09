import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import pg from 'pg';
import { createDirectus, rest, staticToken, readItems, createItem } from '@directus/sdk';

/**
 * SALVE MUNDI - Sync Audit Tool
 * Standalone CLI Utility
 */

const { Pool } = pg;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,
});

async function query(text: string, params: any[]) {
    return pool.query(text, params);
}

function getDirectusClient() {
    return createDirectus(process.env.DIRECTUS_SERVICE_URL!)
        .with(staticToken(process.env.DIRECTUS_STATIC_TOKEN!))
        .with(rest());
}

const COLLECTIONS = [
    { name: 'events', pgTable: 'events', directusCollection: 'events' },
    { name: 'event_signups', pgTable: 'event_signups', directusCollection: 'event_signups' },
    { name: 'trip_signups', pgTable: 'trip_signups', directusCollection: 'trip_signups' }
];

async function auditCollection(collection: typeof COLLECTIONS[0], repair: boolean = false) {
    console.log(`\n--- Auditing ${collection.name} ---`);
    const directus = getDirectusClient();
    
    // 1. Fetch from Postgres
    const { rows: pgRows } = await query(`SELECT * FROM ${collection.pgTable}`, []);
    
    // 2. Fetch from Directus
    const directusItems = await directus.request(readItems(collection.directusCollection as any, {
        fields: ['id'],
        limit: -1
    }));
    const directusIds = new Set((directusItems as any[]).map(i => i.id));
    
    // 3. Find missing
    const missingInDirectus = pgRows.filter(r => !directusIds.has(r.id));
    
    console.log(`Postgres: ${pgRows.length} items`);
    console.log(`Directus: ${directusIds.size} items`);
    console.log(`Missing: ${missingInDirectus.length} items`);
    
    if (missingInDirectus.length > 0 && repair) {
        process.stdout.write(`Repairing ${missingInDirectus.length} items...`);
        for (const item of missingInDirectus) {
            try {
                const payload = { ...item };
                // Ensure dates are ISO strings
                for (const key in payload) {
                    if (payload[key] instanceof Date) {
                        payload[key] = payload[key].toISOString();
                    }
                }
                if (collection.name === 'events') payload.status = payload.status || 'published';

                await directus.request(createItem(collection.directusCollection as any, payload));
            } catch (e) {
                console.error(`\n[ERROR] Failed ID ${item.id}:`, (e as any).message);
            }
        }
        console.log(' Done.');
    } else if (missingInDirectus.length > 0) {
        console.log('Use --repair to sync.');
    }
}

async function main() {
    const repair = process.argv.includes('--repair');
    try {
        for (const col of COLLECTIONS) await auditCollection(col, repair);
    } catch (e) {
        console.error('Audit failed:', e);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

main();
