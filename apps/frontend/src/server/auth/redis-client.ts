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
            connectTimeout: 500,
            lazyConnect: true,
            retryStrategy: (times) => {
                if (times > 10) {
                    
                    return null; // Stop reconnecting after 10 tries
                }
                return Math.min(times * 100, 3000);
            }
        });

        redisClient.on('error', (err: Error) => {
            // Only log errors if they are not just "ECONNREFUSED" or only log them once in a while
            
        });

        isConnecting = false;
        return redisClient;
    } catch (e: unknown) {
        isConnecting = false;
        console.error('[RedisClient] Connection failed:', e instanceof Error ? e.message : e);
        throw e;
    }
}
