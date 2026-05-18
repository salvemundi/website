import { DirectusService } from '../directus.service.js';
import { GraphService } from '../graph.service.js';
import { DbCommittee as Committee, DbDirectusUser as DirectusUser, DbCommitteeMember as CommitteeMember } from '@salvemundi/validations';
import { GROUP_ACTIVE_LID, GROUP_EXPIRED_LID } from './sync-types.js';

/**
 * SyncCache: Beheert het ophalen en structureren van gegevens uit Directus en Azure AD 
 * om de synchronisatie te versnellen door bulk-fetches en caching.
 */
export class SyncCache {
    /**
     * Haalt alle commissies op en bouwt caches op ID en Azure Group ID.
     */
    static async getCommittees() {
        const committees = (await DirectusService.getAllCommittees()) as unknown as Committee[];
        const committeeCache = new Map<string, Committee>();
        const committeeByIdCache = new Map<number, Committee>();

        for (const c of committees) {
            committeeByIdCache.set(Number(c.id), c);
            if (c.azure_group_id) {
                committeeCache.set(c.azure_group_id, c);
            }
        }

        return { committees, committeeCache, committeeByIdCache };
    }

    /**
     * Haalt alle Directus gebruikers op en bouwt een cache op Entra ID.
     */
    static async getUsers() {
        const allLeden = (await DirectusService.getAllUsers()) as unknown as DirectusUser[];
        const userCacheByEntra = new Map<string, DirectusUser>();

        for (const u of allLeden) {
            if (u.entra_id) {
                userCacheByEntra.set(u.entra_id, u);
            }
        }

        return { allLeden, userCacheByEntra };
    }

    static async getMemberships() {
        const allMemberships = (await DirectusService.getAllCommitteeMembers()) as unknown as CommitteeMember[];
        const membershipCache = new Map<string, CommitteeMember[]>();

        for (const m of allMemberships) {
            if (!m.user_id) continue;
            const list = membershipCache.get(m.user_id) || [];
            list.push(m);
            membershipCache.set(m.user_id, list);
        }

        return { allMemberships, membershipCache };
    }

    static async getMainMembershipState(token: string, entraId?: string) {
        const mainGroupDetails = await GraphService.getBatchGroupDetails([GROUP_ACTIVE_LID, GROUP_EXPIRED_LID], token);
        const mainMembershipState = new Map<string, Set<string>>();

        for (const [groupId, details] of mainGroupDetails) {
            const targetIds = entraId ? (details.members.includes(entraId) ? [entraId] : []) : details.members;

            for (const userId of targetIds) {
                const userGroups = mainMembershipState.get(userId) || new Set<string>();
                userGroups.add(groupId);
                mainMembershipState.set(userId, userGroups);
            }
        }

        return mainMembershipState;
    }

    /**
     * Bouwt de volledige commissie-lidmaatschapsmap op basis van Azure AD groepsdetails.
     */
    static async getAzureMembershipMap(relevantAzureGroupIds: string[], committeeCache: Map<string, Committee>, token: string) {
        const groupDetails = await GraphService.getBatchGroupDetails(relevantAzureGroupIds, token);
        const membershipMap = new Map<string, Map<number, boolean>>();

        for (const [groupId, details] of groupDetails) {
            const dComm = committeeCache.get(groupId);
            if (!dComm || typeof dComm.id !== 'number') continue;
            const committeeId = dComm.id;

            // 1. Process explicit members
            for (const memberId of details.members) {
                const userMap = membershipMap.get(memberId) || new Map<number, boolean>();
                userMap.set(committeeId, details.owners.includes(memberId));
                membershipMap.set(memberId, userMap);
            }

            // 2. Process owners (ensure they are treated as members and leaders)
            for (const ownerId of details.owners) {
                const userMap = membershipMap.get(ownerId) || new Map<number, boolean>();
                if (!userMap.has(committeeId)) {
                    userMap.set(committeeId, true);
                    membershipMap.set(ownerId, userMap);
                }
            }
        }

        return membershipMap;
    }
}
