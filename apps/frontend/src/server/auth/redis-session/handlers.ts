import { Pool } from "pg";
import { getRedis } from "@/server/auth/redis-client";
import { getPermissions } from "@/shared/lib/permissions";
import { type AuthContext, type ExtendedSession } from "./types";
import { extractHeadersSafely } from "./utils";
import { getImpersonatedUser } from "./impersonation";
import { safeConsoleError } from '@/server/utils/logger';

export async function beforeHandler(ctx: AuthContext) {
    try {
        const requestHeaders = extractHeadersSafely(ctx);
        if (!requestHeaders) return;

        const authHeader = requestHeaders.get("authorization");
        const cookieHeader = requestHeaders.get("cookie");

        const token = authHeader?.split(" ")[1] ||
            cookieHeader?.split("better-auth.session-token=")?.[1]?.split(";")?.[0] ||
            cookieHeader?.split("better-auth.session_token=")?.[1]?.split(";")?.[0];

        if (!token || cookieHeader?.includes("directus_test_token=")) return;

        const redis = await getRedis();
        const cached = await redis.get(`session:${token}`);
        if (cached) {
            const parsed = JSON.parse(cached);
            const finalSession = parsed.response ? parsed.response : parsed;

            if (!finalSession || !finalSession.user) return;

            return { response: finalSession };
        }
    } catch (error) {
        safeConsoleError(`[redis-session/handlers.ts][beforeHandler] Error in beforeHandler:`, error);
        return;
    }
}

export async function afterHandler(ctx: AuthContext, pool: Pool) {
    // 1. Extract the returned data (could be in ctx.context.returned or ctx.response)
    const returned = ctx.context?.returned || (ctx as any).response || (ctx as any).returned;

    try {
        let sessionData: any = null;

        // 2. Safely parse sessionData from Response or plain object
        if (returned && typeof returned === 'object' && 'clone' in returned && typeof (returned as any).clone === 'function') {
            try {
                sessionData = await (returned as Response).clone().json();
            } catch (error) {
                // Return original data in expected format if parsing fails
                return {
                    response: returned?.response || returned || null,
                    headers: returned?.headers || null
                };
            }
        } else {
            sessionData = returned;
        }

        // 3. Normalize sessionData (Better Auth sometimes wraps it in { response: ... })
        if (sessionData && typeof sessionData === 'object' && 'response' in sessionData) {
            sessionData = sessionData.response;
        }

        // 4. Basic validation - if no user, we can't do anything
        if (!sessionData || typeof sessionData !== 'object' || !sessionData.user) {
            return {
                response: returned?.response || returned || null,
                headers: returned?.headers || null
            };
        }

        const sessionWithUser = sessionData as ExtendedSession;
        const userId = sessionWithUser.user?.id;
        if (!userId) {
            return {
                response: returned?.response || returned || null,
                headers: returned?.headers || null
            };
        }

        // 5. Enrich with committees and permissions
        const { rows: realCommittees } = await pool.query(
            `SELECT c.id, c.name, c.azure_group_id, m.is_leader 
             FROM committee_members m 
             JOIN committees c ON m.committee_id = c.id 
             WHERE m.user_id = $1`,
            [userId]
        );

        sessionWithUser.user.committees = realCommittees;
        Object.assign(sessionWithUser.user, getPermissions(realCommittees));

        // 6. Ensure name is set
        if (!sessionWithUser.user.name && (sessionWithUser.user.first_name || sessionWithUser.user.last_name)) {
            sessionWithUser.user.name = `${sessionWithUser.user.first_name || ''} ${sessionWithUser.user.last_name || ''}`.trim();
        }

        // 7. Handle impersonation
        const requestHeaders = extractHeadersSafely(ctx);
        if (requestHeaders) {
            const cookies = requestHeaders.get("cookie") || "";
            const testToken = cookies.split("directus_test_token=")?.[1]?.split(";")?.[0];
            const isAdmin = sessionWithUser.user.isAdmin || sessionWithUser.user.isICT;

            if (testToken && isAdmin) {
                const targetUser = await getImpersonatedUser(testToken, pool);
                if (targetUser) {
                    sessionWithUser.impersonatedBy = {
                        id: sessionWithUser.user.id,
                        name: sessionWithUser.user.name || sessionWithUser.user.email,
                        email: sessionWithUser.user.email,
                        isNormallyAdmin: true
                    };
                    sessionWithUser.user = { ...targetUser, emailVerified: true, createdAt: new Date(), updatedAt: new Date() };
                }
            }

            // 8. Cache in Redis
            const token = requestHeaders.get("authorization")?.split(" ")[1] ||
                requestHeaders.get("cookie")?.split("better-auth.session-token=")?.[1]?.split(";")?.[0] ||
                requestHeaders.get("cookie")?.split("better-auth.session_token=")?.[1]?.split(";")?.[0];

            if (token && !sessionWithUser.impersonatedBy) {
                try {
                    const redis = await getRedis();
                    await redis.set(`session:${token}`, JSON.stringify(sessionWithUser), 'EX', 300);
                } catch (error) {
                    safeConsoleError(`[afterHandler] Redis Cache Error:`, error);
                }
            }
        }

        // 9. Return the enriched data in the format Better Auth expects: { response, headers }
        const isResponse = returned && typeof returned === 'object' && 
                          (returned instanceof Response || 
                           (typeof (returned as any).clone === 'function' && 'headers' in returned));

        if (isResponse) {
            const newResponse = new Response(JSON.stringify(sessionWithUser), {
                status: (returned as any).status || 200,
                statusText: (returned as any).statusText || 'OK',
                headers: (returned as any).headers
            });
            return {
                response: newResponse,
                headers: newResponse.headers
            };
        }

        const originalHeaders = (returned && typeof returned === 'object' && 'headers' in returned) 
            ? (returned as any).headers 
            : null;

        return {
            response: sessionWithUser,
            headers: originalHeaders
        };

    } catch (error) {
        safeConsoleError(`[redis-session/handlers.ts][afterHandler] Critical Error:`, error);
        // Fallback to returning the original data in the expected structure if possible
        return {
            response: returned?.response || returned || null,
            headers: returned?.headers || null
        };
    }
}
