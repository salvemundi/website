export function safeConsoleError(context: string, error?: unknown) {
    let message: string;

    if (error instanceof Error) {
        message = error.message;
    } else if (typeof error === 'string') {
        message = error;
    } else if (typeof error === 'object' && error !== null) {
        try {
            message = JSON.stringify(error);
        } catch {
            message = '[Unserializable Object]';
        }
    } else if (typeof error === 'number' || typeof error === 'boolean' || typeof error === 'bigint' || typeof error === 'symbol') {
        message = String(error);
    } else {
        message = 'Onbekende fout';
    }

    console.error(`[${context}] ${message}`);
}

export function safeConsoleLog(message: string): void;
export function safeConsoleLog(context: string, message: string): void;
export function safeConsoleLog(contextOrMessage: string, message?: string) {
    if (message !== undefined) {
        console.log(`[${contextOrMessage}] ${message}`);
    } else {
        console.log(contextOrMessage);
    }
}