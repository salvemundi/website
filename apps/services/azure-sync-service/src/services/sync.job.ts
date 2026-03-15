import { GraphService, AzureUser } from './graph.service.js';
import { DirectusService } from './directus.service.js';

export class SyncJob {
    static parseAzureDate(dateStr?: string): string | null {
        if (!dateStr || dateStr.length !== 8) return null;
        // Format YYYYMMDD to YYYY-MM-DD
        return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
    }

    static async run(token: string) {
        console.log('[SYNC] Starting synchronization job...');
        try {
            const azureUsers = await GraphService.getAllUsers(token);
            console.log(`[SYNC] Found ${azureUsers.length} users in Azure AD.`);

            for (const aUser of azureUsers) {
                await this.syncUser(aUser, token);
            }

            console.log('[SYNC] Completed synchronization job.');
        } catch (error) {
            console.error('[SYNC] Error during synchronization:', error);
        }
    }

    private static async syncUser(aUser: AzureUser, token: string) {
        const email = (aUser.mail || aUser.userPrincipalName).toLowerCase();
        
        // 1. Find or Link User
        let dUser = await DirectusService.getUserByEntraId(aUser.id);
        if (!dUser) {
            dUser = await DirectusService.getUserByEmail(email);
            if (dUser && !dUser.entra_id) {
                // Auto-link existing account
                await DirectusService.updateUser(dUser.id, { entra_id: aUser.id });
                console.log(`[SYNC] Linked existing user ${email} to Entra ID ${aUser.id}`);
            }
        }

        if (!dUser) {
            // User likely not yet provisioned by SSO, skip background sync for now
            return;
        }

        // 2. Update Basic Attributes (Custom Security Attributes)
        const csa = aUser.customSecurityAttributes?.SalveMundiLidmaatschap;
        const updatePayload: any = {};

        if (csa?.VerloopdatumStr || csa?.Verloopdatum) {
            updatePayload.membership_expiry = this.parseAzureDate(csa.VerloopdatumStr || csa.Verloopdatum);
        }

        if (csa?.Geboortedatum) {
            updatePayload.date_of_birth = csa.Geboortedatum.includes('-') 
                ? csa.Geboortedatum 
                : this.parseAzureDate(csa.Geboortedatum);
        } else if (aUser.birthday) {
            updatePayload.date_of_birth = new Date(aUser.birthday).toISOString().split('T')[0];
        }

        if (csa?.OrigineleBetaalDatumStr) {
            updatePayload.originele_betaaldatum = this.parseAzureDate(csa.OrigineleBetaalDatumStr);
        }

        if (Object.keys(updatePayload).length > 0) {
            await DirectusService.updateUser(dUser.id, updatePayload);
        }

        // 3. Sync Committee Memberships
        const azureGroups = await GraphService.getUserGroups(aUser.id, token);
        const currentMemberships = await DirectusService.getCommitteeMembers(dUser.id);
        
        const desiredCommittees: { id: number; isLeader: boolean }[] = [];

        for (const group of azureGroups) {
            const dCommittee = await DirectusService.getCommitteeByAzureId(group.id);
            if (!dCommittee) {
                console.log(`[SYNC] Skipping Azure group "${group.displayName}" (${group.id}) - No matching committee with this azure_group_id in Directus.`);
                continue;
            }

            const owners = await GraphService.getGroupOwners(group.id, token);
            const isLeader = owners.includes(aUser.id);
            desiredCommittees.push({ id: dCommittee.id, isLeader });
        }

        // Add/Update memberships
        for (const desired of desiredCommittees) {
            const existing = currentMemberships.find((m: any) => m.committee_id === desired.id);
            if (!existing) {
                await DirectusService.addMemberToCommittee(dUser.id, desired.id, desired.isLeader);
                console.log(`[SYNC] Added ${email} to committee ${desired.id} (Leader: ${desired.isLeader})`);
            } else if (existing.is_leader !== desired.isLeader) {
                await DirectusService.updateCommitteeMember(existing.id, { is_leader: desired.isLeader });
                console.log(`[SYNC] Updated leadership status for ${email} in committee ${desired.id}`);
            }
        }

        // Remove old memberships
        for (const current of currentMemberships) {
            const stillDesired = desiredCommittees.some(d => d.id === current.committee_id);
            if (!stillDesired) {
                await DirectusService.removeMemberFromCommittee(current.id);
                console.log(`[SYNC] Removed ${email} from committee ${current.committee_id}`);
            }
        }
    }
}
