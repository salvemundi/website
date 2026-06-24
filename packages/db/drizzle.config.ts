import { defineConfig } from 'drizzle-kit';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(__dirname, '../../apps/frontend/.env.local');
const envVars: Record<string, string> = {};

if (existsSync(envPath)) {
  readFileSync(envPath, 'utf-8')
    .split('\n')
    .forEach((line) => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });
}

const dbUser = envVars.DB_USER || process.env.DB_USER;
const dbPassword = envVars.DB_PASSWORD || process.env.DB_PASSWORD;
const dbHost = envVars.VPN_IP || process.env.VPN_IP || process.env.DB_HOST;
const dbPort = envVars.DB_PORT || process.env.DB_PORT;
const dbName = envVars.DB_NAME || process.env.DB_NAME;

const dbUrl = process.env.DATABASE_URL || `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

export default defineConfig({
  out: './drizzle',
  schema: './src/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: dbUrl,
  },
});