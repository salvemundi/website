import type { BetterAuthPlugin, Session, User } from "better-auth";
import { Pool } from "pg";
import { getRedis } from "./redis-client";
import { getPermissions, type UserPermissions, type Committee } from "@/shared/lib/permissions";
import { connection } from "next/server";

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
    request?: {
        headers: HeadersInit | Record<string, string>;
    };
    context?: {
        returned?: unknown;
    };
    response?: unknown;
    json?: unknown;
    body?: unknown;
}

export function createRedisSessionPlugin(pool: Pool): BetterAuthPlugin {
    return {
        id: "session-redis-cache",
        hooks: {
            before: [
                {
                    matcher: (ctx) => !!ctx?.path?.includes("get-session"),
                    handler: async (ctx: AuthContext) => {
                        await connection();
                        try {
                            const headersSource = ctx?.headers || ctx?.request?.headers || {};
                            const requestHeaders = new Headers(headersSource);
                            const token = requestHeaders.get("authorization")?.split(" ")[1] ||
                                requestHeaders.get("cookie")?.split("better-auth.session-token=")[1]?.split(";")[0];

                            const cookies = requestHeaders.get("cookie");
                            if (cookies?.includes("directus_test_token=")) return;

                            if (token) {
                                const redis = await getRedis();
                                const cached = await redis.get(`session:${token}`);
                                if (cached) {
                                    const parsed = JSON.parse(cached);
                                    const finalSession = parsed.response ? parsed.response : parsed;

                                    if (ctx.context) {
                                        return {
                                            context: { ...ctx.context, returned: finalSession },
                                            response: finalSession
                                        };
                                    }
                                    return { response: finalSession };
                                }
                            }
                        } catch {
                        }
                    }
                }
            ],
            after: [
                {
                    matcher: (ctx) => !!ctx?.path?.includes("get-session"),
                    handler: async (ctx: AuthContext) => {
                        try {
                            const headersSource = ctx?.headers || ctx?.request?.headers || {};
                            const requestHeaders = new Headers(headersSource);

                            let sessionData = ctx?.context?.returned || ctx?.response;
                            let isWebResponse = false;

                            if (sessionData instanceof Response) {
                                isWebResponse = true;
                                try {
                                    sessionData = await sessionData.clone().json();
                                } catch {
                                    return;
                                }
                            }

                            if (sessionData && typeof sessionData === 'object' && 'response' in sessionData) {
                                sessionData = sessionData.response;
                            }

                            if (!sessionData || typeof sessionData !== 'object' || !('user' in sessionData)) {
                                return;
                            }

                            const sessionWithUser = sessionData as ExtendedSession;
                            if (!sessionWithUser.user?.id) return;

                            const { rows: realCommittees } = await pool.query(
                                `SELECT c.id, c.name, c.azure_group_id, m.is_leader 
                                 FROM committee_members m 
                                 JOIN committees c ON m.committee_id = c.id 
                                 WHERE m.user_id = $1`,
                                [sessionWithUser.user.id]
                            );

                            sessionWithUser.user.committees = realCommittees;
                            Object.assign(sessionWithUser.user, getPermissions(realCommittees));

                            if (!sessionWithUser.user.name && (sessionWithUser.user.first_name || sessionWithUser.user.last_name)) {
                                sessionWithUser.user.name = `${sessionWithUser.user.first_name || ''} ${sessionWithUser.user.last_name || ''}`.trim();
                            }

                            const cookies = requestHeaders.get("cookie");
                            const testToken = cookies?.split("directus_test_token=")?.[1]?.split(";")?.[0];
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
                                    } else {
                                        const { createDirectus, rest, staticToken, readMe } = await import("@directus/sdk");
                                        const testClient = createDirectus(directusUrl!).with(staticToken(testToken)).with(rest());
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
                                        const originalUser = { ...sessionWithUser.user };
                                        await pool.query(
                                            `INSERT INTO system_logs (type, status, payload, created_at) VALUES ($1, $2, $3, NOW())`,
                                            ['impersonation_active', 'INFO', { admin_id: originalUser.id, target_id: targetUser.id, timestamp: new Date().toISOString() }]
                                        );

                                        sessionWithUser.impersonatedBy = {
                                            id: originalUser.id,
                                            name: originalUser.name || originalUser.email,
                                            email: originalUser.email,
                                            isNormallyAdmin: true
                                        };
                                        sessionWithUser.user = { ...targetUser, emailVerified: true, createdAt: new Date(), updatedAt: new Date() };
                                        Object.assign(sessionWithUser.user, getPermissions(targetUser.committees));
                                    }
                                } catch (e) {
                                    console.error('[RedisSessionPlugin] Impersonation fail:', e);
                                }
                            }

                            const token = requestHeaders.get("authorization")?.split(" ")[1] || requestHeaders.get("cookie")?.split("better-auth.session-token=")[1]?.split(";")[0];
                            if (token && !sessionWithUser.impersonatedBy) {
                                try {
                                    const redis = await getRedis();
                                    await redis.set(`session:${token}`, JSON.stringify(sessionWithUser), 'EX', 300);
                                } catch { }
                            }

                            if (isWebResponse && ctx.response) {
                                try {
                                    const rawResponse = ctx.response;
                                    const responseHeaders = (rawResponse && typeof rawResponse === 'object' && 'headers' in rawResponse) 
                                        ? (rawResponse as { headers: HeadersInit }).headers 
                                        : null;
                                    
                                    if (responseHeaders) {
                                        const newHeaders = new Headers(responseHeaders);
                                        newHeaders.set('content-type', 'application/json');
                                        newHeaders.delete('content-length');
                                        
                                        const status = (rawResponse && typeof rawResponse === 'object' && 'status' in rawResponse) 
                                            ? (rawResponse as { status: number }).status 
                                            : 200;
                                        const statusText = (rawResponse && typeof rawResponse === 'object' && 'statusText' in rawResponse) 
                                            ? (rawResponse as { statusText: string }).statusText 
                                            : 'OK';

                                        return {
                                            response: new Response(JSON.stringify(sessionWithUser), {
                                                status,
                                                statusText,
                                                headers: newHeaders
                                            })
                                        };
                                    }
                                } catch {
                                    // Silently fail if wrapping fails
                                }
                            } else if (ctx.context) {
                                return {
                                    context: {
                                        ...ctx.context,
                                        returned: sessionWithUser
                                    }
                                };
                            } else {
                                return { response: sessionWithUser };
                            }
                        } catch {
                            return;
                        }
                    }
                }
            ]
        }
    };
}