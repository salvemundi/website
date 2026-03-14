import { createClient } from 'redis';

export class CacheInvalidationService {
    /**
     * Queues an invalidation request for a user's transaction tags.
     * In a full implementation, this would be picked up by a worker
     * that performs exponential backoff retries.
     */
    static async queueInvalidation(redis: ReturnType<typeof createClient>, userId: string) {
        const queueKey = 'cache_invalidation_queue';
        const payload = JSON.stringify({
            userId,
            tag: `user-${userId}-transactions`,
            timestamp: Date.now(),
            retries: 0
        });

        // Add to Redis list (Queue)
        await redis.lPush(queueKey, payload);
        
        console.log(`[CacheInvalidation] Queued invalidation for user ${userId}`);
        
        // Trigger push to Next.js (Synchronous attempt)
        // In a real setup, we'd have a 'worker' loop, but for now we call it directly once.
        this.processInvalidation(userId).catch(err => {
            console.error(`[CacheInvalidation] Immediate attempt failed for ${userId}:`, err.message);
        });
    }

    private static async processInvalidation(userId: string) {
        const nextAppUrl = process.env.NEXT_APP_INTERNAL_URL || 'http://frontend:3000';
        const secret = process.env.INTERNAL_SERVICE_TOKEN;

        try {
            const res = await fetch(`${nextAppUrl}/api/revalidate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${secret}`
                },
                body: JSON.stringify({ tag: `user-${userId}-transactions` })
            });

            if (!res.ok) {
                throw new Error(`Next.js returned ${res.status}`);
            }

            console.log(`[CacheInvalidation] Successfully invalidated Next.js cache for user ${userId}`);
        } catch (err) {
            // Log for the retry worker (which we'd implement next)
            throw err;
        }
    }
}
