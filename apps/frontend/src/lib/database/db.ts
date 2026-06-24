import 'server-only';
import { db as drizzleDb, schema, client } from '@salvemundi/db';
import { safeConsoleError } from '@/server/utils/logger';
import { Pool } from 'pg';

export const db = drizzleDb;
export { schema };

const connectionString = process.env.DATABASE_URL || 'postgres://directusadmin:StXmr5J6LefHRTEp1V4UkKF8wI0ZDcysaOWM2PCulzAQqYvji7bx9BNdgohGn3@100.77.182.130:5432/v7-core-db';
export const pool = new Pool({ connectionString, max: 20 });


export async function query<T = unknown>(text: string, params?: unknown[], retries = 2): Promise<{ rows: T[], rowCount: number }> {
    for (let i = 0; i <= retries; i++) {
        try {
            const safeParams = (params ?? []) as unknown[];
            const result = await client.unsafe(text, safeParams as never[]);
            return { rows: result as unknown as T[], rowCount: result.count };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            safeConsoleError('[db.ts][query] ', `Query failed: ${errorMessage}`);
            throw error;
        }
    }
    throw new Error('db.ts][query] Unexpected end of function');
}