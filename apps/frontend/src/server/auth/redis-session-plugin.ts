import type { BetterAuthPlugin } from "better-auth";
import { Pool } from "pg";
import { beforeHandler, afterHandler } from "./redis-session/handlers";
import { type AuthContext } from "./redis-session/types";

/**
 * Better Auth Plugin for Salve Mundi V7.
 * Provides Redis-based session caching and on-the-fly permission enrichment.
 * 
 * NOTE: 'any' is tolerated in this file and its sub-modules due to high technical 
 * complexity of Better Auth plugin hooks, as per PROJECT_STATUS.md.
 */
export function createRedisSessionPlugin(pool: Pool): BetterAuthPlugin {
    return {
        id: "session-redis-cache",
        hooks: {
            before: [
                {
                    matcher: (ctx) => {
                        try {
                            if (!ctx || typeof ctx !== 'object') return false;
                            const path = (ctx as { path?: unknown }).path;
                            return typeof path === 'string' && path.includes("get-session");
                        } catch (error) {
                            console.error('❌ [RedisPlugin] BeforeMatcher Error:', error);
                            return false;
                        }
                    },
                    handler: async (ctx: AuthContext) => {
                        return await beforeHandler(ctx);
                    }
                }
            ],
            after: [
                {
                    matcher: (ctx) => {
                        try {
                            if (!ctx || typeof ctx !== 'object') return false;
                            const path = (ctx as { path?: unknown }).path;
                            return typeof path === 'string' && path.includes("get-session");
                        } catch (_e) {
                            return false;
                        }
                    },
                    handler: async (ctx: AuthContext) => {
                        return await afterHandler(ctx, pool);
                    }
                }
            ]
        }
    };
}
