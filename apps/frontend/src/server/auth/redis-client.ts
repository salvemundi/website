import { createClient } from "redis";

// Redis Client voor sessie-caching (Node.js runtime alleen — niet beschikbaar in Edge runtime).
const redisUrl = process.env.REDIS_URL!;
let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedis() {
    if (!redisClient) {
        redisClient = createClient({ url: redisUrl });
        redisClient.on('error', (err: Error) => console.error('[AUTH-REDIS] Client error:', err));
        await redisClient.connect();
    }
    return redisClient;
}
