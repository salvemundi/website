import { createDirectus, rest, staticToken, type DirectusClient, type RestClient, type StaticTokenClient } from '@directus/sdk';
import { Directus } from '@salvemundi/validations';

let _directus: DirectusClient<Directus.Schema> & RestClient<Directus.Schema> & StaticTokenClient<Directus.Schema> | null = null;

export function getDirectusClient() {
    if (_directus) return _directus;

    const url = process.env.DIRECTUS_SERVICE_URL || process.env.DIRECTUS_URL || 'http://v7-core-directus:8055';
    const token = process.env.DIRECTUS_STATIC_TOKEN;

    if (!token) {
        throw new Error('Missing DIRECTUS_STATIC_TOKEN in environment variables');
    }

    _directus = createDirectus<Directus.Schema>(url)
        .with(staticToken(token))
        .with(rest());

    return _directus;
}