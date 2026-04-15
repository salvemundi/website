import { AzureUser } from '../graph.service.js';
import { DirectusService } from '../directus.service.js';
import { SyncContext } from './sync-types.js';
import { parseAzureDate } from './sync-helpers.js';
import { SyncLifecycle } from './sync-lifecycle.js';

export class SyncProcessor {
    /**
     * Optimized syncUser that uses pre-fetched membership map instead of making API calls.
     */
    static async syncUserOptimized(ctx: SyncContext & { membershipMap: Map<string, Map<number, boolean>> }, aUser: AzureUser) {
        const email = (aUser.mail || aUser.userPrincipalName).toLowerCase();
        const changes: { field: string; old: any; new: any }[] = [];
        
        let dUser = ctx.userCacheByEntra.get(aUser.id);

        if (!dUser) {
            const csa = aUser.customSecurityAttributes?.SalveMundiLidmaatschap;
            const phone = aUser.mobilePhone || '';
            
            let dob: string | undefined = undefined;
            if (csa?.Geboortedatum) {
                dob = csa.Geboortedatum.includes('-') ? csa.Geboortedatum : parseAzureDate(csa.Geboortedatum) || undefined;
            } else if (aUser.birthday) {
                dob = new Date(aUser.birthday).toISOString().split('T')[0];
            }

            let expiry: string | undefined = undefined;
            const date = csa?.VerloopdatumStr || csa?.Verloopdatum;
            if (date) {
                expiry = parseAzureDate(date) || undefined;
            }

            let paidDate: string | undefined = undefined;
            const pDate = csa?.OrigineleBetaalDatumStr || csa?.OrigineleBetaalDatum;
            if (pDate) {
                paidDate = parseAzureDate(pDate) || undefined;
            }

            dUser = await DirectusService.createUser({
                first_name: aUser.givenName || '',
                last_name: aUser.surname || '',
                email: email,
                entra_id: aUser.id,
                status: 'active',
                text_direction: 'auto',
                admin_access: false,
                phone_number: phone,
                date_of_birth: dob,
                membership_expiry: expiry,
                originele_betaaldatum: paidDate,
                membership_status: 'none'
            });
            ctx.status.createdCount++;
            changes.push({ field: 'User', old: 'Bestaat niet', new: 'Nieuw lid aangemaakt' });
            ctx.status.createdUsers.push({ email, changes });
        }

        const csa = aUser.customSecurityAttributes?.SalveMundiLidmaatschap;
        const updatePayload: any = {};

        if (dUser.status !== 'active') {
            updatePayload.status = 'active';
        }

        const fields = ctx.options.fields;

        if (fields.includes('membership_expiry')) {
            const date = csa?.VerloopdatumStr || csa?.Verloopdatum;
            if (date) updatePayload.membership_expiry = parseAzureDate(date);
        }

        if (fields.includes('geboortedatum')) {
            if (csa?.Geboortedatum) {
                updatePayload.date_of_birth = csa.Geboortedatum.includes('-') ? csa.Geboortedatum : parseAzureDate(csa.Geboortedatum);
            } else if (aUser.birthday) {
                updatePayload.date_of_birth = new Date(aUser.birthday).toISOString().split('T')[0];
            }
        }

        if (csa?.OrigineleBetaalDatumStr) {
            updatePayload.originele_betaaldatum = parseAzureDate(csa.OrigineleBetaalDatumStr);
        }

        if (fields.includes('phone_number') && aUser.mobilePhone) {
            updatePayload.phone_number = aUser.mobilePhone;
        }

        if (Object.keys(updatePayload).length > 0) {
            // Track changes for existing user
            for (const key of Object.keys(updatePayload)) {
                if (dUser[key] !== updatePayload[key]) {
                    changes.push({ field: key, old: dUser[key], new: updatePayload[key] });
                }
            }
            if (changes.length > 0) {
                await DirectusService.updateUser(dUser.id, updatePayload);
            }
        }

        // LIFECYCLE MANAGEMENT
        const lifecycleChanges = await SyncLifecycle.handleLifecycle(ctx, aUser, dUser, updatePayload.membership_expiry);
        changes.push(...lifecycleChanges);

        // COMMITTEES
        if (fields.includes('committees')) {
            const currentMemberships = ctx.membershipCache.get(dUser.id) || [];
            const azureMemberships = ctx.membershipMap.get(aUser.id) || new Map<number, boolean>();

            for (const [committeeId, isLeader] of azureMemberships) {
                const existing = currentMemberships.find((m: any) => {
                    const mCommId = (typeof m.committee_id === 'object' && m.committee_id !== null) ? m.committee_id.id : m.committee_id;
                    return Number(mCommId) === Number(committeeId);
                });

                if (!existing) {
                    await DirectusService.addMemberToCommittee(dUser.id, committeeId, isLeader);
                    changes.push({ field: 'Commissie', old: 'Geen', new: `Toegevoegd aan ID ${committeeId}${isLeader ? ' (Leider)' : ''}` });
                } else if (existing.is_leader !== isLeader) {
                    await DirectusService.updateCommitteeMember(existing.id, { is_leader: isLeader });
                    changes.push({ field: `Commissie ${committeeId} status`, old: 'Lid', new: 'Leider' });
                }
            }

            for (const current of currentMemberships) {
                if (!azureMemberships.has(current.committee_id)) {
                    await DirectusService.removeMemberFromCommittee(current.id);
                    changes.push({ field: 'Commissie', old: `ID ${current.committee_id}`, new: 'Verwijderd' });
                }
            }
        }

        if (changes.length > 0) {
            ctx.status.successCount++;
            ctx.status.successfulUsers.push({ 
                email, 
                changes
            });
        }
    }
}
