import { createDirectus, rest, staticToken, DirectusClient, RestClient, StaticTokenClient } from '@directus/sdk';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.DIRECTUS_URL || 'http://directus:8055';
const token = process.env.DIRECTUS_STATIC_TOKEN;

let _directus: any = null;

export function getDirectusClient() {
    if (_directus) return _directus;

    if (!token) {
        throw new Error('Missing DIRECTUS_STATIC_TOKEN in environment variables');
    }

    _directus = createDirectus(url)
        .with(staticToken(token))
        .with(rest());
    
    return _directus;
}
