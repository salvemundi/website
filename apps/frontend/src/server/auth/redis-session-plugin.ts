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
                                    const session = JSON.parse(cached);
                                    // Safety net: if the cached session is missing committees enrichment,
                                    // ignore the cache and let it be enriched fresh.
                                    if (session?.user && Array.isArray(session.user.committees)) {
                                        return {
                                            response: { headers: { "content-type": "application/json" } },
                                            body: session,
                                            _flag: "json"
                                        } as any;
                                    }
                                }
                            }
                        } catch (e) {
                            
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
                                const sessionWithUser = session as { 
                                    user?: { 
                                        id?: string; 
                                        name?: string;
                                        first_name?: string;
                                        last_name?: string;
                                        email?: string; 
                                        avatar?: string;
                                        committees?: any; 
                                    };
                                    impersonatedBy?: any;
                                };
                                
                                if (!sessionWithUser.user?.id) return {};

                                // 1. Haal de echte commissies op van de admin/gebruiker
                                const { rows: realCommittees } = await pool.query(
                                    `SELECT c.id, c.name, c.azure_group_id, m.is_leader 
                                     FROM committee_members m 
                                     JOIN committees c ON m.committee_id = c.id 
                                     WHERE m.user_id = $1`,
                                    [sessionWithUser.user.id]
                                );

                                // Injecteer commissies en deriveer permissies
                                sessionWithUser.user.committees = realCommittees;
                                Object.assign(sessionWithUser.user, getPermissions(realCommittees));

                                // 1.5. Enrich name if missing
                                if (!sessionWithUser.user.name && (sessionWithUser.user.first_name || sessionWithUser.user.last_name)) {
                                    sessionWithUser.user.name = `${sessionWithUser.user.first_name || ''} ${sessionWithUser.user.last_name || ''}`.trim();
                                }

                                // 2. Check voor IMPERSONATIE (via cookie)
                                const testToken = requestHeaders.get("cookie")?.split("directus_test_token=")?.[1]?.split(";")?.[0];
                                const isAdmin = (sessionWithUser.user as any).isAdmin || (sessionWithUser.user as any).isICT;

                                if (testToken && isAdmin) {
                                    try {
                                        const redis = await getRedis();
                                        const cacheKey = `impersonation:${testToken}`;
                                        let impData = await redis.get(cacheKey);
                                        if (!impData) {
                                            // Fetch fresh if not in cache
                                            const directusUrl = process.env.DIRECTUS_SERVICE_URL!;
                                            const { createDirectus, rest, staticToken, readMe } = await import("@directus/sdk");
                                            
                                            const testClient = createDirectus(directusUrl)
                                                .with(staticToken(testToken))
                                                .with(rest());

                                            const impUser = await testClient.request(readMe({ 
                                                fields: [
                                                    'id', 'first_name', 'last_name', 'email', 'avatar',
                                                    'membership_status', 'membership_expiry', 'phone_number',
                                                    'date_of_birth', 'minecraft_username'
                                                ] 
                                            } as any)) as any;
                                            
                                            const { rows: impCommittees } = await pool.query(
                                                `SELECT c.id, c.name, c.azure_group_id FROM committee_members m 
                                                 JOIN committees c ON m.committee_id = c.id 
                                                 WHERE m.user_id = $1`,
                                                [impUser.id]
                                            );
                                            
                                            const data = {
                                                id: impUser.id,
                                                first_name: impUser.first_name,
                                                last_name: impUser.last_name,
                                                name: `${impUser.first_name || ''} ${impUser.last_name || ''}`.trim() || impUser.email,
                                                email: impUser.email,
                                                avatar: impUser.avatar,
                                                membership_status: impUser.membership_status,
                                                membership_expiry: impUser.membership_expiry,
                                                phone_number: impUser.phone_number,
                                                date_of_birth: impUser.date_of_birth,
                                                minecraft_username: impUser.minecraft_username,
                                                committees: impCommittees
                                            };
                                            impData = JSON.stringify(data);
                                            await redis.set(cacheKey, impData, 'EX', 3600); // Cache for 1h
                                        }

                                        const targetUser = JSON.parse(impData);
                                        
                                        // Bewaar de originele admin info voor de banner
                                        sessionWithUser.impersonatedBy = {
                                            name: sessionWithUser.user.name,
                                            id: sessionWithUser.user.id,
                                            isNormallyAdmin: (sessionWithUser.user as any).isAdmin
                                        };

                                        // SWAP identity
                                        sessionWithUser.user = {
                                            ...sessionWithUser.user,
                                            id: targetUser.id,
                                            first_name: targetUser.first_name,
                                            last_name: targetUser.last_name,
                                            name: targetUser.name,
                                            email: targetUser.email,
                                            avatar: targetUser.avatar || null,
                                            image: targetUser.avatar || null,
                                            membership_status: targetUser.membership_status,
                                            membership_expiry: targetUser.membership_expiry,
                                            phone_number: targetUser.phone_number,
                                            date_of_birth: targetUser.date_of_birth,
                                            minecraft_username: targetUser.minecraft_username,
                                            committees: targetUser.committees
                                        } as any;

                                        // Update permissions voor de target user
                                        // Update permissions voor de target user
                                        if (sessionWithUser.user) {
                                            Object.assign(sessionWithUser.user, getPermissions(targetUser.committees));
                                        }
                                    } catch (e) {
                                        
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
