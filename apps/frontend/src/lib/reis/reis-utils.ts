import { safeConsoleError } from '@/server/utils/logger';

export interface ActivityOption {
    id?: string | null;
    name?: string | null;
    price?: number | null;
}

export function mapActivityOptionIdToName(optId: string, metaOptions: ActivityOption[]): string {
    if (!Array.isArray(metaOptions)) return optId;

    const exactMatch = metaOptions.find((m: ActivityOption) => m.id === optId);
    if (exactMatch?.name) return exactMatch.name;

    if (typeof optId === 'string' && optId.startsWith('opt-')) {
        const indexStr = optId.split('-')[1];
        const index = parseInt(indexStr);

        if (!isNaN(index) && index >= 0 && index < metaOptions.length) {
            const option = metaOptions.find((_, i) => i === index);
            return option?.name || optId;
        }
    }

    const nameMatch = metaOptions.find((m: ActivityOption) => m.name === optId);
    if (nameMatch?.name) return nameMatch.name;

    return optId;
}

export function parseActivityOptions(options: unknown): ActivityOption[] {
    if (!options) return [];
    if (Array.isArray(options)) return options as ActivityOption[];
    if (typeof options === 'string') {
        try {
            return JSON.parse(options) as ActivityOption[];
        } catch (error) {
            safeConsoleError('[ReisUtils][parseActivityOptions]', error);
            return [];
        }
    }
    return [];
}

export function parseSelectedOptions(selected: unknown): Record<string, boolean> {
    if (!selected) return {};
    if (typeof selected === 'object' && !Array.isArray(selected)) return selected as Record<string, boolean>;
    if (typeof selected === 'string') {
        try {
            const parsed = JSON.parse(selected) as unknown;
            return (typeof parsed === 'object' && parsed !== null) ? (parsed as Record<string, boolean>) : {};
        } catch (error) {
            safeConsoleError('[ReisUtils][parseSelectedOptions]', error);
            return {};
        }
    }
    return {};
}