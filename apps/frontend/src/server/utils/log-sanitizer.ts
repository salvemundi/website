const SENSITIVE_KEYS = ['password', 'token', 'session', 'secret', 'iban', 'bsn', 'cookie', 'authorization'];

export function sanitizePayload(payload: unknown): unknown {
    if (!payload || typeof payload !== 'object') return payload;

    if (Array.isArray(payload)) {
        return payload.map(sanitizePayload);
    }

    const isError = payload instanceof Error;
    const sanitized: Record<string, unknown> = Object.create(null);
    const keys = isError ? ['message', 'stack', ...Object.keys(payload)] : Object.keys(payload);

    for (const key of keys) {
        const value = (payload as any)[key];
        const lowerKey = key.toLowerCase();
        let finalValue: unknown;

        if (SENSITIVE_KEYS.some(k => lowerKey.includes(k))) {
            finalValue = '[REDACTED]';
        } else if (lowerKey === 'email') {
            finalValue = '[MASKED_EMAIL]';
        } else if (value !== null && typeof value === 'object') {
            finalValue = sanitizePayload(value);
        } else {
            finalValue = value;
        }

        Reflect.set(sanitized, key, finalValue);
    }

    return sanitized;
}