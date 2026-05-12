'use server';

import { getEnrichedSession } from '@/server/auth/auth-utils';
import { getPermissions } from '@/shared/lib/permissions';
import { fetchUserMetadataDb, fetchUserCommitteesDb } from "@/server/internal/user-db.utils";
import { type EnrichedUser, type ImpersonationInfo } from "@/types/auth";
import { headers } from 'next/headers';

/**
 * Centraal mechanisme voor admin-toegangscontrole en user-enrichment.
 * Wordt gebruikt in layouts, pages en server actions.
 */
export async function checkAdminAccess() {
    const safeHeaders = new Headers();
    try {
        const h = await headers();
        h.forEach((v, k) => safeHeaders.set(k, v));
    } catch (_e) { }
    
    try {
        const session = await getEnrichedSession();
        
        if (!session || !session.user) {
            return { isAuthorized: false, user: null, isIct: false, impersonation: null };
        }

        const user = session.user as unknown as EnrichedUser;

        try {
            const [metadata, committees] = await Promise.all([
                fetchUserMetadataDb(user.id),
                fetchUserCommitteesDb(user.id)
            ]);

            if (metadata) {
                user.membership_status = metadata.membership_status;
                user.membership_expiry = metadata.membership_expiry;
                user.minecraft_username = metadata.minecraft_username;
                user.phone_number = metadata.phone_number;
                user.date_of_birth = metadata.date_of_birth;
                user.entra_id = metadata.entra_id;
            }
            if (committees) {
                user.committees = committees;
                const perms = getPermissions(committees);
                user.isICT = perms.isICT;

                // Store granular permissions in the user object for convenience
                Object.assign(user, perms);
            }
        } catch (_e) {
            // Silently fail metadata enrichment
        }

        if (!user.name && (user.first_name || user.last_name)) {
            user.name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        }
        const impersonatedBy = (session as { impersonatedBy?: ImpersonationInfo }).impersonatedBy || null;

        const perms = getPermissions(user.committees || []);
        const isAuthorized = Object.values(perms).some(v => v === true);
        const isIct = perms.isICT || false;

        return {
            isAuthorized,
            user,
            isIct,
            impersonation: impersonatedBy ? {
                id: impersonatedBy.id,
                name: impersonatedBy.name,
                email: impersonatedBy.email,
                isNormallyAdmin: impersonatedBy.isNormallyAdmin,
                targetName: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                targetCommittees: user.committees?.map((c) => c.name) || []
            } : null
        };
    } catch (_e) {
        return { isAuthorized: false, user: null, isIct: false, impersonation: null };
    }
}
