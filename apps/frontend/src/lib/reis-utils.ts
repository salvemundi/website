/**
 * Utility functions for trip-related mapping and display logic.
 */

/**
 * Maps a selection ID (like "opt-1" or a custom ID) to a human-readable name
 * based on the activity's configured options.
 * 
 * @param optId The selection ID from the database (e.g., "opt-0")
 * @param metaOptions The array of configured options for the activity
 * @returns The readable name of the option or the original ID as fallback
 */
export function mapActivityOptionIdToName(optId: string, metaOptions: any[]): string {
    if (!Array.isArray(metaOptions)) return optId;

    // 1. Try to find by explicit ID if it exists (for future-proofing/extensibility)
    const exactMatch = metaOptions.find((m: any) => m.id === optId);
    if (exactMatch?.name) return exactMatch.name;

    // 2. Try to parse "opt-X" format for indexed options
    if (typeof optId === 'string' && optId.startsWith('opt-')) {
        const indexStr = optId.split('-')[1];
        const index = parseInt(indexStr);
        
        if (!isNaN(index) && metaOptions[index]) {
            return metaOptions[index].name || optId;
        }
    }

    // 3. Fallback: Check if the optId itself is actually the name (sometimes happens in legacy data or simpler forms)
    const nameMatch = metaOptions.find((m: any) => m.name === optId);
    if (nameMatch) return nameMatch.name;

    return optId;
}

/**
 * Safely parses activity options that might be a string or an object.
 */
export function parseActivityOptions(options: any): any[] {
    if (!options) return [];
    if (Array.isArray(options)) return options;
    if (typeof options === 'string') {
        try {
            return JSON.parse(options);
        } catch {
            return [];
        }
    }
    return [];
}

/**
 * Safely parses selected options that might be a string or a record.
 */
export function parseSelectedOptions(selected: any): Record<string, boolean> {
    if (!selected) return {};
    if (typeof selected === 'object' && !Array.isArray(selected)) return selected;
    if (typeof selected === 'string') {
        try {
            const parsed = JSON.parse(selected);
            return typeof parsed === 'object' ? parsed : {};
        } catch {
            return {};
        }
    }
    return {};
}
