import { Redis } from "ioredis";
import { safeConsoleError } from '@/server/utils/logger';

const host = process.env.INTERNAL_REDIS_HOST;
const password = process.env.REDIS_PASSWORD;

let redisUrl = process.env.REDIS_URL;
if (!redisUrl && host && password) {
    redisUrl = `redis://default:${password}@${host}:6379`;
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
            throw new Error("Redis URL is missing and no host/password provided.");
        }

        redisClient = new Redis(redisUrl, {
            maxRetriesPerRequest: null,
            connectTimeout: 500,
            lazyConnect: true,
            retryStrategy: (_times) => {
                return Math.min(_times * 100, 3000);
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