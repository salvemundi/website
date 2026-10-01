import { Redis } from "ioredis";
import { safeConsoleError } from '@/server/utils/logger';

const host = process.env.INTERNAL_REDIS_HOST || process.env.REDIS_HOST;
const port = process.env.INTERNAL_REDIS_PORT || process.env.REDIS_PORT || '6379';
const password = process.env.REDIS_PASSWORD;

let redisUrl = process.env.REDIS_URL;
if (!redisUrl && host) {
    redisUrl = password 
        ? `redis://default:${encodeURIComponent(password)}@${host}:${port}` 
        : `redis://${host}:${port}`;
}

let redisClient: Redis | null = null;
let isConnecting = false;

const state = {
    get client() {
        return redisClient;
    }
};

export async function getRedis() {
    if (redisClient) return redisClient;

    if (isConnecting) {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (state.client) return state.client;
    }

    try {
        isConnecting = true;
        if (!redisUrl) {
            throw new Error("Redis URL is missing and no REDIS_HOST / REDIS_PASSWORD provided.");
        }

        redisClient = new Redis(redisUrl, {
            maxRetriesPerRequest: null,
            connectTimeout: 5000,
            lazyConnect: true,
            retryStrategy: (times) => {
                return Math.min(times * 500, 5000);
            }
        });

        redisClient.on('error', (error: Error) => {
            safeConsoleError('[redis-client.ts][getRedis] Error event:', error.message);
        });
        
        redisClient.on('connect', () => {
            // Redis connected successfully
        });

        isConnecting = false;
        return redisClient;
    } catch (error: unknown) {
        isConnecting = false;
        safeConsoleError('[redis-client.ts][getRedis] Connection failed:', error);
        throw error;
    }
}