import type { BetterAuthPlugin } from "better-auth";
import { Pool } from "pg";
import { getRedis } from "./redis-client";
import { getPermissions } from "@/shared/lib/permissions";
import { getSystemDirectus } from "@/lib/directus";
import { readMe } from "@directus/sdk";

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
                                }
                            }
                        } catch (e) {
                            // Silent fail
                        }
                    }
                }
            ],
            after: [
                {
                    matcher: (ctx) => ctx?.path?.includes("get-session"),
                    handler: async (ctx) => {
                        try {
                            const headersSource = ctx?.headers || (ctx as any)?.request?.headers || {};
                            const requestHeaders = new Headers(headersSource);
                            const session = (ctx as any)?.context?.returned || (ctx as any)?.response || (ctx as any)?.json || (ctx as any)?.body;
                            
                            const token = requestHeaders.get("authorization")?.split(" ")[1] ||
                                requestHeaders.get("cookie")?.split("better-auth.session-token=")[1]?.split(";")[0];

                            if (session && typeof session === 'object' && 'user' in session) {
                                const sessionWithUser = session as any;
                                
                                if (!sessionWithUser.user?.id) return {};

                                // 1. Haal de echte commissies op
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

                                // 2. Check voor IMPERSONATIE
                                const cookies = requestHeaders.get("cookie");
                                const testToken = cookies?.split("directus_test_token=")?.[1]?.split(";")?.[0];
                                const isAdmin = sessionWithUser.user.isAdmin || sessionWithUser.user.isICT;

                                if (testToken && isAdmin) {
                                    try {
                                        const redis = await getRedis();
                                        const directusUrl = process.env.DIRECTUS_SERVICE_URL;

                                        const cacheKey = `impersonation:${testToken}`;
                                        let impData = await redis.get(cacheKey);
                                        let targetUser = impData ? JSON.parse(impData) : null;
                                        
                                        if (!targetUser || !targetUser.id || !targetUser.name) {
                                            const { createDirectus, rest, staticToken, readMe } = await import("@directus/sdk");
                                            
                                            const testClient = createDirectus(directusUrl!)
                                                .with(staticToken(testToken))
                                                .with(rest());

                                            // Stap 1: Token verifiëren
                                            const rawImpUser = await testClient.request(readMe({ fields: ['id'] } as any)) as any;
                                            if (!rawImpUser?.id) return {};

                                            // Stap 2: Profiel ophalen uit DB (omzeilt API restricties)
                                            const { rows: dbUsers } = await pool.query(
                                                `SELECT id, first_name, last_name, email, avatar, 
                                                        membership_status, membership_expiry, phone_number, 
                                                        date_of_birth, minecraft_username, admin_access, role
                                                 FROM directus_users 
                                                 WHERE id = $1 LIMIT 1`,
                                                [rawImpUser.id]
                                            );

                                            if (dbUsers.length === 0) return {};
                                            const dbUser = dbUsers[0];

                                            // Stap 3: Commissies ophalen
                                            const { rows: impCommittees } = await pool.query(
                                                `SELECT c.id, c.name, c.azure_group_id FROM committee_members m 
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
                                                isICT: !!dbUser.is_ict, // ICT is vaak een aparte vlag of rol
                                                role: dbUser.role,
                                                committees: impCommittees
                                            };
                                            
                                            await redis.set(cacheKey, JSON.stringify(targetUser), 'EX', 3600);
                                        }

                                        // Bewaar originele admin info
                                        sessionWithUser.impersonatedBy = {
                                            id: sessionWithUser.user.id,
                                            name: sessionWithUser.user.name || sessionWithUser.user.email,
                                            email: sessionWithUser.user.email,
                                            isNormallyAdmin: true
                                        };

                                        // Wissel naar doelgebruiker
                                        sessionWithUser.user = {
                                            ...targetUser,
                                            emailVerified: true,
                                            createdAt: new Date(),
                                            updatedAt: new Date(),
                                        };

                                        // Update permissies
                                        const perms = getPermissions(targetUser.committees);
                                        Object.assign(sessionWithUser.user, perms);
                                    } catch (e) {
                                        // Silent fail
                                    }
                                }

                                if (token) {
                                    const redis = await getRedis();
                                    await redis.set(`session:${token}`, JSON.stringify(session), 'EX', 300);
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
    } as BetterAuthPlugin;
}
