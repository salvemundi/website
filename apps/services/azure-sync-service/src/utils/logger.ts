export function safeConsoleError(context: string, error?: any) {
    const message = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
            ? error 
            : String(error || 'Onbekende fout');
    console.error(`[${context}] ${message}`);
}