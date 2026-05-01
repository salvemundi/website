import type { BetterAuthPlugin, Session, User } from "better-auth";
import { Pool } from "pg";
import { getRedis } from "./redis-client";
import { getPermissions, type UserPermissions, type Committee } from "@/shared/lib/permissions";
import { getSystemDirectus } from "@/lib/directus";
import { readMe } from "@directus/sdk";

interface ExtendedUser extends User, Omit<UserPermissions, 'isICT'> {
    first_name?: string;
    last_name?: string;
    membership_status?: string;
    membership_expiry?: string;
    phone_number?: string;
    date_of_birth?: string;
    avatar?: string;
    minecraft_username?: string;
    entra_id?: string;
    isAdmin?: boolean;
    role?: string;
    committees?: Committee[];
    id: string;
    email: string;
    name?: string;
    emailVerified?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

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
        returned?: any;
    };
    response?: any;
    json?: any;
    body?: any;
}

/**
 * Better Auth plugin die sessies cached in Redis (TTL: 5 minuten).
 * Bevat ook de logica voor impersonatie (nadoen van andere gebruikers).
 */
export function createRedisSessionPlugin(pool: Pool): BetterAuthPlugin {
    return {
        id: "session-redis-cache",
        hooks: {
            before: [
                {
                    matcher: (ctx) => !!ctx?.path?.includes("get-session"),
                    handler: async (ctx: AuthContext) => {
                        try {
                            const headersSource = ctx?.headers || ctx?.request?.headers || {};
                            const requestHeaders = new Headers(headersSource);
                            const token = requestHeaders.get("authorization")?.split(" ")[1] ||
                                requestHeaders.get("cookie")?.split("better-auth.session-token=")[1]?.split(";")[0];

                            if (token) {
                                const redis = await getRedis();
                                const cached = await redis.get(`session:${token}`);
                                if (cached) {
                                    return {
                                        response: JSON.parse(cached) as ExtendedSession
                                    };
                                }
                            }
                        } catch (e) {
                            // Silent fail, continue to database
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
                            const session = (ctx?.context?.returned || ctx?.response || ctx?.json || ctx?.body) as ExtendedSession | null;
                            
                            const token = requestHeaders.get("authorization")?.split(" ")[1] ||
                                requestHeaders.get("cookie")?.split("better-auth.session-token=")[1]?.split(";")[0];

                            if (session && typeof session === 'object' && 'user' in session) {
                                const sessionWithUser = session;
                                
                                if (!sessionWithUser.user?.id) return {};

                                // 1. Refresh real committees and permissions from DB
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

                                // 2. Handle IMPERSONATION
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
                                            
                                            const testClient = createDirectus(directusUrl!)
                                                .with(staticToken(testToken))
                                                .with(rest());

                                            // Determine target user identity via token
                                            const rawImpUser = await testClient.request(readMe({ fields: ['id'] })) as { id: string } | null;
                                            
                                            if (rawImpUser?.id) {
                                                const { rows: dbUsers } = await pool.query(
                                                    `SELECT id, first_name, last_name, email, avatar, 
                                                            membership_status, membership_expiry, phone_number, 
                                                            date_of_birth, minecraft_username, admin_access, role
                                                     FROM directus_users 
                                                     WHERE id = $1 LIMIT 1`,
                                                    [rawImpUser.id]
                                                );

                                                if (dbUsers.length > 0) {
                                                    const dbUser = dbUsers[0];
                                                    const { rows: impCommittees } = await pool.query(
                                                        `SELECT c.id, c.name, c.azure_group_id, m.is_leader FROM committee_members m 
                                                         JOIN committees c ON m.committee_id = c.id 
                                                         WHERE m.user_id = $1`,
                                                        [dbUser.id]
                                                    );
                                                    
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
                                                        isAdmin: !!dbUser.admin_access,
                                                        role: dbUser.role,
                                                        committees: impCommittees,
                                                        emailVerified: true,
                                                        ...getPermissions(impCommittees)
                                                    };
                                                    
                                                    await redis.set(cacheKey, JSON.stringify(targetUser), 'EX', 3600);
                                                }
                                            }
                                        }

                                        if (targetUser) {
                                            const originalUser = { ...sessionWithUser.user };

                                            // Audit log before swapping
                                            await pool.query(
                                                `INSERT INTO system_logs (type, status, payload, created_at)
                                                 VALUES ($1, $2, $3, NOW())`,
                                                ['impersonation_active', 'INFO', {
                                                    admin_id: originalUser.id,
                                                    admin_name: originalUser.name || originalUser.email,
                                                    target_id: targetUser.id,
                                                    target_name: targetUser.name,
                                                    timestamp: new Date().toISOString()
                                                }]
                                            );

                                            // Store original admin context
                                            sessionWithUser.impersonatedBy = {
                                                id: originalUser.id,
                                                name: originalUser.name || originalUser.email,
                                                email: originalUser.email,
                                                isNormallyAdmin: true
                                            };

                                            // Swap current session user to target
                                            sessionWithUser.user = {
                                                ...targetUser,
                                                emailVerified: true,
                                                createdAt: new Date(),
                                                updatedAt: new Date(),
                                            };

                                            // Re-calculate permissions for target user
                                            const perms = getPermissions(targetUser.committees);
                                            Object.assign(sessionWithUser.user, perms);
                                        }
                                    } catch (e) {
                                        // Failed to impersonate, standard admin session continues
                                        console.error('[RedisSessionPlugin] Impersonation fail:', e);
                                    }
                                }

                                // 3. Cache the final enriched session
                                if (token) {
                                    try {
                                        const redis = await getRedis();
                                        await redis.set(`session:${token}`, JSON.stringify(session), 'EX', 300);
                                    } catch (redisError) {
                                        // Redis down? Continue without caching
                                    }
                                }
                                return { response: session };
                            }
                            return {};
                        } catch (error) {
                            return {};
                        }
                    }
                }
            ]
        }
    };
}
