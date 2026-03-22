import type { BetterAuthPlugin } from "better-auth";
import { Pool } from "pg";
import { getRedis } from "./redis-client";
import { getPermissions } from "@/shared/lib/permissions";

/**
 * Better Auth plugin die sessies cached in Redis (TTL: 5 minuten).
 * Vervangt herhaalde database-queries bij get-session calls.
 */
export function createRedisSessionPlugin(pool: Pool): BetterAuthPlugin {
    return {
        id: "session-redis-cache",
        hooks: {
            before: [
                {
                    matcher: (ctx) => {
                        const match = ctx?.path?.includes("get-session");
                        return match;
                    },
                    handler: async (ctx) => {
                        try {
                            const headersSource = ctx?.headers || (ctx as any)?.request?.headers || {};
                            const requestHeaders = new Headers(headersSource);
                            const token = requestHeaders.get("authorization")?.split(" ")[1] ||
                                requestHeaders.get("cookie")?.split("better-auth.session-token=")[1]?.split(";")[0];

                            if (token) {
                                const redis = await getRedis();
                                const cached = await redis.get(`session:${token}`);
                                if (cached) {
                                    return {
                                        response: { headers: { "content-type": "application/json" } },
                                        body: JSON.parse(cached),
                                        _flag: "json"
                                    } as any;
                                }
                            }
                        } catch (e) {
                            console.warn("[AUTH-REDIS] Cache read failed:", e);
                        }
                    }
                }
            ],
            after: [
                {
                    matcher: (ctx) => ctx?.path?.includes("get-session"),
                    handler: async (ctx) => {
                        try {
                            // Defensive check for headers source
                            const headersSource = ctx?.headers || (ctx as any)?.request?.headers || {};
                            const requestHeaders = new Headers(headersSource);
                            const session = (ctx as any)?.context?.returned || (ctx as any)?.response || (ctx as any)?.json || (ctx as any)?.body;
                            const token = requestHeaders.get("authorization")?.split(" ")[1] ||
                                requestHeaders.get("cookie")?.split("better-auth.session-token=")[1]?.split(";")[0];

                            if (session && typeof session === 'object' && 'user' in session) {
                                const sessionWithUser = session as { user?: { id?: string; email?: string; committees?: unknown } };
                                if (!sessionWithUser.user?.id) return {};

                                const { rows } = await pool.query(
                                    `SELECT c.id, c.name, m.is_leader 
                                     FROM committee_members m 
                                     JOIN committees c ON m.committee_id = c.id 
                                     WHERE m.user_id = $1 AND m.is_visible = true`,
                                    [sessionWithUser.user.id]
                                );

                                // Inject committees and derived permissions
                                sessionWithUser.user.committees = rows;
                                Object.assign(sessionWithUser.user, getPermissions(rows));

                                if (token) {
                                    const redis = await getRedis();
                                    await redis.set(`session:${token}`, JSON.stringify(session), { EX: 300 });
                                }
                                return { response: session };
                            }
                            // FIX: Return empty object when no valid user session is found
                            return {};
                        } catch (error) {
                            console.error("[AUTH-PLUGIN] Session enrichment error:", error);
                            // FIX: Return empty object when an error occurs
                            return {};
                        }
                    }
                }
            ]
        }
    } as BetterAuthPlugin;
}
