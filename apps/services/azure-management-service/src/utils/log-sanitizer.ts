const SENSITIVE_KEYS = ['password', 'token', 'session', 'secret', 'iban', 'bsn', 'cookie', 'authorization'];
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const IBAN_REGEX = /[A-Z]{2}\d{2}[A-Z0-9]{11,30}/g;
const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const JWT_REGEX = /ey[a-zA-Z0-9-_=]+\.ey[a-zA-Z0-9-_=]+\.[a-zA-Z0-9-_+/=]+/g;
const BEARER_REGEX = /bearer\s+[a-zA-Z0-9\-._~+/]+=*/gi;
const DB_CONN_REGEX = /(?:postgres|postgresql|redis):\/\/[^@\s]+@[^:\s]+:\d+[^\s]*/gi;
const INTERNAL_URL_REGEX = /https?:\/\/(?:localhost|127\.0\.0\.1|v7-core-db|finance-service|azure-management-service|azure-sync-service|mail-service|directus)\b[^\s]*/gi;

export function redactString(str: string): string {
    return str
        .replace(DB_CONN_REGEX, '[REDACTED_CONNECTION_STRING]')
        .replace(INTERNAL_URL_REGEX, '[REDACTED_INTERNAL_URL]')
        .replace(JWT_REGEX, '[REDACTED_JWT]')
        .replace(BEARER_REGEX, '[REDACTED_BEARER]')
        .replace(UUID_REGEX, '[REDACTED_UUID]')
        .replace(EMAIL_REGEX, '[MASKED_EMAIL]')
        .replace(IBAN_REGEX, '[MASKED_IBAN]');
}

export function sanitizePayload(payload: unknown, seen = new WeakSet<object>()): unknown {
    if (typeof payload === 'string') {
        return redactString(payload);
    }

    if (!payload || typeof payload !== 'object') return payload;

    if (seen.has(payload)) {
        return '[CIRCULAR]';
    }
    seen.add(payload);

    if (Array.isArray(payload)) {
        const sanitizedArray = payload.map(item => sanitizePayload(item, seen));
        seen.delete(payload);
        return sanitizedArray;
    }

    const isError = payload instanceof Error;
    const sanitized: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
    const entries: [string, unknown][] = isError
        ? [['message', payload.message], ['stack', payload.stack], ...Object.entries(payload)]
        : Object.entries(payload);

    for (const [key, value] of entries) {
        const lowerKey = key.toLowerCase();
        let finalValue: unknown;

        if (SENSITIVE_KEYS.some(k => lowerKey.includes(k))) {
            finalValue = '[REDACTED]';
        } else if (lowerKey === 'email') {
            finalValue = '[MASKED_EMAIL]';
        } else if (value !== null && typeof value === 'object') {
            finalValue = sanitizePayload(value, seen);
        } else if (typeof value === 'string') {
            finalValue = redactString(value);
        } else {
            finalValue = value;
        }

        Reflect.set(sanitized, key, finalValue);
    }

    seen.delete(payload);
    return sanitized;
}