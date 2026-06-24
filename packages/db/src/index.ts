import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as relations from './relations';

const connectionString = process.env.DATABASE_URL;

const client = postgres(connectionString, { prepare: false });
export const fullSchema = { ...schema, ...relations };
export const db = drizzle(client, { schema: fullSchema });

export { client };
export * from './schema';
export * from './relations';
export { fullSchema as schema };
export * from 'drizzle-orm';
