import { sanitizePayload } from './log-sanitizer';
export function logInternalError(message: string, context?: unknown) {
    const sanitizedContext = context ? sanitizePayload(context) : '';
    console.error(`[ERROR] ${message}`, sanitizedContext);
}

export function safeConsoleError(context: string, error?: unknown) {
    const message = error instanceof Error
        ? error.message
        : typeof error === 'string'
            ? error
            : error
                ? String(error)
                : 'Onbekende of onverwachte fout';

    console.error(`${context} | ${message}`);
    logInternalError(message, { context, originalError: error });
}