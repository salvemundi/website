import { safeConsoleError } from '@/server/utils/logger';

export function extractHeadersSafely(ctx: unknown): Headers | null {
    if (!ctx || typeof ctx !== 'object') {
        return null;
    }

    try {
        // 1. Try request.headers
        if ('request' in ctx && ctx.request && typeof ctx.request === 'object' && 'headers' in ctx.request) {
            const h = (ctx.request as { headers?: unknown }).headers;
            if (h instanceof Headers) return h;
            if (h && typeof h === 'object') return new Headers(h as Record<string, string>);
        }

        // 2. Try top-level headers
        if ('headers' in ctx && ctx.headers) {
            const h = ctx.headers;
            if (h instanceof Headers) return h;
            if (h && typeof h === 'object') return new Headers(h as Record<string, string>);
        }

        // 3. Try legacy req.headers
        if ('req' in ctx && ctx.req && typeof ctx.req === 'object' && 'headers' in ctx.req) {
            const h = (ctx.req as { headers?: Record<string, string> }).headers;
            if (h && typeof h === 'object') return new Headers(h);
        }
    } catch (error) {
        safeConsoleError('[RedisPlugin] extractHeadersSafely - Error:', error);
    }

    return null;
}
