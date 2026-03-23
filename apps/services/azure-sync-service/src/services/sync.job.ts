import { GraphService, AzureUser } from './graph.service.js';
import { DirectusService } from './directus.service.js';
import { TokenService } from './token.service.js';
import { Redis } from 'ioredis';

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
    private static REDIS_KEY = 'v7:sync:status';
    private static currentOptions: SyncOptions = { fields: [] };

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
        excludedUsers: []
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

    private static async updateStatus(redis: Redis, status: SyncStatus) {
        const release = await this.acquireStatusLock();
        try {
            await redis.set(this.REDIS_KEY, JSON.stringify(status), 'EX', 86400 * 7); // 7 days expiry
        } finally {
            release();
        }
    }

    private static async resetStatus(redis: Redis, total: number) {
        const status: SyncStatus = {
            ...this.defaultStatus,
            active: true,
            status: 'running',
            total,
            startTime: new Date().toISOString()
        };
        await this.updateStatus(redis, status);
    }

    static parseAzureDate(dateStr?: string): string | null {
        if (!dateStr || dateStr.length !== 8) return null;
        // Format YYYYMMDD to YYYY-MM-DD
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
        
        // Exact match
        if (this.EXCLUDED_EMAILS.includes(lowerEmail)) return true;
        
        // Pattern checks
        if (lowerEmail.startsWith('test-')) return true;
        
        return false;
    }

    static async run(redis: Redis, options?: SyncOptions) {
        if (options) this.currentOptions = options;
        console.log('[SYNC] Starting synchronization job...');
        try {
            // Initial token for fetching user list
            const initialToken = await TokenService.getAccessToken(redis);
            const azureUsers = await GraphService.getAllUsers(initialToken);
            console.log(`[SYNC] Found ${azureUsers.length} users in Azure AD.`);

            await this.resetStatus(redis, azureUsers.length);

            const chunkSize = 10;
            for (let i = 0; i < azureUsers.length; i += chunkSize) {
                const chunk = azureUsers.slice(i, i + chunkSize);
                console.log(`[SYNC] Processing chunk ${Math.floor(i / chunkSize) + 1} of ${Math.ceil(azureUsers.length / chunkSize)}...`);
                
                // Get a fresh token for this chunk
                const currentToken = await TokenService.getAccessToken(redis);

                await Promise.all(chunk.map(async (aUser) => {
                    const email = aUser.mail || aUser.userPrincipalName || 'Unknown';
                    
                    if (this.shouldExcludeUser(email)) {
                        const status = await this.getStatus(redis);
                        status.excludedCount++;
                        status.excludedUsers.push({ email });
                        status.processed++;
                        await this.updateStatus(redis, status);
                        return;
                    }

                    try {
                        await this.syncUser(redis, aUser, currentToken);
                    } catch (err: any) {
                        const email = aUser.mail || aUser.userPrincipalName || 'Unknown';
                        const status = await this.getStatus(redis);
                        status.errorCount++;
                        status.errors.push({
                            email,
                            error: err.message,
                            timestamp: new Date().toISOString()
                        });
                        await this.updateStatus(redis, status);
                    } finally {
                        const finalStatus = await this.getStatus(redis);
                        finalStatus.processed++;
                        await this.updateStatus(redis, finalStatus);
                    }
                }));
            }

            const finalStatus = await this.getStatus(redis);
            finalStatus.active = false;
            finalStatus.status = 'completed';
            finalStatus.endTime = new Date().toISOString();
            await this.updateStatus(redis, finalStatus);
            console.log('[SYNC] Completed synchronization job.');
        } catch (error: any) {
            const status = await this.getStatus(redis);
            status.active = false;
            status.status = 'failed';
            status.endTime = new Date().toISOString();
            await this.updateStatus(redis, status);
            console.error('[SYNC] Error during synchronization:', error);
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
            await this.syncUser(redis, aUser, token);
        } else {
            const aUser = await GraphService.getUser(entraId, token);
            if (!aUser) {
                throw new Error(`Entra ID ${entraId} not found in Azure.`);
            }
            await this.syncUser(redis, aUser, token);
        }
    }

    public static async syncUser(redis: Redis, aUser: AzureUser, token: string) {
        const email = (aUser.mail || aUser.userPrincipalName).toLowerCase();
        
        // 1. Find or Link User
        let dUser = await DirectusService.getUserByEntraId(aUser.id);
        if (!dUser) {
            dUser = await DirectusService.getUserByEmail(email);
            if (dUser && !dUser.entra_id) {
                // Auto-link existing account
                await DirectusService.updateUser(dUser.id, { entra_id: aUser.id });
                console.log(`[SYNC] Linked existing user ${email} to Entra ID ${aUser.id}`);
                
                const status = await this.getStatus(redis);
                status.warningCount++;
                status.warnings.push({
                    email,
                    message: `Linked existing user to Entra ID ${aUser.id}`
                });
                await this.updateStatus(redis, status);
            }
        }

        if (!dUser) {
            // User likely not yet provisioned by SSO, skip background sync for now
            const status = await this.getStatus(redis);
            status.excludedCount++;
            status.excludedUsers.push({ email });
            await this.updateStatus(redis, status);
            return;
        }

        // Active only check
        if (this.currentOptions.activeOnly && dUser.status !== 'active') {
            const status = await this.getStatus(redis);
            status.excludedCount++;
            status.excludedUsers.push({ email });
            await this.updateStatus(redis, status);
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
                const status = await this.getStatus(redis);
                status.missingDataCount++;
                status.missingData.push({ email, reason: 'Missende lidmaatschap vervaldatum' });
                await this.updateStatus(redis, status);
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
                const status = await this.getStatus(redis);
                status.missingDataCount++;
                status.missingData.push({ email, reason: 'Missende geboortedatum' });
                await this.updateStatus(redis, status);
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

        const status = await this.getStatus(redis);
        status.successCount++;
        status.successfulUsers.push({ email });
        await this.updateStatus(redis, status);
    }
}
