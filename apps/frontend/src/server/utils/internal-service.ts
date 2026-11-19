import 'server-only';
import { safeConsoleError } from '@/server/utils/logger';

export type InternalServiceErrorCode = 'MISCONFIGURED' | 'TLS_ERROR' | 'TIMEOUT' | 'UNREACHABLE';

export type InternalServiceFetchResult =
    | { ok: true; response: Response }
    | { ok: false; code: InternalServiceErrorCode; userMessage: string };

const TLS_ERROR_CODES = new Set([
    'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
    'SELF_SIGNED_CERT_IN_CHAIN',
    'DEPTH_ZERO_SELF_SIGNED_CERT',
    'CERT_HAS_EXPIRED',
    'ERR_TLS_CERT_ALTNAME_INVALID',
]);

function extractErrorCauseCode(error: unknown): string | undefined {
    if (error && typeof error === 'object' && 'cause' in error) {
        const cause = (error as { cause?: unknown }).cause;
        if (cause && typeof cause === 'object' && 'code' in cause && typeof (cause as { code?: unknown }).code === 'string') {
            return (cause as { code: string }).code;
        }
    }
    if (error && typeof error === 'object' && 'code' in error && typeof (error as { code?: unknown }).code === 'string') {
        return (error as { code: string }).code;
    }
    return undefined;
}

export async function fetchInternalService(
    serviceName: string,
    baseUrl: string | undefined,
    path: string,
    init: RequestInit = {},
    timeoutMs: number = 15000
): Promise<InternalServiceFetchResult> {
    const trimmedBase = baseUrl?.trim().replace(/\/+$/, '');
    const internalToken = process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();

    if (!trimmedBase || !internalToken) {
        safeConsoleError(`[internal-service][${serviceName}]`, 'Service URL of INTERNAL_SERVICE_TOKEN ontbreekt.');
        return {
            ok: false,
            code: 'MISCONFIGURED',
            userMessage: `De koppeling met ${serviceName} is momenteel niet geconfigureerd.`,
        };
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${trimmedBase}${normalizedPath}`;
    const headers = new Headers(init.headers);
    if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${internalToken}`);
    }

    try {
        const response = await fetch(url, {
            ...init,
            headers,
            signal: init.signal ?? AbortSignal.timeout(timeoutMs),
        });
        return { ok: true, response };
    } catch (error: unknown) {
        const causeCode = extractErrorCauseCode(error);
        const isTimeout = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
        const isTlsError = Boolean(causeCode && TLS_ERROR_CODES.has(causeCode));

        safeConsoleError(
            `[internal-service][${serviceName}] Request naar ${trimmedBase}${normalizedPath} mislukt (${causeCode ?? (isTimeout ? 'TIMEOUT' : 'FETCH_FAILED')})`,
            error
        );

        if (isTimeout) {
            return {
                ok: false,
                code: 'TIMEOUT',
                userMessage: `${serviceName} reageerde niet op tijd. Probeer het later opnieuw.`,
            };
        }

        if (isTlsError) {
            return {
                ok: false,
                code: 'TLS_ERROR',
                userMessage: `Beveiligde verbinding met ${serviceName} mislukt (certificaat niet vertrouwd). Controleer je service-URL of certificaat.`,
            };
        }

        return {
            ok: false,
            code: 'UNREACHABLE',
            userMessage: `${serviceName} is momenteel niet bereikbaar. Probeer het later opnieuw.`,
        };
    }
}
