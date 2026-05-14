/**
 * parseBoolean: Robustly converts various truthy/falsy values to a boolean.
 * Handles common form and database representations without needing 'as any' casts.
 */
export function parseBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const lower = value.toLowerCase().trim();
        return lower === 'true' || lower === 'on' || lower === '1' || lower === 'yes';
    }
    if (typeof value === 'number') return value === 1;
    return !!value;
}
