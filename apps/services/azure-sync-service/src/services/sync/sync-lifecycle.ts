import { db } from '../../plugins/db.js';
import { AzureUser } from '../graph.service.js';
import { SyncContext, GROUP_ACTIVE_LID, GROUP_EXPIRED_LID } from './sync-types.js';
import { ManagementService } from '../management.service.js';
import { safeConsoleError } from '../../utils/logger.js';

export interface DirectusUserRecord {
    id: string | number;
    membership_expiry?: string | null;
    membership_status?: string | null;
}

export class SyncLifecycle {
    /**
     * Handles the transition between active and expired memberships.
     * Manages Azure groups and Directus membership_status.
     */
    static async handleLifecycle(
        ctx: SyncContext,
        aUser: AzureUser,
        dUser: DirectusUserRecord,
        currentExpiry?: string | null
    ): Promise<{ field: string; old: unknown; new: unknown }[]> {
        const changes: { field: string; old: unknown; new: unknown }[] = [];
        const lockerKey = `lock:sync:user:${aUser.id}`;
        const hasLock = await ctx.redis.set(lockerKey, 'locked', 'EX', 30, 'NX');
        
        if (!hasLock) {
            safeConsoleError(`[SYNC] Skip lifecycle for ${(aUser.mail || aUser.userPrincipalName)} - already being processed.`);
            return [];
        }

        try {
            const expiryDate = currentExpiry ? new Date(currentExpiry) : (dUser.membership_expiry ? new Date(dUser.membership_expiry) : null);
            if (expiryDate) {
                expiryDate.setHours(0, 0, 0, 0);
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const isActive = expiryDate && expiryDate >= today;
            const currentStatus = dUser.membership_status || 'none';
            const desiredStatus = isActive ? 'active' : 'expired';
            
            // Check if user is in the 2-week grace period (14 days) after expiration.
            // During this period, we keep their Azure mailbox active so they can receive expiry warnings.
            const daysSinceExpiry = expiryDate ? (today.getTime() - expiryDate.getTime()) / (1000 * 60 * 60 * 24) : Infinity;
            const shouldBeInActiveGroup = isActive || (expiryDate !== null && daysSinceExpiry < 14);
            
            const userInActiveGroup = ctx.mainMembershipState.get(aUser.id)?.has(GROUP_ACTIVE_LID) || false;
            const userInExpiredGroup = ctx.mainMembershipState.get(aUser.id)?.has(GROUP_EXPIRED_LID) || false;

            // 1. Sync Directus Membership Status
            if (currentStatus !== desiredStatus) {
                await db
                    .updateTable('directus_users')
                    .set({
                        membership_status: desiredStatus,
                        status: 'active'
                    })
                    .where('id', '=', String(dUser.id))
                    .execute();
                changes.push({ field: 'membership_status', old: currentStatus, new: desiredStatus });
                const userEntry = {
                    email: (aUser.mail || aUser.userPrincipalName || 'onbekend').toLowerCase(),
                    name: aUser.displayName || undefined,
                };
                if (desiredStatus === 'active') {
                    ctx.status.movedActiveCount++;
                    ctx.status.movedActiveUsers.push(userEntry);
                } else {
                    ctx.status.movedExpiredCount++;
                    ctx.status.movedExpiredUsers.push(userEntry);
                }
            }

            // 2. Sync Azure Groups
            if (shouldBeInActiveGroup) {
                if (!userInActiveGroup) {
                    await ManagementService.addGroupMember(GROUP_ACTIVE_LID, aUser.id);
                    changes.push({ field: 'Azure Group', old: 'Nee', new: 'Toevoegen aan Leden_Actief' });
                }
                if (userInExpiredGroup) {
                    await ManagementService.removeGroupMember(GROUP_EXPIRED_LID, aUser.id);
                    changes.push({ field: 'Azure Group', old: 'Ja', new: 'Verwijderen uit Leden_Verlopen' });
                }
            } else {
                if (userInActiveGroup) {
                    await ManagementService.removeGroupMember(GROUP_ACTIVE_LID, aUser.id);
                    changes.push({ field: 'Azure Group', old: 'Ja', new: 'Verwijderen uit Leden_Actief' });
                }
                if (!userInExpiredGroup) {
                    await ManagementService.addGroupMember(GROUP_EXPIRED_LID, aUser.id);
                    changes.push({ field: 'Azure Group', old: 'Nee', new: 'Toevoegen aan Leden_Verlopen' });
                }
            }
        } finally {
            await ctx.redis.del(lockerKey);
        }
        return changes;
    }
}
