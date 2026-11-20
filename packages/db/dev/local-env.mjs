import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendEnv = resolve(dirname(fileURLToPath(import.meta.url)), '../../../apps/frontend/.env.local');

if (existsSync(frontendEnv)) process.loadEnvFile(frontendEnv);

export function connectionString() {
    if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
    const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = process.env;
    if (!DB_USER || !DB_PASSWORD || !DB_HOST || !DB_PORT || !DB_NAME) {
        throw new Error(`Set DATABASE_URL or the DB_* variables in ${frontendEnv}`);
    }
    return `postgres://${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASSWORD)}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
}

export function directusConfig() {
    const url = process.env.INTERNAL_DIRECTUS_URL;
    const token = process.env.DIRECTUS_STATIC_TOKEN;
    if (!url || !token) throw new Error(`Set INTERNAL_DIRECTUS_URL and DIRECTUS_STATIC_TOKEN in ${frontendEnv}`);
    return { url, token };
}
