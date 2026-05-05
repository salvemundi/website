import { Redis } from 'ioredis';
import { Committee, DirectusUser, CommitteeMember } from '../../types/schema.js';

export interface SyncStatus {
    jobId?: string;
    active: boolean;
    status: 'idle' | 'running' | 'completed' | 'failed' | 'aborted';
    total: number;
    processed: number;
    errorCount: number;
    warningCount: number;
    missingDataCount: number;
    successCount: number;
    excludedCount: number;
    createdCount: number;
    movedActiveCount: number;
    movedExpiredCount: number;
    errors: { email: string; message: string; timestamp: string; stack?: string }[];
    warnings: { email: string; message: string }[];
    missingData: { email: string; reason: string }[];
    successfulUsers: { email: string; changes?: { field: string; old: unknown; new: unknown }[] }[];
    excludedUsers: { email: string }[];
    createdUsers: { email: string; changes?: { field: string; old: unknown; new: unknown }[] }[];
    startTime?: string;
    endTime?: string;
    lastHeartbeat?: string;
    abortRequested?: boolean;
    fatalError?: { message: string; stack?: string };
}

export interface SyncOptions {
    fields: string[];
    forceLink?: boolean;
    activeOnly?: boolean;
    forceSyncPhotos?: boolean;
}

export interface SyncContext {
    redis: Redis;
    status: SyncStatus;
    options: SyncOptions;
    token: string;
    committeeCache: Map<string, Committee>; // azure_group_id -> committee
    committeeByIdCache?: Map<number, Committee>; // id -> committee
    ownerCache: Map<string, string[]>; // azure_group_id -> owner_ids[]
    userCacheByEntra: Map<string, DirectusUser>;
    membershipCache: Map<string, CommitteeMember[]>; // user_id -> membership[]
    membershipMap?: Map<string, Map<number, boolean>>;
    // mainMembershipState: entrapId -> Set of active group IDs the user is in
    mainMembershipState: Map<string, Set<string>>; 
    processedEmails?: Set<string>;
    photoCache?: Map<string, { buffer: Buffer; contentType: string } | null>;
}

export const SYNC_REDIS_KEY = 'v7:sync:status';
export const SYNC_ABORT_KEY = 'v7:sync:abort';

export const GROUP_ACTIVE_LID = process.env.AZURE_ACTIVE_LID_GROUP_ID || '2e17c12a-28d6-49ae-981a-8b5b8d88db8a';
export const GROUP_EXPIRED_LID = process.env.AZURE_EXPIRED_LID_GROUP_ID || '98c1d807-613a-4a23-9618-3f8821d35fe9';

export const getInitialStatus = (): SyncStatus => ({
    active: false,
    status: 'idle',
    total: 0,
    processed: 0,
    errorCount: 0,
    warningCount: 0,
    missingDataCount: 0,
    successCount: 0,
    excludedCount: 0,
    errors: [],
    warnings: [],
    missingData: [],
    successfulUsers: [],
    excludedUsers: [],
    createdUsers: [],
    createdCount: 0,
    movedActiveCount: 0,
    movedExpiredCount: 0,
    lastHeartbeat: new Date().toISOString(),
    abortRequested: false
});

export const DEFAULT_SYNC_STATUS = getInitialStatus();
