import { GraphService, AzureUser } from './graph.service.js';
import { DirectusService } from './directus.service.js';
import { TokenService } from './token.service.js';
import { Redis } from 'ioredis';

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
    errors: { email: string; message: string; timestamp: string }[];
    warnings: { email: string; message: string }[];
    missingData: { email: string; reason: string }[];
    successfulUsers: { email: string }[];
    excludedUsers: { email: string }[];
    startTime?: string;
    endTime?: string;
    abortRequested?: boolean;
}

export interface SyncOptions {
    fields: string[];
    forceLink?: boolean;
    activeOnly?: boolean;
}

interface SyncContext {
    redis: Redis;
    status: SyncStatus;
    options: SyncOptions;
    token: string;
    committeeCache: Map<string, any>; // azure_group_id -> committee
    ownerCache: Map<string, string[]>; // azure_group_id -> owner_ids[]
}

export class SyncJob {
    private static REDIS_KEY = 'v7:sync:status';
    private static statusLock: Promise<void> = Promise.resolve();

    private static async acquireStatusLock(): Promise<() => void> {
        let release: () => void;
        const nextLock = new Promise<void>((resolve) => {
            release = resolve;
        });
        const currentLock = this.statusLock;
        this.statusLock = currentLock.then(() => nextLock);
        await currentLock;
        return release!;
    }

    private static defaultStatus: SyncStatus = {
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
        abortRequested: false
    };

    static async getStatus(redis: Redis): Promise<SyncStatus> {
        const data = await redis.get(this.REDIS_KEY);
        if (!data) return this.defaultStatus;
        try {
            return JSON.parse(data);
        } catch {
            return this.defaultStatus;
        }
    }

    private static async persistStatus(redis: Redis, status: SyncStatus, forceJobIdMatch: boolean = true) {
        const release = await this.acquireStatusLock();
        try {
            if (forceJobIdMatch) {
                const existing = await this.getStatus(redis);
                if (existing.jobId && existing.jobId !== status.jobId) {
                    console.warn(`[SYNC] Ghost job detected (${status.jobId}). Will not overwrite ${existing.jobId}`);
                    return;
                }
            }
            await redis.set(this.REDIS_KEY, JSON.stringify(status), 'EX', 86400 * 7);
        } finally {
            release();
        }
    }

    static parseAzureDate(dateStr?: string): string | null {
        if (!dateStr || dateStr.length !== 8) return null;
        return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
    }

    private static EXCLUDED_EMAILS = [
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

    private static shouldExcludeUser(email?: string): boolean {
        if (!email) return true;
        const lowerEmail = email.toLowerCase();
        if (this.EXCLUDED_EMAILS.includes(lowerEmail)) return true;
        if (lowerEmail.startsWith('test-')) return true;
        return false;
    }

    static async run(redis: Redis, options: SyncOptions = { fields: [] }) {
        const jobId = Math.random().toString(36).substring(2, 11);
        console.log(`[SYNC] Starting synchronization job ${jobId}...`);

        try {
            const initialToken = await TokenService.getAccessToken(redis);
            const azureUsers = await GraphService.getAllUsers(initialToken);
            console.log(`[SYNC] Found ${azureUsers.length} users in Azure AD.`);

            const committees = await DirectusService.getAllCommittees();
            const committeeCache = new Map<string, any>();
            for (const c of committees) {
                if (c.azure_group_id) committeeCache.set(c.azure_group_id, c);
            }

            const status: SyncStatus = {
                ...this.defaultStatus,
                jobId,
                active: true,
                status: 'running',
                total: azureUsers.length,
                startTime: new Date().toISOString()
            };

            const ctx: SyncContext = {
                redis,
                status,
                options,
                token: initialToken,
                committeeCache,
                ownerCache: new Map()
            };

            // Force initial persist to clear any old status and set the jobId
            await redis.set(this.REDIS_KEY, JSON.stringify(status), 'EX', 86400 * 7);

            const chunkSize = 15; 
            for (let i = 0; i < azureUsers.length; i += chunkSize) {
                // ABORT CHECK
                const latest = await this.getStatus(redis);
                if (latest.jobId === jobId && latest.abortRequested) {
                    console.log(`[SYNC] Abort requested for job ${jobId}.`);
                    status.active = false;
                    status.status = 'aborted';
                    status.endTime = new Date().toISOString();
                    await this.persistStatus(redis, status);
                    return;
                }

                const chunk = azureUsers.slice(i, i + chunkSize);
                console.log(`[SYNC] Processing chunk ${Math.floor(i / chunkSize) + 1} of ${Math.ceil(azureUsers.length / chunkSize)}...`);
                
                ctx.token = await TokenService.getAccessToken(redis);

                await Promise.all(chunk.map(async (aUser) => {
                    const email = (aUser.mail || aUser.userPrincipalName || 'Unknown').toLowerCase();
                    
                    if (this.shouldExcludeUser(email)) {
                        status.excludedCount++;
                        status.excludedUsers.push({ email });
                        status.processed++;
                        return;
                    }

                    try {
                        await this.syncUser(ctx, aUser);
                        status.processed++;
                    } catch (err: any) {
                        status.errorCount++;
                        status.errors.push({
                            email,
                            message: err.message,
                            timestamp: new Date().toISOString()
                        });
                        status.processed++;
                    }
                }));

                // Persist status after each chunk
                await this.persistStatus(redis, status);
            }

            status.active = false;
            status.status = 'completed';
            status.endTime = new Date().toISOString();
            await this.persistStatus(redis, status);
            console.log('[SYNC] Completed synchronization job.');
        } catch (error: any) {
            console.error('[SYNC] Fatal error during synchronization:', error);
            const currentStatus = await this.getStatus(redis);
            currentStatus.active = false;
            currentStatus.status = 'failed';
            currentStatus.endTime = new Date().toISOString();
            await this.persistStatus(redis, currentStatus);
        }
    }

    /**
     * Synchronizes a single user by their Directus UUID.
     * Useful for targeted provisioning after events.
     */
    static async syncUserById(redis: Redis, userId: string, token: string) {
        const dUser = await DirectusService.getUserById(userId);
        if (!dUser) {
            throw new Error(`User ${userId} not found in Directus.`);
        }

        // Fetch committees for the cache
        const committees = await DirectusService.getAllCommittees();
        const committeeCache = new Map<string, any>();
        for (const c of committees) {
            if (c.azure_group_id) committeeCache.set(c.azure_group_id, c);
        }

        const ctx: SyncContext = {
            redis,
            status: { ...this.defaultStatus, active: true, status: 'running' },
            options: { fields: ['membership_expiry', 'geboortedatum', 'phone_number', 'committees'] },
            token,
            committeeCache,
            ownerCache: new Map()
        };

        const entraId = dUser.entra_id;
        if (!entraId) {
            if (!dUser.email) {
                throw new Error(`User ${dUser.id} has no email or Entra ID.`);
            }
            console.log(`[SYNC] User ${dUser.email} has no Entra ID. Attempting to locate in Azure...`);
            const aUser = await GraphService.getUserByEmail(dUser.email, token);
            if (!aUser) {
                throw new Error(`User ${dUser.email} not found in Azure AD.`);
            }
            await this.syncUser(ctx, aUser);
        } else {
            const aUser = await GraphService.getUser(entraId, token);
            if (!aUser) {
                throw new Error(`Entra ID ${entraId} not found in Azure.`);
            }
            await this.syncUser(ctx, aUser);
        }
    }

    public static async syncUser(ctx: SyncContext, aUser: AzureUser) {
        const email = (aUser.mail || aUser.userPrincipalName).toLowerCase();
        
        // 1. Find or Link User
        let dUser = await DirectusService.getUserByEntraId(aUser.id);
        if (!dUser) {
            dUser = await DirectusService.getUserByEmail(email);
            if (dUser && !dUser.entra_id) {
                await DirectusService.updateUser(dUser.id, { entra_id: aUser.id });
                ctx.status.warningCount++;
                ctx.status.warnings.push({ email, message: `Linked existing user to Entra ID ${aUser.id}` });
            }
        }

        if (!dUser) {
            ctx.status.excludedCount++;
            ctx.status.excludedUsers.push({ email });
            return;
        }

        if (ctx.options.activeOnly && dUser.status !== 'active') {
            ctx.status.excludedCount++;
            ctx.status.excludedUsers.push({ email });
            return;
        }

        // 2. Attributes
        const csa = aUser.customSecurityAttributes?.SalveMundiLidmaatschap;
        const updatePayload: any = {};
        const fields = ctx.options.fields;

        if (fields.includes('membership_expiry')) {
            if (csa?.VerloopdatumStr || csa?.Verloopdatum) {
                updatePayload.membership_expiry = this.parseAzureDate(csa.VerloopdatumStr || csa.Verloopdatum);
            } else {
                ctx.status.missingDataCount++;
                ctx.status.missingData.push({ email, reason: 'Missende lidmaatschap vervaldatum' });
            }
        }

        if (fields.includes('geboortedatum')) {
            if (csa?.Geboortedatum) {
                updatePayload.date_of_birth = csa.Geboortedatum.includes('-') ? csa.Geboortedatum : this.parseAzureDate(csa.Geboortedatum);
            } else if (aUser.birthday) {
                updatePayload.date_of_birth = new Date(aUser.birthday).toISOString().split('T')[0];
            } else {
                ctx.status.missingDataCount++;
                ctx.status.missingData.push({ email, reason: 'Missende geboortedatum' });
            }
        }

        if (csa?.OrigineleBetaalDatumStr) {
            updatePayload.originele_betaaldatum = this.parseAzureDate(csa.OrigineleBetaalDatumStr);
        }

        if (fields.includes('phone_number') && aUser.mobilePhone) {
            updatePayload.phone_number = aUser.mobilePhone;
        }

        if (Object.keys(updatePayload).length > 0) {
            await DirectusService.updateUser(dUser.id, updatePayload);
        }

        // 3. Committees
        if (fields.includes('committees')) {
            const azureGroups = await GraphService.getUserGroups(aUser.id, ctx.token);
            const currentMemberships = await DirectusService.getCommitteeMembers(dUser.id);
            const desiredCommittees: { id: number; isLeader: boolean }[] = [];

            for (const group of azureGroups) {
                const dCommittee = ctx.committeeCache.get(group.id);
                if (!dCommittee) continue;

                // Owner/Leader check with caching
                let owners = ctx.ownerCache.get(group.id);
                if (!owners) {
                    owners = await GraphService.getGroupOwners(group.id, ctx.token);
                    ctx.ownerCache.set(group.id, owners);
                }
                const isLeader = owners.includes(aUser.id);
                desiredCommittees.push({ id: dCommittee.id, isLeader });
            }

            for (const desired of desiredCommittees) {
                const existing = currentMemberships.find((m: any) => m.committee_id === desired.id);
                if (!existing) {
                    await DirectusService.addMemberToCommittee(dUser.id, desired.id, desired.isLeader);
                } else if (existing.is_leader !== desired.isLeader) {
                    await DirectusService.updateCommitteeMember(existing.id, { is_leader: desired.isLeader });
                }
            }

            for (const current of currentMemberships) {
                if (!desiredCommittees.some(d => d.id === current.committee_id)) {
                    await DirectusService.removeMemberFromCommittee(current.id);
                }
            }
        }

        ctx.status.successCount++;
        ctx.status.successfulUsers.push({ email });
    }
}
