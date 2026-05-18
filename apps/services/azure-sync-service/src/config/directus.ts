import { createDirectus, rest, staticToken, DirectusClient, RestClient, StaticTokenClient } from '@directus/sdk';
import { DirectusSchema } from '@salvemundi/validations';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.DIRECTUS_SERVICE_URL || process.env.DIRECTUS_URL || 'http://v7-core-directus:8055';
const token = process.env.DIRECTUS_STATIC_TOKEN;

let _directus: DirectusClient<DirectusSchema> & RestClient<DirectusSchema> & StaticTokenClient<DirectusSchema> | null = null;

export function getDirectusClient() {
    if (_directus) return _directus;

    if (!token) {
        throw new Error('Missing DIRECTUS_STATIC_TOKEN in environment variables');
    }

    _directus = createDirectus<DirectusSchema>(url)
        .with(staticToken(token))
        .with(rest());

    return _directus;
}
