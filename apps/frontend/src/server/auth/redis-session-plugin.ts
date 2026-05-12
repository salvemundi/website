import type { BetterAuthPlugin, Session, User } from "better-auth";
import { Pool } from "pg";
import { getRedis } from "./redis-client";
import { getPermissions, type UserPermissions, type Committee } from "@/shared/lib/permissions";

type ExtendedUser = User & Omit<UserPermissions, 'isICT'> & {
    first_name?: string;
    last_name?: string;
    membership_status?: string;
    membership_expiry?: string;
    phone_number?: string;
    date_of_birth?: string;
    avatar?: string;
    minecraft_username?: string;
    entra_id?: string;
    role?: string;
    committees?: Committee[];
    id: string;
    email: string;
    name?: string;
    emailVerified?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
};

interface ExtendedSession {
    user: ExtendedUser;
    session: Session;
    impersonatedBy?: {
        id: string;
        name: string;
        email: string;
        isNormallyAdmin: boolean;
    };
}

interface AuthContext {
    path?: string;
    headers?: HeadersInit | Record<string, string>;
    request?: Request | { headers: HeadersInit | Record<string, string> };
    context?: {
        returned?: unknown;
    };
    response?: unknown;
}

/**
 * Safely extracts headers from various Better Auth context shapes without triggering SSR crashes.
 */
function extractHeadersSafely(ctx: unknown): Headers | null {
    if (!ctx || typeof ctx !== 'object') {

        return null;
    }

    try {
        // 1. Try request.headers
        if ('request' in ctx && ctx.request && typeof ctx.request === 'object' && 'headers' in ctx.request) {
            const h = (ctx.request as { headers?: unknown }).headers;
            if (h instanceof Headers) return h;
            if (h && typeof h === 'object') return new Headers(h as Record<string, string>);
        }

        // 2. Try top-level headers
        if ('headers' in ctx && ctx.headers) {
            const h = ctx.headers;
            if (h instanceof Headers) return h;
            if (h && typeof h === 'object') return new Headers(h as Record<string, string>);
        }

        // 3. Try legacy req.headers
        if ('req' in ctx && ctx.req && typeof ctx.req === 'object' && 'headers' in ctx.req) {
            const h = (ctx.req as { headers?: Record<string, string> }).headers;
            if (h && typeof h === 'object') return new Headers(h);
        }
        

    } catch (e) {
        console.error('❌ [RedisPlugin] extractHeadersSafely - Error:', e);
    }

    return null;
}

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
                            const isMatch = typeof path === 'string' && path.includes("get-session");
                            if (isMatch) { /* Matcher hit for path: path */ }
                            return isMatch;
                        } catch (e) {
                            console.error('❌ [RedisPlugin] BeforeMatcher Error:', e);
                            return false;
                        }
                    },
                    handler: async (ctx: AuthContext) => {
                        try {
                            const requestHeaders = extractHeadersSafely(ctx);
                            if (!requestHeaders) {
                                return;
                            }

                            const authHeader = requestHeaders.get("authorization");
                            const cookieHeader = requestHeaders.get("cookie");

                            const token = authHeader?.split(" ")[1] ||
                                cookieHeader?.split("better-auth.session-token=")?.[1]?.split(";")?.[0] ||
                                cookieHeader?.split("better-auth.session_token=")?.[1]?.split(";")?.[0];

                            if (!token || cookieHeader?.includes("directus_test_token=")) {
                                return;
                            }

                            const redis = await getRedis();
                            const cached = await redis.get(`session:${token}`);
                            if (cached) {
                                const parsed = JSON.parse(cached);
                                const finalSession = parsed.response ? parsed.response : parsed;
                                
                                // Ensure user exists in finalSession
                                if (!finalSession || !finalSession.user) {
                                    return;
                                }

                                return {
                                    response: finalSession
                                };
                            }
                        } catch (_e) {
                            return;
                        }
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
                        const returned = ctx.context?.returned || (ctx as { response?: unknown }).response;
                        try {
                            let sessionData: unknown = null;

                            if (returned && typeof returned === 'object' && 'clone' in returned) {
                                try {
                                    sessionData = await (returned as Response).clone().json();
                                } catch (_e) {
                                    return returned;
                                }
                            } else {
                                sessionData = returned;
                            }

                            if (sessionData && typeof sessionData === 'object' && 'response' in sessionData) {
                                sessionData = (sessionData as any).response;
                            }

                            if (!sessionData || typeof sessionData !== 'object' || !('user' in sessionData) || !sessionData.user) {
                                return returned;
                            }

                            const sessionWithUser = sessionData as ExtendedSession;
                            const userId = sessionWithUser.user?.id;
                            if (!userId) return returned;

                            const { rows: realCommittees } = await pool.query(
                                `SELECT c.id, c.name, c.azure_group_id, m.is_leader 
                                 FROM committee_members m 
                                 JOIN committees c ON m.committee_id = c.id 
                                 WHERE m.user_id = $1`,
                                [userId]
                            );

                            sessionWithUser.user.committees = realCommittees;
                            Object.assign(sessionWithUser.user, getPermissions(realCommittees));

                            if (!sessionWithUser.user.name && (sessionWithUser.user.first_name || sessionWithUser.user.last_name)) {
                                sessionWithUser.user.name = `${sessionWithUser.user.first_name || ''} ${sessionWithUser.user.last_name || ''}`.trim();
                            }

                            const requestHeaders = extractHeadersSafely(ctx);
                            if (!requestHeaders) {
                                return { response: sessionData };
                            }
                            
                            const cookies = requestHeaders.get("cookie") || "";
                            const testToken = cookies.split("directus_test_token=")?.[1]?.split(";")?.[0];
                            const isAdmin = sessionWithUser.user.isAdmin || sessionWithUser.user.isICT;

                            if (testToken && isAdmin) {
                                try {
                                    const redis = await getRedis();
                                    const directusUrl = process.env.DIRECTUS_SERVICE_URL;
                                    const cacheKey = `impersonation:${testToken}`;

                                    let targetUser: ExtendedUser | null = null;
                                    const cachedImp = await redis.get(cacheKey);

                                    if (cachedImp) {
                                        targetUser = JSON.parse(cachedImp);
                                    } else if (directusUrl) {
                                        const { createDirectus, rest, staticToken, readMe } = await import("@directus/sdk");
                                        const testClient = createDirectus(directusUrl).with(staticToken(testToken)).with(rest());
                                        const rawImpUser = await testClient.request(readMe({ fields: ['id'] })) as { id: string } | null;

                                        if (rawImpUser?.id) {
                                            const { rows: dbUsers } = await pool.query(
                                                `SELECT id, first_name, last_name, email, avatar, 
                                                        membership_status, membership_expiry, phone_number, 
                                                        date_of_birth, minecraft_username, admin_access, role
                                                 FROM directus_users WHERE id = $1 LIMIT 1`,
                                                [rawImpUser.id]
                                            );

                                            if (dbUsers.length > 0) {
                                                const dbUser = dbUsers[0];
                                                const { rows: impCommittees } = await pool.query(
                                                    `SELECT c.id, c.name, c.azure_group_id, m.is_leader FROM committee_members m 
                                                     JOIN committees c ON m.committee_id = c.id WHERE m.user_id = $1`,
                                                    [dbUser.id]
                                                );

                                                const perms = getPermissions(impCommittees);

                                                targetUser = {
                                                    id: dbUser.id,
                                                    first_name: dbUser.first_name,
                                                    last_name: dbUser.last_name,
                                                    name: `${dbUser.first_name || ''} ${dbUser.last_name || ''}`.trim(),
                                                    email: dbUser.email,
                                                    avatar: dbUser.avatar,
                                                    membership_status: dbUser.membership_status,
                                                    membership_expiry: dbUser.membership_expiry,
                                                    phone_number: dbUser.phone_number,
                                                    date_of_birth: dbUser.date_of_birth,
                                                    minecraft_username: dbUser.minecraft_username,
                                                    role: dbUser.role,
                                                    committees: impCommittees,
                                                    emailVerified: true,
                                                    createdAt: new Date(),
                                                    updatedAt: new Date(),
                                                    ...perms,
                                                    isAdmin: !!dbUser.admin_access || perms.isAdmin
                                                };
                                                await redis.set(cacheKey, JSON.stringify(targetUser), 'EX', 3600);
                                            }
                                        }
                                    }

                                    if (targetUser) {
                                        sessionWithUser.impersonatedBy = {
                                            id: sessionWithUser.user.id,
                                            name: sessionWithUser.user.name || sessionWithUser.user.email,
                                            email: sessionWithUser.user.email,
                                            isNormallyAdmin: true
                                        };
                                        sessionWithUser.user = { ...targetUser, emailVerified: true, createdAt: new Date(), updatedAt: new Date() };
                                    }
                                } catch (_e) {
                                    // Silent fail for impersonation
                                }
                            }

                            const token = requestHeaders.get("authorization")?.split(" ")[1] || 
                                         requestHeaders.get("cookie")?.split("better-auth.session-token=")?.[1]?.split(";")?.[0] || 
                                         requestHeaders.get("cookie")?.split("better-auth.session_token=")?.[1]?.split(";")?.[0];
                                         
                            if (token && !sessionWithUser.impersonatedBy) {
                                try {
                                    const redis = await getRedis();
                                    await redis.set(`session:${token}`, JSON.stringify(sessionWithUser), 'EX', 300);
                                } catch (_e) { 
                                    // Silent fail for cache
                                }
                            }

                            return {
                                response: sessionWithUser
                            };
                        } catch (_e) {
                            return returned; 
                        }
                    }
                }
            ]
        }
    };
}