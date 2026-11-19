import type { NextRequest } from 'next/server';
import type { Session } from 'better-auth';
import type { EnrichedUser } from '@/types/auth';
import type { BeheerFeature } from '@/shared/lib/permissions-config';
import type { StronglyTypedAdminUser } from '@/server/actions/beheer/beheer-utils.actions';
import { getRedis } from '@/server/auth/redis-client';
import { safeConsoleError } from '@/server/utils/logger';

const REDIS_SESSION_TIMEOUT_MS = 500;
const INTERNAL_SESSION_TIMEOUT_MS = 10000;

interface SessionPayload {
    user?: unknown;
}

interface CachedSession {
    user?: unknown;
    response?: SessionPayload;
}

interface InternalSessionResponse {
    user?: unknown;
    response?: SessionPayload;
}

export interface ProxySessionResolution {
    hasSession: boolean;
    setCookieHeaders: string[];
}

export interface ProxySessionOptions {
    clientIp: string;
    publicUrl: string;
    redisTimeoutMs?: number;
}

export type ActiveSession = {
    user: EnrichedUser;
    session: Session;
};

export type MemberSessionVerification =
    | { ok: true; session: ActiveSession }
    | { ok: false; reason: 'unauthenticated' | 'not_member' };

export type AdminSessionVerification =
    | { ok: true; user: StronglyTypedAdminUser; isLeader: boolean; canToggleVisibility: boolean }
    | { ok: false; error: string };

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number, label: string): Promise<T> {
    let timerId: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_resolve, reject) => {
        timerId = setTimeout(() => {
            reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
    });

    try {
        return await Promise.race([operation, timeoutPromise]);
    } finally {
        if (timerId !== undefined) {
            clearTimeout(timerId);
        }
    }
}

function extractCookieToken(rawCookie: string, cookieName: string): string | undefined {
    const parts = rawCookie.split(`${cookieName}=`);
    const secondPart = parts.at(1);
    if (!secondPart) return undefined;
    return secondPart.split(';').at(0)?.trim() || undefined;
}

function extractProxyCookies(request: NextRequest): {
    rawCookie: string;
    sessionToken: string | undefined;
    hasTestToken: boolean;
    hasSessionCookie: boolean;
} {
    const rawCookie = request.headers.get('cookie') || '';
    const sessionTokenRaw =
        request.cookies.get('better-auth.session_token')?.value ||
        request.cookies.get('better-auth.session-token')?.value ||
        request.cookies.get('__Secure-better-auth.session_token')?.value ||
        request.cookies.get('__Secure-better-auth.session-token')?.value ||
        extractCookieToken(rawCookie, 'better-auth.session_token') ||
        extractCookieToken(rawCookie, 'better-auth.session-token');

    const testTokenRaw =
        request.cookies.get('directus_impersonation_token')?.value ||
        extractCookieToken(rawCookie, 'directus_impersonation_token');

    const hasTestToken = Boolean(testTokenRaw);
    const sessionToken = sessionTokenRaw ? sessionTokenRaw.split('.').at(0) : undefined;
    const hasSessionCookie = Boolean(sessionTokenRaw) || hasTestToken;

    return { rawCookie, sessionToken, hasTestToken, hasSessionCookie };
}

export class SessionService {
    async resolveProxySession(
        request: NextRequest,
        options: ProxySessionOptions
    ): Promise<ProxySessionResolution> {
        const { rawCookie, sessionToken, hasTestToken, hasSessionCookie } = extractProxyCookies(request);
        const redisTimeoutMs = options.redisTimeoutMs ?? REDIS_SESSION_TIMEOUT_MS;

        if (sessionToken && !hasTestToken) {
            const hasCachedSession = await this.checkRedisSession(sessionToken, redisTimeoutMs);
            if (hasCachedSession) {
                return { hasSession: true, setCookieHeaders: [] };
            }
        }

        if (!hasSessionCookie) {
            return { hasSession: false, setCookieHeaders: [] };
        }

        return this.fetchInternalSession(request, rawCookie, options);
    }

    private async checkRedisSession(sessionToken: string, timeoutMs: number): Promise<boolean> {
        try {
            const cached = await withTimeout(
                (async (): Promise<string | null> => {
                    const redis = await getRedis();
                    return redis.get(`session:${sessionToken}`);
                })(),
                timeoutMs,
                'Redis session cache lookup'
            );

            if (!cached) return false;

            const sessionData = JSON.parse(cached) as CachedSession;
            return Boolean(sessionData.user || sessionData.response?.user);
        } catch (redisError: unknown) {
            const typedRedisError = redisError instanceof Error ? redisError : new Error(String(redisError));
            safeConsoleError(
                '[SessionService.ts][checkRedisSession] ',
                `Redis session cache check failed (falling back to database): ${typedRedisError.message}`
            );
            return false;
        }
    }

    private async fetchInternalSession(
        request: NextRequest,
        rawCookie: string,
        options: ProxySessionOptions
    ): Promise<ProxySessionResolution> {
        const { origin } = request.nextUrl;
        const host = request.headers.get('host') || request.nextUrl.host;
        const internalBase = process.env.NEXT_APP_INTERNAL_URL || origin;
        const sessionUrl = new URL('/api/auth/get-session', internalBase);

        try {
            const sessionRes = await fetch(sessionUrl, {
                headers: {
                    cookie: rawCookie,
                    'user-agent': request.headers.get('user-agent') || 'NextJS-Proxy',
                    accept: 'application/json',
                    origin: options.publicUrl,
                    referer: request.headers.get('referer') || options.publicUrl,
                    host,
                    'x-better-auth-origin': options.publicUrl,
                    'x-forwarded-host': host,
                    'x-forwarded-proto': origin.startsWith('https') ? 'https' : 'http',
                    'x-forwarded-for': request.headers.get('x-forwarded-for') || options.clientIp,
                    'x-real-ip': options.clientIp,
                },
                cache: 'no-store',
                signal: AbortSignal.timeout(INTERNAL_SESSION_TIMEOUT_MS),
            });

            if (!sessionRes.ok || sessionRes.status === 204) {
                return { hasSession: false, setCookieHeaders: [] };
            }

            const text = await sessionRes.text();
            if (!text || text === 'null' || text === '{}') {
                return { hasSession: false, setCookieHeaders: [] };
            }

            try {
                const parsed = JSON.parse(text) as InternalSessionResponse;
                const sessionData = parsed.response ? parsed.response : parsed;
                if (!sessionData.user) {
                    return { hasSession: false, setCookieHeaders: [] };
                }

                const setCookieHeaders: string[] = [];
                sessionRes.headers.forEach((value, key) => {
                    if (key.toLowerCase() === 'set-cookie') {
                        setCookieHeaders.push(value);
                    }
                });

                return { hasSession: true, setCookieHeaders };
            } catch (parseError: unknown) {
                const typedParseError = parseError instanceof Error ? parseError : new Error(String(parseError));
                safeConsoleError(
                    '[SessionService.ts][fetchInternalSession] ',
                    `Failed to parse session text response: ${typedParseError.message}`
                );
                return { hasSession: false, setCookieHeaders: [] };
            }
        } catch (fetchError: unknown) {
            const typedFetchError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
            safeConsoleError(
                '[SessionService.ts][fetchInternalSession] ',
                `Fetch error retrieving session from internal API: ${typedFetchError.message}`
            );
            return { hasSession: false, setCookieHeaders: [] };
        }
    }

    async getSession(): Promise<ActiveSession | null> {
        const { getEnrichedSession } = await import('@/server/auth/auth-utils');
        return getEnrichedSession();
    }

    async verifyMemberSession(): Promise<MemberSessionVerification> {
        const session = await this.getSession();
        if (!session?.user) {
            return { ok: false, reason: 'unauthenticated' };
        }

        if (session.user.membership_status !== 'active') {
            return { ok: false, reason: 'not_member' };
        }

        return { ok: true, session };
    }

    async requireAdminFeature(feature: BeheerFeature): Promise<{
        user: StronglyTypedAdminUser;
        isLeader: boolean;
        canToggleVisibility: boolean;
    }> {
        const { enforceFeatureAccess } = await import('@/server/actions/beheer/beheer-utils.actions');
        return enforceFeatureAccess(feature);
    }

    async verifyAdminFeature(feature: BeheerFeature): Promise<AdminSessionVerification> {
        try {
            const access = await this.requireAdminFeature(feature);
            return {
                ok: true,
                user: access.user,
                isLeader: access.isLeader,
                canToggleVisibility: access.canToggleVisibility,
            };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Je hebt geen rechten voor deze actie.';
            return { ok: false, error: message };
        }
    }
}

export const sessionService = new SessionService();
