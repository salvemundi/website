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

export function safeConsoleError(context: string, error?: unknown) {
    const rawMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
            ? error 
            : String(error || 'Onbekende fout');

    const sanitizedMessage = redactString(rawMessage);
    const sanitizedContext = redactString(context);

    console.error(`[${sanitizedContext}] ${sanitizedMessage}`);
    logInternalError(sanitizedMessage, { context: sanitizedContext, originalError: error });
}