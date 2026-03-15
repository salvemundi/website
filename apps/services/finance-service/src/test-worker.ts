import { createClient } from 'redis';

/**
 * Verification Script for Redis Retry Worker
 * 
 * Usage: 
 * 1. Ensure Redis is running (Netbird VPN connected).
 * 2. Run with: npx ts-node src/test-worker.ts
 */

const REDIS_URL = process.env.REDIS_URL || 'redis://100.77.182.130:6379'; // Netbird ACC IP
const QUEUE_KEY = 'cache_invalidation_queue';

async function testWorker() {
    const redis = createClient({ url: REDIS_URL });
    await redis.connect();

    console.log('--- Redis Worker Verification ---');

    // 1. Inject a sample task
    const userId = 'test-user-123';
    const task = {
        userId,
        tag: `user-${userId}-transactions`,
        retries: 0,
        maxRetries: 3
    };

    console.log('1. Injecting test task into Sorted Set...');
    await redis.zAdd(QUEUE_KEY, {
        score: Date.now(),
        value: JSON.stringify(task)
    });

    // 2. Wait and check RedisInsight
    console.log('2. Task injected. Check RedisInsight at redis.salvemundi.nl');
    console.log(`   Expected Key: ${QUEUE_KEY}`);
    
    // 3. Verify ZSET content
    const items = await redis.zRangeWithScores(QUEUE_KEY, 0, -1);
    console.log('3. Current Queue Content:', items);

    await redis.disconnect();
    console.log('Test setup complete. Observe the finance-service logs for processing results.');
}

testWorker().catch(console.error);
