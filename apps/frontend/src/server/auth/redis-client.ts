import { Redis } from "ioredis";

// Redis Client voor sessie-caching (Node.js runtime alleen — niet beschikbaar in Edge runtime).
// De configuratie wordt volledig bepaald door de omgevingsvariabelen (REDIS_URL of host+password).
const host = process.env.INTERNAL_REDIS_HOST;
const password = process.env.REDIS_PASSWORD;

let redisUrl = process.env.REDIS_URL;
if (!redisUrl && host && password) {
    redisUrl = `redis://default:${password}@${host}:6379`;
} else if (redisUrl) {
}

let redisClient: Redis | null = null;
let isConnecting = false;

export async function getRedis() {
    if (redisClient) return redisClient;
    
    if (isConnecting) {
        // Wait a bit if already connecting to avoid race conditions
        await new Promise(resolve => setTimeout(resolve, 500));
        if (redisClient) return redisClient;
    }

    try {
        isConnecting = true;
        if (!redisUrl) {
            throw new Error("Redis URL is missing and no host/password provided.");
        }

        redisClient = new Redis(redisUrl, {
            maxRetriesPerRequest: null,
            retryStrategy: (times) => {
                if (times > 10) {
                    console.error('[AUTH-REDIS] Max reconnection retries reached. Stopping spam.');
                    return null; // Stop reconnecting after 10 tries
                }
                return Math.min(times * 100, 3000);
            }
        });

        redisClient.on('error', (err: Error) => {
            // Only log errors if they are not just "ECONNREFUSED" or only log them once in a while
            console.error('[AUTH-REDIS] Client error:', err.message);
        });

        isConnecting = false;
        return redisClient;
    } catch (e: any) {
        isConnecting = false;
        console.error('[AUTH-REDIS] Failed to initialize Redis client:', e.message);
        throw e;
    }
}
