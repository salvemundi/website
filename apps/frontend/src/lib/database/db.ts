import 'server-only';
import { db as drizzleDb, schema, client } from '@salvemundi/db';
import { safeConsoleError } from '@/server/utils/logger';
import { Pool } from 'pg';

export const db = drizzleDb;
export { schema };

const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT;
const dbName = process.env.DB_NAME;

const connectionString = process.env.DATABASE_URL || (dbUser && dbPassword && dbHost && dbName ? `postgres://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}` : undefined);

export const pool = new Pool({ connectionString, max: 20 });

export async function query<T = unknown>(text: string, params?: unknown[], retries = 2): Promise<{ rows: T[], rowCount: number }> {
    for (let i = 0; i <= retries; i++) {
        try {
            const safeParams = (params ?? []) as unknown[];
            const result = await client.unsafe(text, safeParams as never[]);
            return { rows: result as unknown as T[], rowCount: result.count };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            safeConsoleError('[db.ts][query]', `Query failed: ${errorMessage}`);
            throw error;
        }
    }
    throw new Error('db.ts][query] Unexpected end of function');
}