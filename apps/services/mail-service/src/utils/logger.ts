export function safeConsoleError(context: string, error?: unknown) {
    const message = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
            ? error 
            : error && typeof error === 'object'
                ? JSON.stringify(error)
                : error !== undefined && error !== null
                    ? (error as number | boolean).toString()
                    : 'Onbekende fout';
    console.error(`[${context}] ${message}`);
}

export function safeConsoleLog(message: string) {
    console.log(message);
}