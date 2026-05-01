interface ActivityOption {
    id: string;
    name: string;
}

/**
 * Maps a selection ID (like "opt-1" or a custom ID) to a human-readable name
 * based on the activity's configured options.
 * 
 * @param optId The selection ID from the database (e.g., "opt-0")
 * @param metaOptions The array of configured options for the activity
 * @returns The readable name of the option or the original ID as fallback
 */
export function mapActivityOptionIdToName(optId: string, metaOptions: ActivityOption[]): string {
    if (!Array.isArray(metaOptions)) return optId;

    // 1. Try to find by explicit ID if it exists (for future-proofing/extensibility)
    const exactMatch = metaOptions.find((m: ActivityOption) => m.id === optId);
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
    const nameMatch = metaOptions.find((m: ActivityOption) => m.name === optId);
    if (nameMatch) return nameMatch.name;

    return optId;
}

/**
 * Safely parses activity options that might be a string or an object.
 */
export function parseActivityOptions(options: unknown): ActivityOption[] {
    if (!options) return [];
    if (Array.isArray(options)) return options as ActivityOption[];
    if (typeof options === 'string') {
        try {
            return JSON.parse(options) as ActivityOption[];
        } catch {
            return [];
        }
    }
    return [];
}

/**
 * Safely parses selected options that might be a string or a record.
 */
export function parseSelectedOptions(selected: unknown): Record<string, boolean> {
    if (!selected) return {};
    if (typeof selected === 'object' && selected !== null && !Array.isArray(selected)) return selected as Record<string, boolean>;
    if (typeof selected === 'string') {
        try {
            const parsed = JSON.parse(selected);
            return (typeof parsed === 'object' && parsed !== null) ? parsed : {};
        } catch {
            return {};
        }
    }
    return {};
}
