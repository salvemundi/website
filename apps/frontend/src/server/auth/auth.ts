import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { createClient } from "redis";

// Database Pool
const pool = new Pool({
    connectionString: `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.INTERNAL_DB_HOST}:5432/${process.env.DB_NAME}`
});

// Redis Client voor sessie-caching (Node.js runtime alleen!)
const redisUrl = process.env.REDIS_URL || 'redis://v7-core-redis:6379';
let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedis() {
    if (!redisClient) {
        redisClient = createClient({ url: redisUrl });
        redisClient.on('error', (err: Error) => console.error('Auth Redis Error:', err));
        await redisClient.connect();
    }
    return redisClient;
}

export const auth = betterAuth({
    database: pool,
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: [process.env.BETTER_AUTH_URL!],
    socialProviders: {
        microsoft: {
            clientId: process.env.AZURE_WEBSITEV7_AUTH_CLIENT_ID!,
            clientSecret: process.env.AZURE_WEBSITEV7_AUTH_CLIENT_SECRET!,
            tenantId: process.env.AZURE_WEBSITEV7_TENANT_ID!,
        },
    },
    user: {
        modelName: "directus_users",
        additionalFields: {
            first_name: { type: "string" },
            last_name: { type: "string" },
            membership_status: { type: "string" },
            membership_expiry: { type: "string" },
            phone_number: { type: "string" },
            date_of_birth: { type: "string" },
            avatar: { type: "string" },
            minecraft_username: { type: "string" },
        }
    },
    session: {
        modelName: "auth_sessions"
    },
    account: {
        modelName: "auth_accounts"
    },
    plugins: [
        {
            id: "session-redis-cache",
            hooks: {
                before: [
                    {
                        matcher: (ctx) => ctx.path.includes("get-session"),
                        handler: async (ctx) => {
                            const token = ctx.headers?.get("authorization")?.split(" ")[1] || 
                                          ctx.headers?.get("cookie")?.split("better-auth.session-token=")[1]?.split(";")[0];
                            
                            if (token) {
                                try {
                                    const redis = await getRedis();
                                    const cached = await redis.get(`session:${token}`);
                                    if (cached) {
                                        const session = JSON.parse(cached);
                                        // DEBUG: Log cached session status
                                        console.log(`[AUTH-CACHE] Hit for user: ${session?.user?.email || 'unknown'}`);
                                        return {
                                            response: {
                                                headers: { "content-type": "application/json" }
                                            },
                                            body: session,
                                            _flag: "json"
                                        } as any;
                                    }
                                } catch (e) {
                                    console.warn("[AUTH-REDIS] Cache hit failed:", e);
                                }
                            }
                        }
                    }
                ],
                after: [
                    {
                        matcher: (ctx) => ctx.path.includes("get-session"),
                        handler: async (ctx) => {
                            const session = ctx.context?.returned || (ctx as any).response || (ctx as any).json || (ctx as any).body;
                            const token = ctx.headers?.get("authorization")?.split(" ")[1] || 
                                          ctx.headers?.get("cookie")?.split("better-auth.session-token=")[1]?.split(";")[0];

                            if (session && typeof session === 'object' && 'user' in session) {
                                const sessionWithUser = session as { user?: { id?: string; email?: string; committees?: unknown } };
                                if (!sessionWithUser.user?.id) return session;

                                try {
                                    // DEBUG: Log enrichment attempt
                                    console.log(`[AUTH-ENRICH] Enriching session for: ${sessionWithUser.user.email}`);
                                    
                                    const { rows } = await pool.query(
                                        `SELECT c.id, c.name, m.is_leader 
                                         FROM committee_members m 
                                         JOIN committees c ON m.committee_id = c.id 
                                         WHERE m.user_id = $1 AND m.is_visible = true`,
                                        [sessionWithUser.user.id]
                                    );
                                    
                                    console.log(`[AUTH-ENRICH] Found ${rows.length} committees for ${sessionWithUser.user.email}`);
                                    sessionWithUser.user.committees = rows;
                                    
                                    if (token) {
                                        const redis = await getRedis();
                                        await redis.set(`session:${token}`, JSON.stringify(session), { EX: 300 });
                                    }
                                } catch (error) {
                                    console.error("[AUTH-PLUGIN] Error enrichment:", error);
                                }
                                return session;
                            }
                        }
                    }
                ]
            }
        }
    ]
});
