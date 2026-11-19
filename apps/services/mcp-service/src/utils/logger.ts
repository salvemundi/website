/** Logt alleen de foutmelding (config-fouten bevatten uitsluitend veldnamen, nooit waarden). */
export function safeConsoleError(context: string, error?: unknown) {
    const message = error instanceof Error ? error.message : 'Onbekende fout';
    console.error(`[${context}] ${message}`);
}
