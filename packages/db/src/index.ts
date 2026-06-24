import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as relations from './relations';

const connectionString = process.env.DATABASE_URL || 'postgres://directusadmin:StXmr5J6LefHRTEp1V4UkKF8wI0ZDcysaOWM2PCulzAQqYvji7bx9BNdgohGn3@100.77.182.130:5432/v7-core-db';

const client = postgres(connectionString, { prepare: false });
export const fullSchema = { ...schema, ...relations };
export const db = drizzle(client, { schema: fullSchema });

export { client };
export * from './schema';
export * from './relations';
export { fullSchema as schema };
export * from 'drizzle-orm';
