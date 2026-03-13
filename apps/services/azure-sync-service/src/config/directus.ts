import { createDirectus, rest, staticToken, DirectusClient, RestClient, StaticTokenClient } from '@directus/sdk';
import { Schema } from '../types/schema.js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.DIRECTUS_URL || 'http://directus:8055';
const token = process.env.DIRECTUS_STATIC_TOKEN;

let _directus: DirectusClient<Schema> & RestClient<Schema> & StaticTokenClient<Schema> | null = null;

export function getDirectusClient() {
    if (_directus) return _directus;

    if (!token) {
        throw new Error('Missing DIRECTUS_STATIC_TOKEN in environment variables');
    }

    _directus = createDirectus<Schema>(url)
        .with(staticToken(token))
        .with(rest());
    
    return _directus;
}
