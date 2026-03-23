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
    createdCount: number;
    errors: { email: string; message: string; timestamp: string }[];
    warnings: { email: string; message: string }[];
    missingData: { email: string; reason: string }[];
    successfulUsers: { email: string }[];
    excludedUsers: { email: string }[];
    createdUsers: { email: string }[];
    startTime?: string;
    endTime?: string;
    lastHeartbeat?: string;
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
    userCacheByEntra: Map<string, any>;
    membershipCache: Map<string, any[]>; // user_id -> membership[]
    membershipMap?: Map<string, Map<number, boolean>>;
}

export class SyncJob {
    private static readonly REDIS_KEY = 'v7:sync:status';
    private static readonly ABORT_KEY = 'v7:sync:abort';

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
        createdUsers: [],
        createdCount: 0,
        lastHeartbeat: new Date().toISOString(),
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
        if (forceJobIdMatch) {
            const current = await this.getStatus(redis);
            if (current.jobId && current.jobId !== status.jobId && current.active) {
                console.warn(`[SYNC] Ghost job detected (${status.jobId}). Will not overwrite running job ${current.jobId}`);
                return;
            }
        }
        await redis.set(this.REDIS_KEY, JSON.stringify(status), 'EX', 86400 * 7);
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

        // 1. Mutex: prevent duplicate runs
        const current = await this.getStatus(redis);
        if (current.active && current.status === 'running') {
            const lastHeartbeat = current.lastHeartbeat ? new Date(current.lastHeartbeat).getTime() : 0;
            const now = new Date().getTime();
            // If the job hasn't updated in 5 minutes, consider it dead
            if (now - lastHeartbeat < 300000) {
                console.log(`[SYNC] Job ${jobId} failed to start. Another job (${current.jobId}) is already running (Heartbeat: ${now - lastHeartbeat}ms ago).`);
                return;
            }
            console.warn(`[SYNC] Stale job detected (${current.jobId}). Forcing start of new job ${jobId}.`);
        }

        console.log(`[SYNC] [${jobId}] Starting BULK synchronization job...`);
        await redis.del(this.ABORT_KEY);

        try {
            const initialToken = await TokenService.getAccessToken(redis);
            
            // 2. PRE-FETCH EVERYTHING IN BULK
            console.log(`[SYNC] [${jobId}] Step 1: Fetching all users from Azure...`);
            const azureUsers = await GraphService.getAllUsers(initialToken);
            
            console.log(`[SYNC] [${jobId}] Step 2: Pre-caching Directus data...`);
            const [committees, allLeden, allMemberships] = await Promise.all([
                DirectusService.getAllCommittees(),
                DirectusService.getAllUsers(),
                DirectusService.getAllCommitteeMembers()
            ]);

            const committeeCache = new Map<string, any>();
            const relevantAzureGroupIds: string[] = [];
            for (const c of committees) {
                if (c.azure_group_id) {
                    committeeCache.set(c.azure_group_id, c);
                    relevantAzureGroupIds.push(c.azure_group_id);
                }
            }

            console.log(`[SYNC] [${jobId}] Step 3: Bulk fetching group memberships from Azure (Batch API)...`);
            const groupDetails = await GraphService.getBatchGroupDetails(relevantAzureGroupIds, initialToken);
            
            // Map: entrapId -> { committeeId -> { isLeader: boolean } }
            const membershipMap = new Map<string, Map<number, boolean>>();
            for (const [groupId, details] of groupDetails) {
                const dComm = committeeCache.get(groupId);
                if (!dComm) continue;

                for (const memberId of details.members) {
                    const userMap = membershipMap.get(memberId) || new Map<number, boolean>();
                    userMap.set(dComm.id, details.owners.includes(memberId));
                    membershipMap.set(memberId, userMap);
                }
            }

            const userCacheByEntra = new Map<string, any>();
            for (const u of allLeden) {
                if (u.entra_id) userCacheByEntra.set(u.entra_id, u);
            }

            const membershipCache = new Map<string, any[]>();
            for (const m of allMemberships) {
                const list = membershipCache.get(m.user_id) || [];
                list.push(m);
                membershipCache.set(m.user_id, list);
            }

            const status: SyncStatus = {
                ...this.defaultStatus,
                jobId,
                active: true,
                status: 'running',
                total: azureUsers.length,
                startTime: new Date().toISOString(),
                lastHeartbeat: new Date().toISOString()
            };

            const ctx: SyncContext & { membershipMap: Map<string, Map<number, boolean>> } = {
                redis,
                status,
                options,
                token: initialToken,
                committeeCache,
                ownerCache: new Map(), // No longer needed but kept for TS compatibility if others use it
                userCacheByEntra,
                membershipCache,
                membershipMap
            };

            await redis.set(this.REDIS_KEY, JSON.stringify(status), 'EX', 86400 * 7);

            // 3. PARALLEL CHUNK PROCESSING
            const CHUNK_SIZE = 20;
            for (let i = 0; i < azureUsers.length; i += CHUNK_SIZE) {
                // ABORT CHECK (Per chunk)
                const abort = await redis.get(this.ABORT_KEY);
                if (abort) {
                    console.log(`[SYNC] [${jobId}] Interrupt requested. Aborting.`);
                    status.active = false;
                    status.status = 'aborted';
                    status.endTime = new Date().toISOString();
                    await this.persistStatus(redis, status, false);
                    return;
                }

                const chunk = azureUsers.slice(i, i + CHUNK_SIZE);
                await Promise.all(chunk.map(async (aUser) => {
                    const email = (aUser.mail || aUser.userPrincipalName || 'Unknown').toLowerCase();
                    if (this.shouldExcludeUser(email)) {
                        status.excludedCount++;
                        status.excludedUsers.push({ email });
                        status.processed++;
                    } else {
                        try {
                            await this.syncUserOptimized(ctx, aUser);
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
                    }
                }));

                // Update Progress & Heartbeat
                status.lastHeartbeat = new Date().toISOString();
                ctx.token = await TokenService.getAccessToken(redis);
                await this.persistStatus(redis, status);
                
                // Allow other tasks to run
                await new Promise(resolve => setImmediate(resolve));
            }

            status.active = false;
            status.status = 'completed';
            status.endTime = new Date().toISOString();
            await this.persistStatus(redis, status);
            console.log(`[SYNC] [${jobId}] Bulk sync finished successfully.`);
        } catch (error: any) {
            console.error(`[SYNC] [${jobId}] Fatal error:`, error);
            const currentStatus = await this.getStatus(redis);
            currentStatus.active = false;
            currentStatus.status = 'failed';
            currentStatus.endTime = new Date().toISOString();
            await this.persistStatus(redis, currentStatus);
        }
    }

    /**
     * Optimized syncUser that uses pre-fetched membership map instead of making API calls.
     */
    private static async syncUserOptimized(ctx: SyncContext & { membershipMap: Map<string, Map<number, boolean>> }, aUser: AzureUser) {
        const email = (aUser.mail || aUser.userPrincipalName).toLowerCase();
        
        // 1. Find User by Entra ID
        let dUser = ctx.userCacheByEntra.get(aUser.id);

        if (!dUser) {
            const csa = aUser.customSecurityAttributes?.SalveMundiLidmaatschap;
            const phone = aUser.mobilePhone || '';
            
            let dob: string | undefined = undefined;
            if (csa?.Geboortedatum) {
                dob = csa.Geboortedatum.includes('-') ? csa.Geboortedatum : this.parseAzureDate(csa.Geboortedatum) || undefined;
            } else if (aUser.birthday) {
                dob = new Date(aUser.birthday).toISOString().split('T')[0];
            }

            let expiry: string | undefined = undefined;
            const date = csa?.VerloopdatumStr || csa?.Verloopdatum;
            if (date) {
                expiry = this.parseAzureDate(date) || undefined;
            }

            let paidDate: string | undefined = undefined;
            const pDate = csa?.OrigineleBetaalDatumStr || csa?.OrigineleBetaalDatum;
            if (pDate) {
                paidDate = this.parseAzureDate(pDate) || undefined;
            }

            // Create with full field set to ensure successful first-time creation
            dUser = await DirectusService.createUser({
                first_name: aUser.givenName || '',
                last_name: aUser.surname || '',
                email: email,
                entra_id: aUser.id,
                status: 'active',
                role: '82fe4735-4724-48af-9d37-ee85e1c5441e', // "Members" role
                text_direction: 'auto',
                admin_access: false,
                phone_number: phone,
                date_of_birth: dob,
                membership_expiry: expiry,
                originele_betaaldatum: paidDate
            });
            ctx.status.createdCount++;
            ctx.status.createdUsers.push({ email });
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
            const date = csa?.VerloopdatumStr || csa?.Verloopdatum;
            if (date) updatePayload.membership_expiry = this.parseAzureDate(date);
        }

        if (fields.includes('geboortedatum')) {
            if (csa?.Geboortedatum) {
                updatePayload.date_of_birth = csa.Geboortedatum.includes('-') ? csa.Geboortedatum : this.parseAzureDate(csa.Geboortedatum);
            } else if (aUser.birthday) {
                updatePayload.date_of_birth = new Date(aUser.birthday).toISOString().split('T')[0];
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

        // 3. Committees (ZERO EXTRA API CALLS!)
        if (fields.includes('committees')) {
            const currentMemberships = ctx.membershipCache.get(dUser.id) || [];
            const azureMemberships = ctx.membershipMap.get(aUser.id) || new Map<number, boolean>();

            // Add or Update
            for (const [committeeId, isLeader] of azureMemberships) {
                const existing = currentMemberships.find((m: any) => m.committee_id === committeeId);
                if (!existing) {
                    await DirectusService.addMemberToCommittee(dUser.id, committeeId, isLeader);
                } else if (existing.is_leader !== isLeader) {
                    await DirectusService.updateCommitteeMember(existing.id, { is_leader: isLeader });
                }
            }

            // Remove
            for (const current of currentMemberships) {
                if (!azureMemberships.has(current.committee_id)) {
                    await DirectusService.removeMemberFromCommittee(current.id);
                }
            }
        }

        ctx.status.successCount++;
        ctx.status.successfulUsers.push({ email });
    }

    /**
     * Synchronizes a single user by their Directus UUID.
     * Useful for targeted provisioning after events.
     */
    static async syncUserById(redis: Redis, userId: string, token: string) {
        // Fetch all needed data for the context
        const [dUser, committees, allLeden, allMemberships] = await Promise.all([
            DirectusService.getUserById(userId),
            DirectusService.getAllCommittees(),
            DirectusService.getAllUsers(),
            DirectusService.getAllCommitteeMembers()
        ]);

        if (!dUser) {
            throw new Error(`User ${userId} not found in Directus.`);
        }

        const committeeCache = new Map<string, any>();
        for (const c of committees) {
            if (c.azure_group_id) committeeCache.set(c.azure_group_id, c);
        }

        const userCacheByEntra = new Map<string, any>();
        for (const u of allLeden) {
            if (u.entra_id) userCacheByEntra.set(u.entra_id, u);
        }

        const membershipCache = new Map<string, any[]>();
        for (const m of allMemberships) {
            const list = membershipCache.get(m.user_id) || [];
            list.push(m);
            membershipCache.set(m.user_id, list);
        }

        const ctx: SyncContext = {
            redis,
            status: { ...this.defaultStatus, active: true, status: 'running' },
            options: { fields: ['membership_expiry', 'geboortedatum', 'phone_number', 'committees'] },
            token,
            committeeCache,
            ownerCache: new Map(),
            userCacheByEntra,
            membershipCache
        };

        const entraId = dUser.entra_id;
        if (!entraId) {
            // ...
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
        
        // 1. Find User by Entra ID
        let dUser = ctx.userCacheByEntra.get(aUser.id);

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
            const currentMemberships = ctx.membershipCache.get(dUser.id) || [];
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
