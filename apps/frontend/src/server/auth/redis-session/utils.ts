import { safeConsoleError } from '@/server/utils/logger';

export function extractHeadersSafely(ctx: unknown): Headers | null {
    if (!ctx || typeof ctx !== 'object') {
        return null;
    }

    try {
        if ('request' in ctx && ctx.request && typeof ctx.request === 'object' && 'headers' in ctx.request) {
            const h = (ctx.request as { headers?: unknown }).headers;
            if (h instanceof Headers) return h;
            if (h && typeof h === 'object') return new Headers(h as Record<string, string>);
        }

        if ('headers' in ctx && (ctx as { headers?: unknown }).headers) {
            const h = (ctx as { headers?: unknown }).headers;
            if (h instanceof Headers) return h;
            if (h && typeof h === 'object') return new Headers(h as Record<string, string>);
        }

        if ('req' in ctx && ctx.req && typeof ctx.req === 'object' && 'headers' in ctx.req) {
            const h = (ctx.req as { headers?: unknown }).headers;
            if (h instanceof Headers) return h;
            if (h && typeof h === 'object') return new Headers(h as Record<string, string>);
        }
    } catch (error: unknown) {
        safeConsoleError('[RedisPlugin][extractHeadersSafely] Error:', error);
    }

    return null;
}