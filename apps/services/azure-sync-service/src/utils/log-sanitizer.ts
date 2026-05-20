const SENSITIVE_KEYS = ['password', 'token', 'session', 'secret', 'iban', 'bsn', 'cookie', 'authorization'];
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const IBAN_REGEX = /[A-Z]{2}\d{2}[A-Z0-9]{11,30}/g;

export function redactString(str: string): string {
    return str
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
        ? [['message', (payload).message], ['stack', (payload).stack], ...((((Object.entries(payload) as [string, unknown][]))))]
        : ((((Object.entries(payload) as [string, unknown][]))));

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



