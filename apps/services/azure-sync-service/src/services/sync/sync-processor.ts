import { type AzureUser, GraphService } from '../graph.service.js';
import { type DirectusUser } from '../../types/schema.js';
import { DirectusService } from '../directus.service.js';
import { type SyncContext } from './sync-types.js';
import { parseAzureDate, sanitizeAzureDate } from './sync-helpers.js';
import { SyncLifecycle } from './sync-lifecycle.js';
import { logInfo, safeConsoleError } from '../../utils/logger.js';
import { type CommitteeMembership as DirectusCommitteeMembership } from '@salvemundi/validations';

export class SyncProcessor {
    static async syncUserOptimized(ctx: SyncContext & { membershipMap: Map<string, Map<number, boolean>> }, aUser: AzureUser) {
        const email = (aUser.mail || aUser.userPrincipalName).toLowerCase();
        const changes: { field: string; old: unknown; new: unknown }[] = [];

        let dUser = ctx.userCacheByEntra.get(aUser.id);

        if (!dUser && ctx.options.forceLink) {
            const existingByEmail = Array.from(ctx.userCacheByEntra.values()).find(u => u.email?.toLowerCase() === email);

            if (existingByEmail) {
                logInfo(`[SYNC] Linking existing user ${email} to Entra ID ${aUser.id}`);
                await DirectusService.updateUser(existingByEmail.id, { entra_id: aUser.id });
                dUser = { ...existingByEmail, entra_id: aUser.id };
                ctx.userCacheByEntra.set(aUser.id, dUser);
                changes.push({ field: 'User Link', old: 'Geen Entra ID', new: `Gekoppeld aan ${aUser.id}` });
            }
        }

        if (!dUser) {
            const csa = aUser.customSecurityAttributes?.SalveMundiLidmaatschap;
            const phone = aUser.mobilePhone || '';

            let dob: string | undefined = undefined;
            if (csa?.Geboortedatum) {
                dob = sanitizeAzureDate(csa.Geboortedatum.includes('-') ? csa.Geboortedatum : parseAzureDate(csa.Geboortedatum)) || undefined;
            } else if (aUser.birthday) {
                dob = sanitizeAzureDate(new Date(aUser.birthday).toISOString().split('T')[0]) || undefined;
            }

            let expiry: string | undefined = undefined;
            const date = csa?.VerloopdatumStr || csa?.Verloopdatum;
            if (date) {
                expiry = sanitizeAzureDate(parseAzureDate(date)) || undefined;
            }

            let paidDate: string | undefined = undefined;
            const pDate = csa?.OrigineleBetaalDatumStr || csa?.OrigineleBetaalDatum;
            if (pDate) {
                paidDate = sanitizeAzureDate(parseAzureDate(pDate)) || undefined;
            }

            try {
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
                }) as unknown as DirectusUser;
                ctx.status.createdCount++;
                changes.push({ field: 'User', old: 'Bestaat niet', new: 'Nieuw lid aangemaakt' });
                ctx.status.createdUsers.push({ email, changes: [...changes] });
            } catch (error) {
                safeConsoleError('[SyncProcessor][syncUserOptimized][createUser]', error);
                throw new Error(`Kon gebruiker ${email} niet aanmaken. Bestaat waarschijnlijk al zonder Entra ID. Gebruik 'Forceer Entra Link' om ze te koppelen.`, { cause: error });
            }
        }

        const currentUser = dUser;
        const csa = aUser.customSecurityAttributes?.SalveMundiLidmaatschap;
        const updatePayload: Record<string, unknown> = {};
        const fields = ctx.options.fields || [];

        if (fields.includes('status') && currentUser.status !== 'active') {
            updatePayload.status = 'active';
        }

        if (fields.includes('membership_expiry')) {
            const date = csa?.VerloopdatumStr || csa?.Verloopdatum;
            const parsed = date ? sanitizeAzureDate(parseAzureDate(date)) : null;
            if (parsed) updatePayload.membership_expiry = parsed;
        }

        if (fields.includes('geboortedatum')) {
            let azureDob: string | null = null;
            if (csa?.Geboortedatum) {
                azureDob = sanitizeAzureDate(csa.Geboortedatum.includes('-') ? csa.Geboortedatum : parseAzureDate(csa.Geboortedatum));
            } else if (aUser.birthday) {
                azureDob = sanitizeAzureDate(new Date(aUser.birthday).toISOString().split('T')[0]);
            }
            if (azureDob) updatePayload.date_of_birth = azureDob;
        }

        if (fields.includes('originele_betaaldatum')) {
            const pDate = csa?.OrigineleBetaalDatumStr || csa?.OrigineleBetaalDatum;
            const parsed = pDate ? sanitizeAzureDate(parseAzureDate(pDate)) : null;
            if (parsed) updatePayload.originele_betaaldatum = parsed;
        }

        if (fields.includes('phone_number') && aUser.mobilePhone) {
            updatePayload.phone_number = aUser.mobilePhone;
        }

        if (Object.keys(updatePayload).length > 0) {
            for (const key of Object.keys(updatePayload)) {
                const oldValue = currentUser[key as keyof DirectusUser];
                const newValue = updatePayload[key];
                if (oldValue !== newValue) {
                    changes.push({ field: key, old: oldValue || 'leeg', new: newValue });
                }
            }
            if (changes.length > 0) {
                await DirectusService.updateUser(currentUser.id, updatePayload);
            }
        }

        if (fields.includes('membership_status') || fields.includes('membership_expiry')) {
            const lifecycleChanges = await SyncLifecycle.handleLifecycle(ctx, aUser, currentUser, updatePayload.membership_expiry as string | null | undefined);
            changes.push(...lifecycleChanges);
        }

        if (fields.includes('committees')) {
            const currentMemberships = ((ctx.membershipCache.get(currentUser.id) || []) as any[]).map(m => ({
                ...m,
                id: String(m.id),
                committee_id: typeof m.committee_id === 'number'
                    ? { id: m.committee_id }
                    : m.committee_id
            })) as DirectusCommitteeMembership[];

            const azureMemberships = ctx.membershipMap.get(aUser.id) || new Map<number, boolean>();

            for (const [committeeId, isLeader] of azureMemberships) {
                const committee = ctx.committeeByIdCache?.get(Number(committeeId));
                const committeeName = committee?.name || `ID ${committeeId}`;

                const existing = currentMemberships.find((m) => {
                    const mCommId = (typeof m.committee_id === 'object' && m.committee_id !== null) ? m.committee_id.id : m.committee_id;
                    return Number(mCommId) === Number(committeeId);
                });

                if (!existing) {
                    await DirectusService.addMemberToCommittee(currentUser.id, committeeId, isLeader);
                    changes.push({ field: 'Commissie', old: 'Geen', new: `Toegevoegd aan ${committeeName}${isLeader ? ' (Leider)' : ''}` });
                } else if (existing.is_leader !== isLeader) {
                    await DirectusService.addMemberToCommittee(currentUser.id, Number(committeeId), isLeader);
                    changes.push({ field: `${committeeName} status`, old: 'Lid', new: 'Leider' });
                }
            }

            for (const current of currentMemberships) {
                const currentCommId = (typeof current.committee_id === 'object' && current.committee_id !== null) ? current.committee_id.id : current.committee_id;
                const committeeIdNum = currentCommId ? Number(currentCommId) : null;

                if (committeeIdNum === null) continue;

                if (!azureMemberships.has(committeeIdNum)) {
                    const committee = ctx.committeeByIdCache?.get(committeeIdNum);
                    const committeeName = committee?.name || `ID ${committeeIdNum}`;

                    await DirectusService.removeMemberFromCommittee(Number(current.id));
                    changes.push({ field: 'Commissie', old: committeeName, new: 'Verwijderd' });
                }
            }
        }

        if (fields.includes('profile_photo')) {
            const shouldSync = ctx.options.forceSyncPhotos || !currentUser.avatar;
            if (shouldSync) {
                let photo = ctx.photoCache?.get(aUser.id);

                if (photo === undefined) {
                    photo = await GraphService.getUserPhoto(aUser.id, ctx.token);
                }

                if (photo) {
                    await DirectusService.uploadUserAvatar(currentUser.id, photo.buffer, `avatar_${aUser.id}.jpg`, photo.contentType);
                    changes.push({ field: 'Profielfoto', old: currentUser.avatar ? 'Bestaand' : 'Geen', new: 'Bijgewerkt vanuit Azure' });
                }
            }
        }

        if (changes.length > 0) {
            if (!ctx.processedEmails) ctx.processedEmails = new Set<string>();
            if (!ctx.processedEmails.has(email)) {
                ctx.status.successCount++;
                ctx.processedEmails.add(email);
            }

            ctx.status.successfulUsers.push({
                email,
                changes
            });
        }
    }
}