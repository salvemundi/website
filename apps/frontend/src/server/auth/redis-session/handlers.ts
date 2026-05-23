import { Pool } from "pg";
import { getRedis } from "@/server/auth/redis-client";
import { getPermissions, type Committee } from "@/shared/lib/permissions";
import { type AuthContext, type ExtendedSession } from "./types";
import { extractHeadersSafely } from "./utils";
import { getImpersonatedUser } from "./impersonation";
import { safeConsoleError } from '@/server/utils/logger';

type ReturnedSessionLike = {
    response?: unknown;
    returned?: unknown;
    headers?: HeadersInit;
    status?: number;
    statusText?: string;
};

function isResponseLike(value: unknown): value is Response {
    return value instanceof Response;
}

function hasClone(value: unknown): value is { clone: () => Response } {
    return typeof value === 'object' && value !== null && 'clone' in value && typeof (value as { clone?: unknown }).clone === 'function';
}

export async function beforeHandler(ctx: AuthContext) {
    try {
        const requestHeaders = extractHeadersSafely(ctx);
        if (!requestHeaders) return;

        const authHeader = requestHeaders.get("authorization");
        const cookieHeader = requestHeaders.get("cookie");

        let token: string | undefined = undefined;
        if (authHeader) {
            token = authHeader.split(" ")[1];
        }
        if (!token && cookieHeader) {
            const parts = cookieHeader.split("better-auth.session-token=");
            if (parts.length > 1) {
                const part = parts[1];
                if (part) {
                    token = part.split(";")[0];
                }
            }
        }
        if (!token && cookieHeader) {
            const parts = cookieHeader.split("better-auth.session_token=");
            if (parts.length > 1) {
                const part = parts[1];
                if (part) {
                    token = part.split(";")[0];
                }
            }
        }

        if (!token || (cookieHeader && cookieHeader.includes("directus_test_token="))) return;

        const redis = await getRedis();
        const cached = await redis.get(`session:${token}`);
        if (cached) {
            let parsed: unknown;
            try {
                parsed = JSON.parse(cached);
            } catch (error) {
                safeConsoleError('[redis-session/handlers][beforeHandler] JSON Parse Error', error);
                return;
            }

            const finalSession = (parsed && typeof parsed === 'object' && 'response' in parsed)
                ? (parsed as { response: ExtendedSession }).response
                : parsed as Partial<ExtendedSession> | null | undefined;

            if (!finalSession || !finalSession.user) return;

            return { response: finalSession as ExtendedSession };
        }
    } catch (error) {
        safeConsoleError('[redis-session/handlers/beforeHandler] Critical Error:', error);
        return;
    }
}

export async function afterHandler(ctx: AuthContext, pool: Pool) {
    const context = ctx as AuthContext & ReturnedSessionLike & { context?: ReturnedSessionLike };
    const returned = context.context?.returned || context.response || context.returned;

    try {
        let sessionData: unknown = null;

        if (hasClone(returned)) {
            try {
                sessionData = await returned.clone().json();
            } catch (error) {
                // Log de fout, zo is 'error' nuttig gebruikt
                safeConsoleError('[redis-session/handlers][afterHandler] Clone/JSON error', error);
                return {
                    response: context.response || returned,
                    headers: context.headers || null
                };
            }
        } else {
            sessionData = returned;
        }

        if (sessionData && typeof sessionData === 'object' && 'response' in sessionData) {
            sessionData = (sessionData as { response?: unknown }).response;
        }

        if (!sessionData || typeof sessionData !== 'object' || !('user' in sessionData) || !sessionData.user) {
            return {
                response: context.response || returned || null,
                headers: context.headers || null
            };
        }

        const sessionWithUser = sessionData as ExtendedSession;
        const userId = sessionWithUser.user.id;
        if (!userId) {
            return {
                response: context.response || returned || null,
                headers: context.headers || null
            };
        }

        const { rows: realCommittees } = await pool.query(
            `SELECT c.id, c.name, c.azure_group_id, m.is_leader 
             FROM committee_members m 
             JOIN committees c ON m.committee_id = c.id 
             WHERE m.user_id = $1`,
            [userId]
        );

        const typedCommittees = realCommittees as unknown as Committee[];
        sessionWithUser.user.committees = typedCommittees;
        Object.assign(sessionWithUser.user, getPermissions(typedCommittees));

        if (!sessionWithUser.user.name && (sessionWithUser.user.first_name || sessionWithUser.user.last_name)) {
            sessionWithUser.user.name = `${sessionWithUser.user.first_name || ''} ${sessionWithUser.user.last_name || ''}`.trim();
        }

        const requestHeaders = extractHeadersSafely(ctx);
        if (requestHeaders) {
            const cookies = requestHeaders.get("cookie") || "";
            let testToken: string | undefined = undefined;
            const cookieParts = cookies.split("directus_test_token=");
            if (cookieParts.length > 1) {
                const part = cookieParts[1];
                if (part) {
                    testToken = part.split(";")[0];
                }
            }
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

            let token: string | undefined = undefined;
            const authHeader = requestHeaders.get("authorization");
            if (authHeader) {
                token = authHeader.split(" ")[1];
            }
            const cookieHeader = requestHeaders.get("cookie");
            if (!token && cookieHeader) {
                const parts = cookieHeader.split("better-auth.session-token=");
                if (parts.length > 1) {
                    const part = parts[1];
                    if (part) {
                        token = part.split(";")[0];
                    }
                }
            }
            if (!token && cookieHeader) {
                const parts = cookieHeader.split("better-auth.session_token=");
                if (parts.length > 1) {
                    const part = parts[1];
                    if (part) {
                        token = part.split(";")[0];
                    }
                }
            }

            if (token && !sessionWithUser.impersonatedBy) {
                try {
                    const redis = await getRedis();
                    await redis.set(`session:${token}`, JSON.stringify(sessionWithUser), 'EX', 300);
                } catch (error) {
                    safeConsoleError('[redis-session/handlers][afterHandler] Redis Cache Error:', error);
                }
            }
        }

        const isResponse = returned && typeof returned === 'object' &&
            (isResponseLike(returned) || hasClone(returned));

        if (isResponse) {
            const newResponse = new Response(JSON.stringify(sessionWithUser), {
                status: context.status || 200,
                statusText: context.statusText || 'OK',
                headers: context.headers
            });
            return {
                response: newResponse,
                headers: newResponse.headers
            };
        }

        const originalHeaders = (returned && typeof returned === 'object' && 'headers' in returned)
            ? (returned as { headers?: HeadersInit }).headers
            : null;

        return {
            response: sessionWithUser,
            headers: originalHeaders
        };

    } catch (error) {
        safeConsoleError('[redis-session/handlers][afterHandler] Critical Error:', error);
        return {
            response: context.response || returned || null,
            headers: context.headers || null
        };
    }
}