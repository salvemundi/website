import { Redis } from 'ioredis';
import { SyncStatus, SYNC_REDIS_KEY, DEFAULT_SYNC_STATUS } from './sync-types.js';

export function parseAzureDate(dateStr?: string): string | null {
    if (!dateStr || dateStr.length !== 8) return null;
    return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
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
        return JSON.parse(data);
    } catch {
        return getInitialStatus();
    }
}

export async function persistSyncStatus(redis: Redis, status: SyncStatus, forceJobIdMatch: boolean = true) {
    if (forceJobIdMatch) {
        const current = await getSyncStatus(redis);
        if (current.jobId && current.jobId !== status.jobId && current.active) {
            console.warn(`[SYNC] Ghost job detected (${status.jobId}). Will not overwrite running job ${current.jobId}`);
            return;
        }
    }
    await redis.set(SYNC_REDIS_KEY, JSON.stringify(status), 'EX', 86400 * 7);
}
