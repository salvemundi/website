
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DIRECTUS_URL = 'https://dev.salvemundi.nl/api';
const DIRECTUS_TOKEN = '0NGjnriy7TsmWtogK4nFXwB7_YNbNEgY';
const OUTPUT_PATH_ESM = path.join(__dirname, '../src/shared/lib/constants/collections.ts');
const OUTPUT_PATH_CJS = path.join(__dirname, '../../payment-api/services/collections.js');
const COLLECTIONS_TO_SYNC = ['pub_crawl_events', 'pub_crawl_signups', 'pub_crawl_tickets'];

async function generateSchema() {
    console.log('🚀 Starting schema generation...');

    try {
        const response = await fetch(`${DIRECTUS_URL}/fields`, {
            headers: {
                'Authorization': `Bearer ${DIRECTUS_TOKEN}`
            }
        });

        let fields = [];
        if (response.ok) {
            const json = await response.json();
            fields = json.data;
        } else {
            console.warn('⚠️ Could not fetch fields from API (likely unauthorized). Using fallback structure.');
        }

        const schema = {};

        COLLECTIONS_TO_SYNC.forEach(collection => {
            const collectionFields = fields.filter(f => f.collection === collection);

            schema[collection.toUpperCase()] = {
                NAME: collection,
                FIELDS: {}
            };

            if (collectionFields.length > 0) {
                collectionFields.forEach(f => {
                    schema[collection.toUpperCase()].FIELDS[f.field.toUpperCase()] = f.field;
                });
            } else {
                // Hardcoded fallbacks if API fails
                if (collection === 'pub_crawl_events') {
                    ['id', 'name', 'date', 'image', 'description', 'email', 'signups', 'created_at', 'updated_at'].forEach(f => {
                        schema[collection.toUpperCase()].FIELDS[f.toUpperCase()] = f;
                    });
                } else if (collection === 'pub_crawl_signups') {
                    ['id', 'pub_crawl_event_id', 'name', 'email', 'association', 'amount_tickets', 'payment_status', 'transactions', 'created_at', 'updated_at'].forEach(f => {
                        schema[collection.toUpperCase()].FIELDS[f.toUpperCase()] = f;
                    });
                } else if (collection === 'pub_crawl_tickets') {
                    ['id', 'signup_id', 'name', 'initial', 'qr_token', 'checked_in', 'checked_in_at', 'created_at', 'updated_at'].forEach(f => {
                        schema[collection.toUpperCase()].FIELDS[f.toUpperCase()] = f;
                    });
                }
            }
        });

        // Generate ESM Content
        const esmContent = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated on: ${new Date().toISOString()}
 */

export const COLLECTIONS = {
    PUB_CRAWL_EVENTS: '${schema.PUB_CRAWL_EVENTS.NAME}',
    PUB_CRAWL_SIGNUPS: '${schema.PUB_CRAWL_SIGNUPS.NAME}',
    PUB_CRAWL_TICKETS: '${schema.PUB_CRAWL_TICKETS.NAME}',
} as const;

export const FIELDS = {
    EVENTS: {
${Object.entries(schema.PUB_CRAWL_EVENTS.FIELDS).map(([key, val]) => `        ${key}: '${val}',`).join('\n')}
    },
    SIGNUPS: {
${Object.entries(schema.PUB_CRAWL_SIGNUPS.FIELDS).map(([key, val]) => `        ${key}: '${val}',`).join('\n')}
    },
    TICKETS: {
${Object.entries(schema.PUB_CRAWL_TICKETS.FIELDS).map(([key, val]) => `        ${key}: '${val}',`).join('\n')}
    }
} as const;
`;

        // Generate CJS Content
        const cjsContent = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated on: ${new Date().toISOString()}
 */

const COLLECTIONS = {
    PUB_CRAWL_EVENTS: '${schema.PUB_CRAWL_EVENTS.NAME}',
    PUB_CRAWL_SIGNUPS: '${schema.PUB_CRAWL_SIGNUPS.NAME}',
    PUB_CRAWL_TICKETS: '${schema.PUB_CRAWL_TICKETS.NAME}',
};

const FIELDS = {
    EVENTS: {
${Object.entries(schema.PUB_CRAWL_EVENTS.FIELDS).map(([key, val]) => `        ${key}: '${val}',`).join('\n')}
    },
    SIGNUPS: {
${Object.entries(schema.PUB_CRAWL_SIGNUPS.FIELDS).map(([key, val]) => `        ${key}: '${val}',`).join('\n')}
    },
    TICKETS: {
${Object.entries(schema.PUB_CRAWL_TICKETS.FIELDS).map(([key, val]) => `        ${key}: '${val}',`).join('\n')}
    }
};

module.exports = { COLLECTIONS, FIELDS };
`;

        // Write ESM
        const dirEsm = path.dirname(OUTPUT_PATH_ESM);
        if (!fs.existsSync(dirEsm)) fs.mkdirSync(dirEsm, { recursive: true });
        fs.writeFileSync(OUTPUT_PATH_ESM, esmContent);

        // Write CJS
        const dirCjs = path.dirname(OUTPUT_PATH_CJS);
        if (!fs.existsSync(dirCjs)) fs.mkdirSync(dirCjs, { recursive: true });
        fs.writeFileSync(OUTPUT_PATH_CJS, cjsContent);

        console.log(`✅ Schemas generated successfully!`);

    } catch (error) {
        console.error('❌ Schema generation failed:', error);
        process.exit(1);
    }
}

generateSchema();
