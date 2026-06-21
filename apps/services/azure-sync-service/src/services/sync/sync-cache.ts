import { DirectusService } from '../directus.service.js';
import { GraphService } from '../graph.service.js';
import { Directus } from '@salvemundi/validations';
import { GROUP_ACTIVE_LID, GROUP_EXPIRED_LID } from './sync-types.js';

export class SyncCache {
    static async getCommittees() {
        const committees = (await DirectusService.getAllCommittees()) as unknown as Directus.Committee[];
        const committeeCache = new Map<string, Directus.Committee>();
        const committeeByIdCache = new Map<number, Directus.Committee>();

        for (const c of committees) {
            committeeByIdCache.set(Number(c.id), c);
            if (c.azure_group_id) {
                committeeCache.set(c.azure_group_id, c);
            }
        }

        return { committees, committeeCache, committeeByIdCache };
    }

    static async getUsers() {
        const allLeden = (await DirectusService.getAllUsers()) as unknown as Directus.CustomDirectusUser[];
        const userCacheByEntra = new Map<string, Directus.CustomDirectusUser>();

        for (const u of allLeden) {
            if (u.entra_id) {
                userCacheByEntra.set(u.entra_id, u);
            }
        }

        return { allLeden, userCacheByEntra };
    }

    static async getMemberships() {
        const allMemberships = (await DirectusService.getAllCommitteeMembers()) as unknown as Directus.CommitteeMember[];
        const membershipCache = new Map<string, Directus.CommitteeMember[]>();

        for (const m of allMemberships) {
            if (!m.user_id) continue;
            const userId = typeof m.user_id === 'string' ? m.user_id : m.user_id.id;

            const list = membershipCache.get(userId) || [];
            list.push(m);
            membershipCache.set(userId, list);
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

    static async getAzureMembershipMap(relevantAzureGroupIds: string[], committeeCache: Map<string, Directus.Committee>, token: string) {
        const groupDetails = await GraphService.getBatchGroupDetails(relevantAzureGroupIds, token);
        const membershipMap = new Map<string, Map<number, boolean>>();

        for (const [groupId, details] of groupDetails) {
            const dComm = committeeCache.get(groupId);
            if (!dComm || typeof dComm.id !== 'number') continue;
            const committeeId = dComm.id;

            for (const memberId of details.members) {
                const userMap = membershipMap.get(memberId) || new Map<number, boolean>();
                userMap.set(committeeId, details.owners.includes(memberId));
                membershipMap.set(memberId, userMap);
            }

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