import 'server-only';
import { safeConsoleError } from '@/server/utils/logger';

export class MobileError extends Error {
    public code: string;
    public status: number;
    constructor(code: string, message: string, status = 400) {
        super(message);
        this.code = code;
        this.status = status;
    }
}
export { mobileEnabled } from './policy';
import { mobileEnabled } from './policy';
const responseHeaders = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
export function mobileResponse<T>(data: T, status = 200): Response {
    return Response.json({ data }, { status, headers: responseHeaders });
}
export function mobileError(code: string, message: string, status = 400): Response {
    return Response.json({ error: { code, message } }, { status, headers: responseHeaders });
}
export function mobileRoute(handler: (request: Request) => Promise<Response>) {
    return async (request: Request): Promise<Response> => {
        if (!mobileEnabled()) return mobileError('not_found', 'Niet gevonden.', 404);
        try { return await handler(request); }
        catch (error) {
            if (error instanceof MobileError) return mobileError(error.code, error.message, error.status);
            safeConsoleError('[mobile] Request failed', { name: error instanceof Error ? error.name : 'unknown' });
            return mobileError('server_error', 'De verbinding is tijdelijk niet beschikbaar. Probeer opnieuw.', 503);
        }
    };
}
export interface MobileJSON { [key: string]: unknown }
export async function readMobileJSON(request: Request, maxBytes = 16384): Promise<MobileJSON> {
    if (Number(request.headers.get('content-length') || 0) > maxBytes) throw new MobileError('invalid_request', 'Verzoek te groot.', 413);
    const reader = request.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    if (reader) {
        try {
            let chunk = await reader.read();
            while (!chunk.done) {
                size += chunk.value.byteLength;
                if (size > maxBytes) {
                    await reader.cancel();
                    throw new MobileError('invalid_request', 'Verzoek te groot.', 413);
                }
                chunks.push(chunk.value);
                chunk = await reader.read();
            }
        } finally { reader.releaseLock(); }
    }
    const raw = Buffer.concat(chunks).toString('utf8');
    try {
        const value: unknown = JSON.parse(raw);
        if (typeof value !== 'object' || !value || Array.isArray(value)) throw new Error('object required');
        return value as MobileJSON;
    } catch { throw new MobileError('invalid_request', 'Ongeldige invoer.'); }
}
