/**
 * Utility to normalize committee names for access checks.
 */
export function normalizeCommitteeName(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-').trim();
}
