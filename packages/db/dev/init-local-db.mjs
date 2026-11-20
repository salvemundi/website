import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { connectionString } from './local-env.mjs';

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workDir = join(packageDir, 'dev', '.tmp');

// Directus creates directus_users itself; the site stores these extra profile fields on it.
const directusUserColumns = [
    'entra_id varchar(255)',
    'fontys_email varchar(255)',
    'phone_number varchar(255)',
    "membership_status varchar(20) DEFAULT 'none'",
    'membership_expiry date',
    'minecraft_username varchar(100)',
    'photo_etag varchar(255)',
    'date_of_birth date',
    'originele_betaaldatum date',
    'emailverified boolean DEFAULT false',
    'image text',
    'name text',
    'createdat timestamptz DEFAULT now()',
    'updatedat timestamptz DEFAULT now()',
];

// drizzle/schema.ts lists these in snake_case, but Better Auth reads and writes camelCase columns.
const betterAuthColumns = {
    auth_sessions: ['expiresAt', 'createdAt', 'updatedAt', 'ipAddress', 'userAgent', 'userId'],
    auth_accounts: ['accountId', 'providerId', 'userId', 'accessToken', 'refreshToken', 'idToken', 'accessTokenExpiresAt', 'refreshTokenExpiresAt', 'createdAt', 'updatedAt'],
    verification: ['expiresAt', 'createdAt', 'updatedAt'],
};

function generateAppTablesSql() {
    rmSync(workDir, { recursive: true, force: true });
    mkdirSync(workDir, { recursive: true });

    // The pulled schema carries operator classes that don't match their column types (e.g. int4_ops on booleans).
    const schema = readFileSync(join(packageDir, 'drizzle', 'schema.ts'), 'utf8').replace(/\.op\("[a-z0-9_]+"\)/g, '');
    writeFileSync(join(workDir, 'schema.ts'), schema);

    // Directus creates its own system tables on bootstrap, so only the site's tables are generated here.
    const appTables = [...schema.matchAll(/^export const (\w+) = pgTable\(/gm)]
        .map(([, name]) => name)
        .filter((name) => !name.startsWith('directus_'));
    writeFileSync(join(workDir, 'app-schema.ts'), `export { ${appTables.join(', ')} } from './schema';\n`);

    execFileSync(join(packageDir, 'node_modules', '.bin', 'drizzle-kit'), [
        'generate',
        '--dialect', 'postgresql',
        '--casing', 'snake_case',
        '--schema', join(workDir, 'app-schema.ts'),
        '--out', join(workDir, 'migrations'),
        '--name', 'app',
    ], { cwd: packageDir, stdio: 'inherit' });

    const migrationsDir = join(workDir, 'migrations');
    const file = readdirSync(migrationsDir).find((name) => name.endsWith('.sql'));
    return readFileSync(join(migrationsDir, file), 'utf8');
}

function toSnakeCase(name) {
    return name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

async function main() {
    const sql = postgres(connectionString(), { max: 1, onnotice: () => {} });
    try {
        const [{ directusReady }] = await sql`SELECT to_regclass('public.directus_users') IS NOT NULL AS "directusReady"`;
        if (!directusReady) {
            throw new Error('directus_users does not exist yet. Start Directus first so it can bootstrap its tables.');
        }

        const [{ initialised }] = await sql`SELECT to_regclass('public.events') IS NOT NULL AS initialised`;
        const appTablesSql = initialised ? null : generateAppTablesSql();

        await sql.begin(async (tx) => {
            await tx.unsafe(`ALTER TABLE directus_users ${directusUserColumns.map((column) => `ADD COLUMN IF NOT EXISTS ${column}`).join(', ')}`);
            await tx.unsafe('CREATE INDEX IF NOT EXISTS idx_directus_users_entra_id ON directus_users (entra_id)');

            if (appTablesSql) await tx.unsafe(appTablesSql);

            for (const [table, columns] of Object.entries(betterAuthColumns)) {
                const existing = new Set((await tx`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ${table}`).map((row) => row.column_name));
                for (const column of columns) {
                    const snake = toSnakeCase(column);
                    if (existing.has(snake) && !existing.has(column)) {
                        await tx.unsafe(`ALTER TABLE "${table}" RENAME COLUMN "${snake}" TO "${column}"`);
                    }
                }
            }
        });

        console.log(initialised ? 'App tables already existed; profile and auth columns checked.' : 'Local database initialised.');
    } finally {
        await sql.end();
        rmSync(workDir, { recursive: true, force: true });
    }
}

await main();
