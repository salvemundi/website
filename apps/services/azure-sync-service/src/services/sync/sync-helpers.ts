import { Redis } from 'ioredis';
import { SyncStatus, SYNC_REDIS_KEY, getInitialStatus } from './sync-types.js';
import { safeConsoleError } from '../../utils/logger.js';

export function parseAzureDate(dateStr?: string): string | null {
    if (!dateStr || dateStr.length !== 8) return null;
    return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
}

export function sanitizeAzureDate(date?: string | null): string | null {
    if (!date || /^0001/.test(date) || date.includes('0001-01-01')) return null;
    return date;
}

const EXCLUDED_EMAILS = [
    'youtube@salvemundi.nl',
    'github@salvemundi.nl',
    'intern@salvemundi.nl',
    'ik.ben.de.website@salvemundi.nl',
    'voorzitter@salvemundi.nl',
    'twitch@salvemundi.nl',
    'secretaris@salvemundi.nl',
    'penningmeester@salvemundi.nl',
    'noreply@salvemundi.nl',
    'extern@salvemundi.nl',
    'commissaris.administratie@salvemundi.nl',
];

export function shouldExcludeUser(email?: string): boolean {
    if (!email) return true;
    const lowerEmail = email.toLowerCase();
    if (EXCLUDED_EMAILS.includes(lowerEmail)) return true;
    if (lowerEmail.startsWith('test-')) return true;
    return false;
}

export async function getSyncStatus(redis: Redis): Promise<SyncStatus> {
    const data = await redis.get(SYNC_REDIS_KEY);
    if (!data) return getInitialStatus();
    try {
        return JSON.parse(data) as SyncStatus;
    } catch (error) {
        safeConsoleError('[SyncUtils][getSyncStatus]', error);
        return getInitialStatus();
    }
}

export async function persistSyncStatus(redis: Redis, status: SyncStatus, forceJobIdMatch: boolean = true) {
    if (forceJobIdMatch) {
        const current = await getSyncStatus(redis);
        if (current.jobId && current.jobId !== status.jobId && current.active) {
            safeConsoleError(`[SYNC] Ghost job detected (${status.jobId}). Will not overwrite running job ${current.jobId}`);
            return;
        }
    }
    await redis.set(SYNC_REDIS_KEY, JSON.stringify(status), 'EX', 86400 * 7);
}