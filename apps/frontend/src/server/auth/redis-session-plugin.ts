import type { BetterAuthPlugin } from "better-auth";
import { Pool } from "pg";
import { beforeHandler, afterHandler } from "./redis-session/handlers";
import { type AuthContext } from "./redis-session/types";
import { safeConsoleError } from '@/server/utils/logger';
import { extractHeadersSafely } from "./redis-session/utils";
import { getRedis } from "@/server/auth/redis-client";

export function createRedisSessionPlugin(pool: Pool): BetterAuthPlugin {
    return {
        id: "session-redis-cache",
        hooks: {
            before: [
                {
                    matcher: (ctx) => {
                        try {
                            const path = (ctx as { path?: unknown }).path;
                            return typeof path === 'string' && path.includes("get-session");
                        } catch (error: unknown) {
                            safeConsoleError('[redis-session-plugin.ts][beforeMatcher] Before matcher failed:', error);
                            return false;
                        }
                    },
                    handler: async (ctx: AuthContext) => {
                        return await beforeHandler(ctx);
                    }
                },
                {
                    matcher: (ctx) => {
                        try {
                            const path = (ctx as { path?: unknown }).path;
                            return typeof path === 'string' && (path.includes("sign-out") || path.includes("revoke-session"));
                        } catch {
                            return false;
                        }
                    },
                    handler: async (ctx: AuthContext) => {
                        try {
                            const requestHeaders = extractHeadersSafely(ctx);
                            if (requestHeaders) {
                                const authHeader = requestHeaders.get("authorization");
                                const cookieHeader = requestHeaders.get("cookie");

                                let token = authHeader?.split(" ")[1] || undefined;
                                if (!token && cookieHeader) {
                                    const match = cookieHeader.match(/better-auth\.session[-_]token=([^;]+)/);
                                    if (match) {
                                        token = match[1];
                                    }
                                }

                                if (token) {
                                    const redis = await getRedis();
                                    await redis.del(`session:${token}`);
                                }
                            }
                        } catch (error: unknown) {
                            safeConsoleError('[redis-session-plugin.ts][signOutHandler] Sign out hook failed:', error);
                        }
                        return;
                    }
                }
            ],
            after: [
                {
                    matcher: (ctx) => {
                        try {
                            const path = (ctx as { path?: unknown }).path;
                            return typeof path === 'string' && path.includes("get-session");
                        } catch (error: unknown) {
                            safeConsoleError('[redis-session-plugin.ts][afterMatcher] After matcher failed:', error);
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