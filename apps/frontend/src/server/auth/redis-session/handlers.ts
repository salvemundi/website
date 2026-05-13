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
    const returned = ctx.context?.returned || (ctx as { response?: unknown }).response;
    try {
        let sessionData: unknown = null;

        if (returned && typeof returned === 'object' && 'clone' in returned) {
            try {
                sessionData = await (returned as Response).clone().json();
            } catch (error) {
                safeConsoleError(`[redis-session/handlers.ts][afterHandler] Error cloning response:`, error);
                return returned;
            }
        } else {
            sessionData = returned;
        }

        if (sessionData && typeof sessionData === 'object' && 'response' in sessionData) {
            sessionData = (sessionData as { response: ExtendedSession }).response;
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

        const token = requestHeaders.get("authorization")?.split(" ")[1] ||
            requestHeaders.get("cookie")?.split("better-auth.session-token=")?.[1]?.split(";")?.[0] ||
            requestHeaders.get("cookie")?.split("better-auth.session_token=")?.[1]?.split(";")?.[0];

        if (token && !sessionWithUser.impersonatedBy) {
            try {
                const redis = await getRedis();
                await redis.set(`session:${token}`, JSON.stringify(sessionWithUser), 'EX', 300);
            } catch (error) {
                safeConsoleError(`[redis-session/handlers.ts][afterHandler] Error while caching session:`, error);
            }
        }

        return { response: sessionWithUser };
    } catch (error) {
        safeConsoleError(`[redis-session/handlers.ts][afterHandler] Error in afterHandler:`, error);
        return returned;
    }
}
