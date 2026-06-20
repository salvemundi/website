import { sanitizePayload, redactString } from './log-sanitizer.js';

export function logInternalError(message: string, context?: unknown) {
    const sanitizedMessage = redactString(message);
    const sanitizedContext = context ? sanitizePayload(context) : '';
    console.error(`[ERROR] ${sanitizedMessage}`, sanitizedContext);
}

export function logInfo(message: string, context?: unknown) {
    const sanitizedMessage = redactString(message);
    const sanitizedContext = context ? sanitizePayload(context) : '';
    console.log(`[INFO] ${sanitizedMessage}`, sanitizedContext);
}

export function logWarn(message: string, context?: unknown) {
    const sanitizedMessage = redactString(message);
    const sanitizedContext = context ? sanitizePayload(context) : '';
    console.warn(`[WARN] ${sanitizedMessage}`, sanitizedContext);
}

export function safeConsoleLog(context: string, message: string) {
    const sanitizedMessage = redactString(message);
    const sanitizedContext = redactString(context);
    console.log(`[${sanitizedContext}] ${sanitizedMessage}`);
}

export function safeConsoleError(context: string, error?: unknown) {
    let rawMessage: string;

    if (error instanceof Error) {
        rawMessage = error.message;
    } else if (typeof error === 'string') {
        rawMessage = error;
    } else if (typeof error === 'object' && error !== null) {
        try {
            rawMessage = JSON.stringify(error);
        } catch {
            rawMessage = '[Unserializable Object]';
        }
    } else if (typeof error === 'number' || typeof error === 'boolean' || typeof error === 'bigint' || typeof error === 'symbol') {
        rawMessage = String(error);
    } else {
        rawMessage = 'Onbekende fout';
    }

    const sanitizedMessage = redactString(rawMessage);
    const sanitizedContext = redactString(context);

    console.error(`[${sanitizedContext}] ${sanitizedMessage}`);
    logInternalError(sanitizedMessage, { context: sanitizedContext, originalError: error });
}