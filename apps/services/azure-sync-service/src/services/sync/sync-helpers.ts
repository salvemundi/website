import { type Redis } from 'ioredis';
import { type SyncStatus, SYNC_REDIS_KEY, getInitialStatus } from './sync-types.js';
import { safeConsoleError } from '../../utils/logger.js';

export function parseAzureDate(dateStr?: string): string | null {
    if (!dateStr) return null;

    const cleaned = dateStr.trim();

    let year = 0;
    let month = 0;
    let day = 0;

    // Pattern 1: YYYYMMDD or YYYYDDMM (8 digits)
    if (/^\d{8}$/.test(cleaned)) {
        year = parseInt(cleaned.substring(0, 4), 10);
        month = parseInt(cleaned.substring(4, 6), 10);
        day = parseInt(cleaned.substring(6, 8), 10);
    } 
    // Pattern 2: YYYY-MM-DD or YYYY-DD-MM (10 chars)
    else if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
        const parts = cleaned.split('-');
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
    } 
    // Pattern 3: DD-MM-YYYY or MM-DD-YYYY (10 chars)
    else if (/^\d{2}-\d{2}-\d{4}$/.test(cleaned)) {
        const parts = cleaned.split('-');
        year = parseInt(parts[2], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[0], 10);
    } 
    // Pattern 4: Date/Time ISO string (like 2027-07-13T00:00:00Z)
    else if (/^\d{4}-\d{2}-\d{2}T/.test(cleaned)) {
        const isoDate = cleaned.split('T')[0];
        const parts = isoDate.split('-');
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
    } else {
        return null;
    }

    // Helper to check if a combination is a valid calendar date
    const isValid = (y: number, m: number, d: number) => {
        if (m < 1 || m > 12 || d < 1 || d > 31) return false;
        const dateObj = new Date(y, m - 1, d);
        return dateObj.getFullYear() === y && dateObj.getMonth() === m - 1 && dateObj.getDate() === d;
    };

    // Check if the parsed date is valid as YYYY-MM-DD
    if (isValid(year, month, day)) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    // Check if swapping month and day makes it valid (e.g. YYYY-DD-MM)
    if (isValid(year, day, month)) {
        return `${year}-${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}`;
    }

    return null;
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
        safeConsoleError('[sync-helpers.ts][getSyncStatus] ', error);
        return getInitialStatus();
    }
}

export async function persistSyncStatus(redis: Redis, status: SyncStatus, forceJobIdMatch: boolean = true) {
    if (forceJobIdMatch) {
        const current = await getSyncStatus(redis);
        if (current.jobId && current.jobId !== status.jobId && current.active) {
            safeConsoleError(`[sync-helpers.ts][persistSyncStatus] Ghost job detected (${status.jobId}). Will not overwrite running job ${current.jobId}`);
            return;
        }
    }
    await redis.set(SYNC_REDIS_KEY, JSON.stringify(status), 'EX', 86400 * 7);
}