import { safeConsoleError } from '../../utils/logger.js';
import { GraphService } from '../graph.service.js';
import { TokenService } from '../token.service.js';
import { Redis } from 'ioredis';
import { query } from '../../plugins/db.js';
import {
    SyncStatus, SyncOptions, SyncContext,
    SYNC_REDIS_KEY, SYNC_ABORT_KEY, GROUP_ACTIVE_LID,
    getInitialStatus
} from './sync-types.js';
import { getSyncStatus, persistSyncStatus, shouldExcludeUser } from './sync-helpers.js';
import { SyncProcessor } from './sync-processor.js';
import { SyncCache } from './sync-cache.js';

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
        if (!options.fields?.length) {
            options.fields = ['status', 'membership_status', 'membership_expiry', 'committees', 'profile_photo', 'geboortedatum', 'phone_number', 'originele_betaaldatum'];
        }

        // 1. Mutex: prevent duplicate runs
        const current = await getSyncStatus(redis);
        if (current.active && current.status === 'running') {
            const lastHeartbeat = current.lastHeartbeat ? new Date(current.lastHeartbeat).getTime() : 0;
            if (Date.now() - lastHeartbeat < 300000) return;
        }

        if (!options.silent) console.log(`[SYNC] [${jobId}] Starting BULK synchronization job...`);
        await redis.del(SYNC_ABORT_KEY);

        try {
            const token = await TokenService.getAccessToken(redis);

            // 2. PRE-FETCH DATA
            if (!options.silent) console.log(`[SYNC] [${jobId}] Step 1: Fetching users & group data...`);
            const [azureUsers, { committees, committeeCache, committeeByIdCache }, { allLeden, userCacheByEntra }, { membershipCache }] = await Promise.all([
                GraphService.getAllUsers(token),
                SyncCache.getCommittees(),
                SyncCache.getUsers(),
                SyncCache.getMemberships()
            ]);

            const [mainMembershipState, membershipMap] = await Promise.all([
                SyncCache.getMainMembershipState(token),
                SyncCache.getAzureMembershipMap(committees.filter(c => c.azure_group_id).map(c => c.azure_group_id!), committeeCache, token)
            ]);

            const status: SyncStatus = {
                ...getInitialStatus(), jobId, active: true, status: 'running',
                total: azureUsers.length, startTime: new Date().toISOString(), lastHeartbeat: new Date().toISOString()
            };

            const ctx: SyncContext & { membershipMap: Map<string, Map<number, boolean>> } = {
                redis, status, options, token, committeeCache, committeeByIdCache,
                ownerCache: new Map(), userCacheByEntra, membershipCache, membershipMap, mainMembershipState
            };

            await redis.set(SYNC_REDIS_KEY, JSON.stringify(status), 'EX', 86400 * 7);

            // 3. FILTER BY ACTIVE STATUS
            let usersToProcess = azureUsers;
            if (options.activeOnly) {
                usersToProcess = azureUsers.filter(u => ctx.mainMembershipState.get(u.id)?.has(GROUP_ACTIVE_LID));
                status.excludedCount = azureUsers.length - usersToProcess.length;
                status.total = usersToProcess.length;
                await persistSyncStatus(redis, status);
            }

            // 4. PARALLEL CHUNK PROCESSING
            const CHUNK_SIZE = 50;
            for (let i = 0; i < usersToProcess.length; i += CHUNK_SIZE) {
                if (await redis.get(SYNC_ABORT_KEY)) {
                    status.active = false; status.status = 'aborted'; status.endTime = new Date().toISOString();
                    await Promise.all([persistSyncStatus(redis, status, false), redis.del(SYNC_ABORT_KEY)]);
                    return;
                }

                const chunk = usersToProcess.slice(i, i + CHUNK_SIZE);
                if (options.fields.includes('profile_photo')) {
                    ctx.photoCache = await GraphService.getUserPhotosBatch(chunk.map(u => u.id), ctx.token);
                }

                await Promise.all(chunk.map(async (aUser) => {
                    const email = (aUser.mail || aUser.userPrincipalName || 'Unknown').toLowerCase();
                    if (shouldExcludeUser(email)) {
                        status.excludedCount++; status.excludedUsers.push({ email }); status.processed++;
                    } else {
                        try {
                            await SyncProcessor.syncUserOptimized(ctx, aUser);
                            status.processed++;
                        } catch (error) {
                            status.errorCount++; status.processed++;
                            status.errors.push({ email, message: error instanceof Error ? error.message : String(error), timestamp: new Date().toISOString() });
                        }
                    }
                }));

                status.lastHeartbeat = new Date().toISOString();
                ctx.token = await TokenService.getAccessToken(redis);
                await persistSyncStatus(redis, status);
            }

            // 5. IDENTIFY ORPHANS & FINISH
            const azureUserIds = new Set(azureUsers.map(u => u.id));
            for (const dUser of allLeden) {
                if (dUser.entra_id && !azureUserIds.has(dUser.entra_id)) {
                    status.warningCount++;
                    status.warnings.push({ email: (dUser.email || 'Onbekend').toLowerCase(), message: 'Niet gevonden in Azure AD.' });
                }
            }

            status.active = false; status.status = 'completed'; status.endTime = new Date().toISOString();
            await persistSyncStatus(redis, status);
            await this.logSummary(jobId, status);
        } catch (error) {
            safeConsoleError(`[SYNC] [${jobId}] Fatal error:`, error);
            const s = await getSyncStatus(redis);
            s.active = false; s.status = 'failed'; s.endTime = new Date().toISOString();
            s.fatalError = { message: error instanceof Error ? error.message : String(error) };
            await persistSyncStatus(redis, s);
        }
    }

    /**
     * Entry point for a single user synchronization.
     */
    static async syncByEntraId(redis: Redis, entraId: string, token: string, options: SyncOptions = { fields: [] }) {
        if (!options.fields?.length) {
            options.fields = ['status', 'membership_status', 'membership_expiry', 'committees', 'profile_photo', 'geboortedatum', 'phone_number', 'originele_betaaldatum'];
        }

        const [{ committees, committeeCache, committeeByIdCache }, { userCacheByEntra }, { membershipCache }] = await Promise.all([
            SyncCache.getCommittees(),
            SyncCache.getUsers(),
            SyncCache.getMemberships()
        ]);

        const aUser = await GraphService.getUser(entraId, token);
        if (!aUser) throw new Error(`Entra ID ${entraId} niet gevonden.`);

        const userGroups = await GraphService.getUserGroups(aUser.id, token);
        const userMap = new Map<number, boolean>();
        for (const group of userGroups) {
            const dComm = committeeCache.get(group.id);
            if (dComm) {
                const owners = await GraphService.getGroupOwners(group.id, token);
                userMap.set(dComm.id, owners.includes(aUser.id));
            }
        }

        const membershipMap = new Map([[aUser.id, userMap]]);
        const mainMembershipState = await SyncCache.getMainMembershipState(token, entraId);

        const status: SyncStatus = { ...getInitialStatus(), active: true, status: 'running', total: 1, jobId: `single-${entraId}`, startTime: new Date().toISOString() };
        const ctx: SyncContext & { membershipMap: Map<string, Map<number, boolean>> } = {
            redis, status, options, token, committeeCache, committeeByIdCache,
            ownerCache: new Map(), userCacheByEntra, membershipCache, membershipMap, mainMembershipState
        };

        if (options.activeOnly && !mainMembershipState.get(entraId)?.has(GROUP_ACTIVE_LID)) {
            status.active = false; status.status = 'completed'; status.excludedCount = 1; status.endTime = new Date().toISOString();
            return await persistSyncStatus(redis, status, false);
        }

        try {
            await SyncProcessor.syncUserOptimized(ctx, aUser);
            status.processed++; status.active = false; status.status = 'completed'; status.endTime = new Date().toISOString();
            await persistSyncStatus(redis, status, false);
        } catch (error) {
            status.active = false; status.status = 'failed'; status.endTime = new Date().toISOString(); status.errorCount = 1;
            status.errors.push({ email: aUser.mail || aUser.userPrincipalName, message: error instanceof Error ? error.message : String(error), timestamp: new Date().toISOString() });
            await persistSyncStatus(redis, status, false);
            throw error;
        }
    }

    private static async logSummary(jobId: string, status: SyncStatus) {
        await query(`INSERT INTO system_logs (type, status, payload, created_at) VALUES ($1, $2, $3, NOW())`, [
            'system_sync_summary', 'SUCCESS', JSON.stringify({
                job_id: jobId, processed: status.processed, moved_active: status.movedActiveCount,
                moved_expired: status.movedExpiredCount, errors: status.errorCount,
                duration_ms: status.startTime ? (Date.now() - new Date(status.startTime).getTime()) : null
            })
        ]);
        try { await query(`DELETE FROM system_logs WHERE created_at < NOW() - INTERVAL '90 days'`); } catch (error) {
            safeConsoleError(`[SyncJob][logSummary] Error while cleaning up old logs:`, error);
        }
    }
}