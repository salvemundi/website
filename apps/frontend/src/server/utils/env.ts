import 'server-only';
/**
 * Utility for robust environment variable management.
 * Handles manual ${VAR} expansion which sometimes fails in certain Windows environments/Next.js versions.
 */

export function getExpandedEnv(key: string, defaultValue?: string): string {
    const value = process.env[key];

    if (!value) {
        if (defaultValue !== undefined) return defaultValue;
        return '';
    }

    // Check for ${VAR} pattern
    const expansionPattern = /\${([^}]+)}/g;
    
    if (expansionPattern.test(value)) {
        // Reset lastIndex because of test()
        expansionPattern.lastIndex = 0;
        
        return value.replace(expansionPattern, (_, varName) => {
            const expanded = process.env[varName];
            return expanded || '';
        });
    }

    return value;
}
