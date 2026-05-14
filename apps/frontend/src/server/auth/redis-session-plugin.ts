import type { BetterAuthPlugin } from "better-auth";
import { Pool } from "pg";
import { beforeHandler, afterHandler } from "./redis-session/handlers";
import { type AuthContext } from "./redis-session/types";
import { safeConsoleError } from '@/server/utils/logger';

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
                            safeConsoleError('[RedisPlugin] BeforeMatcher Error:', error);
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
                        } catch (error) {
                            safeConsoleError('[RedisPlugin] AfterMatcher Error:', error);
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
