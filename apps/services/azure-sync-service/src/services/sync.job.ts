import { GraphService, AzureUser } from './graph.service.js';
import { DirectusService } from './directus.service.js';

export interface SyncStatus {
    active: boolean;
    status: 'idle' | 'running' | 'completed' | 'failed';
    total: number;
    processed: number;
    errorCount: number;
    warningCount: number;
    missingDataCount: number;
    successCount: number;
    excludedCount: number;
    errors: { email: string; error: string; timestamp: string }[];
    warnings: { email: string; message: string }[];
    missingData: { email: string; reason: string }[];
    successfulUsers: { email: string }[];
    excludedUsers: { email: string }[];
    startTime?: string;
    endTime?: string;
}

export interface SyncOptions {
    fields: string[];
    forceLink?: boolean;
    activeOnly?: boolean;
}

export class SyncJob {
    private static currentOptions: SyncOptions = { fields: [] };
    private static currentStatus: SyncStatus = {
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
        excludedUsers: []
    };

    static getStatus(): SyncStatus {
        return this.currentStatus;
    }

    private static resetStatus(total: number) {
        this.currentStatus = {
            active: true,
            status: 'running',
            total,
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
            startTime: new Date().toISOString()
        };
    }

    static parseAzureDate(dateStr?: string): string | null {
        if (!dateStr || dateStr.length !== 8) return null;
        // Format YYYYMMDD to YYYY-MM-DD
        return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
    }

    static async run(token: string, options?: SyncOptions) {
        if (options) this.currentOptions = options;
        console.log('[SYNC] Starting synchronization job...');
        try {
            const azureUsers = await GraphService.getAllUsers(token);
            console.log(`[SYNC] Found ${azureUsers.length} users in Azure AD.`);

            this.resetStatus(azureUsers.length);

            for (const aUser of azureUsers) {
                try {
                    await this.syncUser(aUser, token);
                } catch (err: any) {
                    const email = aUser.mail || aUser.userPrincipalName || 'Unknown';
                    this.currentStatus.errorCount++;
                    this.currentStatus.errors.push({
                        email,
                        error: err.message,
                        timestamp: new Date().toISOString()
                    });
                } finally {
                    this.currentStatus.processed++;
                }
            }

            this.currentStatus.active = false;
            this.currentStatus.status = 'completed';
            this.currentStatus.endTime = new Date().toISOString();
            console.log('[SYNC] Completed synchronization job.');
        } catch (error: any) {
            this.currentStatus.active = false;
            this.currentStatus.status = 'failed';
            this.currentStatus.endTime = new Date().toISOString();
            console.error('[SYNC] Error during synchronization:', error);
        }
    }

    /**
     * Synchronizes a single user by their Directus UUID.
     * Useful for targeted provisioning after events.
     */
    static async syncUserById(userId: string, token: string) {
        const dUser = await DirectusService.getUserById(userId);
        if (!dUser) {
            throw new Error(`User ${userId} not found in Directus.`);
        }

        const entraId = dUser.entra_id;
        if (!entraId) {
            // If no Entra ID, we might need to search by email if it's a new provision
            if (!dUser.email) {
                throw new Error(`User ${dUser.id} has no email or Entra ID.`);
            }
            console.log(`[SYNC] User ${dUser.email} has no Entra ID. Attempting to locate in Azure...`);
            const aUser = await GraphService.getUserByEmail(dUser.email, token);
            if (!aUser) {
                throw new Error(`User ${dUser.email} not found in Azure AD.`);
            }
            await this.syncUser(aUser, token);
        } else {
            const aUser = await GraphService.getUser(entraId, token);
            if (!aUser) {
                throw new Error(`Entra ID ${entraId} not found in Azure.`);
            }
            await this.syncUser(aUser, token);
        }
    }

    public static async syncUser(aUser: AzureUser, token: string) {
        const email = (aUser.mail || aUser.userPrincipalName).toLowerCase();
        
        // 1. Find or Link User
        let dUser = await DirectusService.getUserByEntraId(aUser.id);
        if (!dUser) {
            dUser = await DirectusService.getUserByEmail(email);
            if (dUser && !dUser.entra_id) {
                // Auto-link existing account
                await DirectusService.updateUser(dUser.id, { entra_id: aUser.id });
                console.log(`[SYNC] Linked existing user ${email} to Entra ID ${aUser.id}`);
                this.currentStatus.warningCount++;
                this.currentStatus.warnings.push({
                    email,
                    message: `Linked existing user to Entra ID ${aUser.id}`
                });
            }
        }

        if (!dUser) {
            // User likely not yet provisioned by SSO, skip background sync for now
            this.currentStatus.excludedCount++;
            this.currentStatus.excludedUsers.push({ email });
            return;
        }

        // Active only check
        if (this.currentOptions.activeOnly && dUser.status !== 'active') {
            this.currentStatus.excludedCount++;
            this.currentStatus.excludedUsers.push({ email });
            return;
        }

        // 2. Update Basic Attributes (Custom Security Attributes)
        const csa = aUser.customSecurityAttributes?.SalveMundiLidmaatschap;
        const updatePayload: any = {};
        const fields = this.currentOptions.fields;

        if (fields.includes('membership_expiry')) {
            if (csa?.VerloopdatumStr || csa?.Verloopdatum) {
                updatePayload.membership_expiry = this.parseAzureDate(csa.VerloopdatumStr || csa.Verloopdatum);
            } else {
                this.currentStatus.missingDataCount++;
                this.currentStatus.missingData.push({ email, reason: 'Missende lidmaatschap vervaldatum' });
            }
        }

        if (fields.includes('geboortedatum')) {
            if (csa?.Geboortedatum) {
                updatePayload.date_of_birth = csa.Geboortedatum.includes('-') 
                    ? csa.Geboortedatum 
                    : this.parseAzureDate(csa.Geboortedatum);
            } else if (aUser.birthday) {
                updatePayload.date_of_birth = new Date(aUser.birthday).toISOString().split('T')[0];
            } else {
                this.currentStatus.missingDataCount++;
                this.currentStatus.missingData.push({ email, reason: 'Missende geboortedatum' });
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

        // 3. Sync Committee Memberships
        if (fields.includes('committees')) {
            const azureGroups = await GraphService.getUserGroups(aUser.id, token);
            const currentMemberships = await DirectusService.getCommitteeMembers(dUser.id);
            
            const desiredCommittees: { id: number; isLeader: boolean }[] = [];

            for (const group of azureGroups) {
                const dCommittee = await DirectusService.getCommitteeByAzureId(group.id);
                if (!dCommittee) {
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
                } else if (existing.is_leader !== desired.isLeader) {
                    await DirectusService.updateCommitteeMember(existing.id, { is_leader: desired.isLeader });
                }
            }

            // Remove old memberships
            for (const current of currentMemberships) {
                const stillDesired = desiredCommittees.some(d => d.id === current.committee_id);
                if (!stillDesired) {
                    await DirectusService.removeMemberFromCommittee(current.id);
                }
            }
        }

        this.currentStatus.successCount++;
        this.currentStatus.successfulUsers.push({ email });
    }
}
