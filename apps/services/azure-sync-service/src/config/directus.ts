import { createDirectus, rest, staticToken, type DirectusClient, type RestClient, type StaticTokenClient } from '@directus/sdk';
import { type Schema } from '../types/schema.js';

export type DirectusClientType = DirectusClient<Schema> & StaticTokenClient<Schema> & RestClient<Schema>;

let directus: DirectusClientType | null = null;

export function getDirectusClient(): DirectusClientType {
    if (directus) return directus;

    const url = process.env.DIRECTUS_SERVICE_URL || process.env.DIRECTUS_URL;
    const token = process.env.DIRECTUS_STATIC_TOKEN;

    if (!url || !token) {
        throw new Error('Missing DIRECTUS_SERVICE_URL / DIRECTUS_URL or DIRECTUS_STATIC_TOKEN in environment variables');
    }

    const client: DirectusClientType = createDirectus<Schema>(url)
        .with(staticToken(token))
        .with(rest());

    directus = client;
    return directus;
}