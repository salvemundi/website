import { AzureUser, GraphService } from '../graph.service.js';
import { SyncContext, GROUP_ACTIVE_LID, GROUP_EXPIRED_LID } from './sync-types.js';
import { ManagementService } from '../management.service.js';
import { query } from '../../plugins/db.js';

export class SyncLifecycle {
    /**
     * Handles the transition between active and expired memberships.
     * Manages Azure groups and Directus membership_status.
     */
    static async handleLifecycle(ctx: SyncContext, aUser: AzureUser, dUser: any, currentExpiry?: string | null): Promise<{ field: string; old: any; new: any }[]> {
        const changes: { field: string; old: any; new: any }[] = [];
        const lockerKey = `lock:sync:user:${aUser.id}`;
        const hasLock = await ctx.redis.set(lockerKey, 'locked', 'EX', 30, 'NX');
        
        if (!hasLock) {
            console.warn(`[SYNC] Skip lifecycle for ${(aUser.mail || aUser.userPrincipalName)} - already being processed.`);
            return [];
        }

        try {
            const email = (aUser.mail || aUser.userPrincipalName).toLowerCase();
            const expiryDate = currentExpiry ? new Date(currentExpiry) : (dUser.membership_expiry ? new Date(dUser.membership_expiry) : null);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const isActive = expiryDate && expiryDate >= today;
            const currentStatus = dUser.membership_status || 'none';
            const desiredStatus = isActive ? 'active' : 'expired';
            
            const userInActiveGroup = ctx.mainMembershipState.get(aUser.id)?.has(GROUP_ACTIVE_LID) || false;
            const userInExpiredGroup = ctx.mainMembershipState.get(aUser.id)?.has(GROUP_EXPIRED_LID) || false;

            // 1. Sync Directus Membership Status
            if (currentStatus !== desiredStatus) {
                await query(`UPDATE directus_users SET membership_status = $1, status = 'active' WHERE id = $2`, [desiredStatus, dUser.id]);
                changes.push({ field: 'membership_status', old: currentStatus, new: desiredStatus });
                if (desiredStatus === 'active') ctx.status.movedActiveCount++;
                else ctx.status.movedExpiredCount++;
            }

            // 2. Sync Azure Groups
            if (isActive) {
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
