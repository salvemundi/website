import { GraphService } from '../graph.service.js';
import { Committee, DirectusUser, CommitteeMember } from '../../types/schema.js';
import { DirectusService } from '../directus.service.js';
import { TokenService } from '../token.service.js';
import { Redis } from 'ioredis';
import { query } from '../../plugins/db.js';
import { 
    SyncStatus, SyncOptions, SyncContext, 
    SYNC_REDIS_KEY, SYNC_ABORT_KEY, GROUP_ACTIVE_LID, GROUP_EXPIRED_LID,
    getInitialStatus, DEFAULT_SYNC_STATUS
} from './sync-types.js';
import { getSyncStatus, persistSyncStatus, shouldExcludeUser } from './sync-helpers.js';
import { SyncProcessor } from './sync-processor.js';

export class SyncJob {
    /**
     * Returns the current status of the sync job.
     */
    static async getStatus(redis: Redis): Promise<SyncStatus> {
        return await getSyncStatus(redis);
    }
    /**
     * Entry point for a full bulk synchronization.
     */
    static async run(redis: Redis, options: SyncOptions = { fields: [] }) {
        const jobId = Math.random().toString(36).substring(2, 11);

        // 1. Mutex: prevent duplicate runs
        const current = await getSyncStatus(redis);
        if (current.active && current.status === 'running') {
            const lastHeartbeat = current.lastHeartbeat ? new Date(current.lastHeartbeat).getTime() : 0;
            const now = new Date().getTime();
            if (now - lastHeartbeat < 300000) {
                console.log(`[SYNC] Job ${jobId} failed to start. Another job (${current.jobId}) is already running.`);
                return;
            }
            console.warn(`[SYNC] Stale job detected (${current.jobId}). Forcing start of new job ${jobId}.`);
        }

        console.log(`[SYNC] [${jobId}] Starting BULK synchronization job...`);
        await redis.del(SYNC_ABORT_KEY);

        try {
            const initialToken = await TokenService.getAccessToken(redis);
            
            // 2. PRE-FETCH EVERYTHING IN BULK
            console.log(`[SYNC] [${jobId}] Step 1: Fetching all users from Azure...`);
            const azureUsers = await GraphService.getAllUsers(initialToken);
            
            console.log(`[SYNC] [${jobId}] Step 2: Pre-caching Directus & Group data...`);
            const [committees, allLeden, allMemberships] = await Promise.all([
                DirectusService.getAllCommittees(),
                DirectusService.getAllUsers(),
                DirectusService.getAllCommitteeMembers()
            ]);

            const mainGroupDetails = await GraphService.getBatchGroupDetails([GROUP_ACTIVE_LID, GROUP_EXPIRED_LID], initialToken);
            const mainMembershipState = new Map<string, Set<string>>();
            
            for (const [groupId, details] of mainGroupDetails) {
                for (const userId of details.members) {
                    const userGroups = mainMembershipState.get(userId) || new Set<string>();
                    userGroups.add(groupId);
                    mainMembershipState.set(userId, userGroups);
                }
            }

            const committeeCache = new Map<string, Committee>();
            const committeeByIdCache = new Map<number, Committee>();
            const relevantAzureGroupIds: string[] = [];
            for (const c of committees) {
                committeeByIdCache.set(Number(c.id), c);
                if (c.azure_group_id) {
                    committeeCache.set(c.azure_group_id, c);
                    relevantAzureGroupIds.push(c.azure_group_id);
                }
            }

            console.log(`[SYNC] [${jobId}] Step 3: Bulk fetching group memberships from Azure (Batch API)...`);
            const groupDetails = await GraphService.getBatchGroupDetails(relevantAzureGroupIds, initialToken);
            
            const membershipMap = new Map<string, Map<number, boolean>>();
            for (const [groupId, details] of groupDetails) {
                const dComm = committeeCache.get(groupId);
                if (!dComm) continue;

                // 1. Process explicit members
                for (const memberId of details.members) {
                    const userMap = membershipMap.get(memberId) || new Map<number, boolean>();
                    userMap.set(dComm.id, details.owners.includes(memberId));
                    membershipMap.set(memberId, userMap);
                }

                // 2. Process owners (ensure they are treated as members and leaders)
                for (const ownerId of details.owners) {
                    const userMap = membershipMap.get(ownerId) || new Map<number, boolean>();
                    if (!userMap.has(dComm.id)) {
                        userMap.set(dComm.id, true);
                        membershipMap.set(ownerId, userMap);
                    }
                }
            }

            const userCacheByEntra = new Map<string, DirectusUser>();
            for (const u of allLeden) if (u.entra_id) userCacheByEntra.set(u.entra_id, u);

            const membershipCache = new Map<string, CommitteeMember[]>();
            for (const m of allMemberships) {
                const list = membershipCache.get(m.user_id) || [];
                list.push(m);
                membershipCache.set(m.user_id, list);
            }

            const status: SyncStatus = {
                ...getInitialStatus(),
                jobId,
                active: true,
                status: 'running',
                total: azureUsers.length,
                startTime: new Date().toISOString(),
                lastHeartbeat: new Date().toISOString()
            };

            const ctx: SyncContext & { membershipMap: Map<string, Map<number, boolean>> } = {
                redis, status, options, token: initialToken, committeeCache,
                committeeByIdCache,
                ownerCache: new Map(), userCacheByEntra, membershipCache,
                membershipMap, mainMembershipState
            };

            await redis.set(SYNC_REDIS_KEY, JSON.stringify(status), 'EX', 86400 * 7);

            // 3. PARALLEL CHUNK PROCESSING
            const CHUNK_SIZE = 50;
            for (let i = 0; i < azureUsers.length; i += CHUNK_SIZE) {
                const abort = await redis.get(SYNC_ABORT_KEY);
                if (abort) {
                    status.active = false; status.status = 'aborted'; status.endTime = new Date().toISOString();
                    await Promise.all([
                        persistSyncStatus(redis, status, false),
                        redis.del(SYNC_ABORT_KEY)
                    ]);
                    return;
                }

                const chunk = azureUsers.slice(i, i + CHUNK_SIZE);
                
                // De-duplicate chunk just in case Graph paging returned same users
                const uniqueChunk = Array.from(new Map(chunk.map(u => [u.id, u])).values());

                // Optimization: Fetch photos for the whole chunk in one batch request if needed
                if (options.fields.includes('profile_photo')) {
                    ctx.photoCache = await GraphService.getUserPhotosBatch(uniqueChunk.map(u => u.id), ctx.token);
                }

                await Promise.all(uniqueChunk.map(async (aUser) => {
                    const email = (aUser.mail || aUser.userPrincipalName || 'Unknown').toLowerCase();
                    if (shouldExcludeUser(email)) {
                        status.excludedCount++; status.excludedUsers.push({ email }); status.processed++;
                    } else {
                        try {
                            await SyncProcessor.syncUserOptimized(ctx, aUser);
                            status.processed++;
                        } catch (err) {
                            const error = err instanceof Error ? err : new Error(String(err));
                            status.errorCount++; status.processed++;
                            status.errors.push({ 
                                email, 
                                message: error.message, 
                                timestamp: new Date().toISOString(),
                                stack: error.stack
                            });
                        }
                    }
                }));

                status.lastHeartbeat = new Date().toISOString();
                ctx.token = await TokenService.getAccessToken(redis);
                await persistSyncStatus(redis, status);
                await new Promise(resolve => setImmediate(resolve));
            }

            status.active = false; status.status = 'completed'; status.endTime = new Date().toISOString();
            await persistSyncStatus(redis, status);

            // 4. RETENTION CLEANUP
            try {
                await query(`DELETE FROM system_logs WHERE created_at < NOW() - INTERVAL '90 days'`);
            } catch (pruneErr) {
                console.error(`[SYNC] [${jobId}] Retention cleanup failed:`, pruneErr);
            }

            console.log(`[SYNC] [${jobId}] Bulk sync finished successfully.`);
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error(`[SYNC] [${jobId}] Fatal error:`, err);
            const currentStatus = await getSyncStatus(redis);
            currentStatus.active = false; currentStatus.status = 'failed'; currentStatus.endTime = new Date().toISOString();
            currentStatus.fatalError = { message: err.message, stack: err.stack };
            await persistSyncStatus(redis, currentStatus);
        }
    }

    /**
     * Entry point for a single user synchronization.
     */
    static async syncByEntraId(redis: Redis, entraId: string, token: string, options: SyncOptions = { fields: ['membership_expiry', 'geboortedatum', 'phone_number', 'committees', 'profile_photo', 'membership_status'] }) {
        console.log(`[SYNC] [single-${entraId}] Starting single-user sync...`);
        const startTime = Date.now();

        const [committees, allLeden, allMemberships] = await Promise.all([
            DirectusService.getAllCommittees(),
            DirectusService.getAllUsers(),
            DirectusService.getAllCommitteeMembers()
        ]);
        console.log(`[SYNC] [single-${entraId}] Pre-fetched Directus data in ${Date.now() - startTime}ms`);

        const committeeCache = new Map<string, Committee>();
        const committeeByIdCache = new Map<number, Committee>();
        for (const c of committees) {
            committeeByIdCache.set(Number(c.id), c as Committee);
            if (c.azure_group_id) committeeCache.set(c.azure_group_id, c as Committee);
        }

        const userCacheByEntra = new Map<string, DirectusUser>();
        for (const u of allLeden) if (u.entra_id) userCacheByEntra.set(u.entra_id, u as DirectusUser);

        const membershipCache = new Map<string, CommitteeMember[]>();
        for (const m of allMemberships) {
            const list = membershipCache.get(m.user_id) || [];
            list.push(m as CommitteeMember);
            membershipCache.set(m.user_id, list);
        }

        console.log(`[SYNC] [single-${entraId}] Fetching user from Graph...`);
        const aUser = await GraphService.getUser(entraId, token);
        if (!aUser) throw new Error(`Entra ID ${entraId} niet gevonden in Azure AD.`);
        console.log(`[SYNC] [single-${entraId}] Graph user fetched: ${aUser.mail || aUser.userPrincipalName}`);

        const membershipMap = new Map<string, Map<number, boolean>>();
        const userMap = new Map<number, boolean>();
        
        console.log(`[SYNC] [single-${entraId}] Fetching user groups from Graph...`);
        const userGroups = await GraphService.getUserGroups(aUser.id, token);
        for (const group of userGroups) {
            const dComm = committeeCache.get(group.id);
            if (!dComm) continue;
            
            const owners = await GraphService.getGroupOwners(group.id, token);
            const isOwner = owners.includes(aUser.id);
            userMap.set(dComm.id, isOwner);
        }

        // Safety check: Is the user an owner of any other committee groups they aren't a "member" of?
        // This handles "Ghost Owners" who are owners but not members.
        for (const [azureGroupId, committee] of committeeCache.entries()) {
            if (userMap.has(committee.id)) continue; // Already processed as member

            const owners = await GraphService.getGroupOwners(azureGroupId, token);
            if (owners.includes(aUser.id)) {
                userMap.set(committee.id, true);
            }
        }

        membershipMap.set(aUser.id, userMap);

        const status: SyncStatus = { 
            ...getInitialStatus(), active: true, status: 'running', total: 1, 
            jobId: `single-${entraId}`, startTime: new Date().toISOString()
        };

        console.log(`[SYNC] [single-${entraId}] Fetching main group details (Active/Expired)...`);
        const mainGroupDetails = await GraphService.getBatchGroupDetails([GROUP_ACTIVE_LID, GROUP_EXPIRED_LID], token);
        const mainMembershipState = new Map<string, Set<string>>();
        for (const [groupId, details] of mainGroupDetails) {
            if (details.members.includes(entraId)) {
                const s = mainMembershipState.get(entraId) || new Set();
                s.add(groupId);
                mainMembershipState.set(entraId, s);
            }
        }
        console.log(`[SYNC] [single-${entraId}] Pre-sync setup completed in ${Date.now() - startTime}ms`);

        const ctx: SyncContext & { membershipMap: Map<string, Map<number, boolean>> } = {
            redis, status, options,
            token, committeeCache, committeeByIdCache, ownerCache: new Map(), userCacheByEntra, membershipCache, membershipMap, mainMembershipState
        };

        await persistSyncStatus(redis, status, true);

        try {
            await SyncProcessor.syncUserOptimized(ctx, aUser);
            status.processed = 1; status.active = false; status.status = 'completed'; status.endTime = new Date().toISOString();
            await persistSyncStatus(redis, status, true);
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            status.active = false; status.status = 'failed'; status.endTime = new Date().toISOString(); status.errorCount = 1;
            status.errors.push({ 
                email: aUser.mail || aUser.userPrincipalName, 
                message: err.message, 
                timestamp: new Date().toISOString(),
                stack: err.stack 
            });
            status.fatalError = { message: err.message, stack: err.stack };
            await persistSyncStatus(redis, status, true);
            throw err;
        }
    }
}
