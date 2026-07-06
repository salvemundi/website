'use server';

import { getEnrichedSession } from '@/server/auth/auth-utils';
import type { ImpersonationInfo } from '@/types/auth';
import { COMMITTEES, type AdminFeature } from '@/shared/lib/permissions-config';
import { checkFeatureAccess, getPermissions } from '@/shared/lib/permissions';
import { fetchUserMetadataDb, fetchUserCommitteesDb } from "@/server/internal/leden/leden-db.utils";
import { headers, cookies } from 'next/headers';
import { safeConsoleError } from '@/server/utils/logger';
import { unstable_cache, revalidatePath } from 'next/cache';
import { db, schema } from '@salvemundi/db';
import { eq } from 'drizzle-orm';

type DirectusUserSelect = typeof schema.directus_users.$inferSelect;
type CommitteeSelect = typeof schema.committees.$inferSelect;

export interface StronglyTypedAdminUser extends DirectusUserSelect {
    committees: CommitteeSelect[];
}

const getCachedUserEnrichment = unstable_cache(
    async (userId: string) => {
        const [metadata, committees] = await Promise.all([
            fetchUserMetadataDb(userId),
            fetchUserCommitteesDb(userId)
        ]);
        return { 
            metadata: metadata as DirectusUserSelect | null, 
            committees: committees as CommitteeSelect[] | null 
        };
    },
    ['user-enrichment-v1'],
    { revalidate: 10 }
);

export async function checkAdminAccess() {
    try {
        await headers();
    } catch (error) {
        safeConsoleError(`[admin-utils.actions.ts][checkAdminAccess] Failed to fetch headers`, error);
        return { isAuthorized: false, user: null, isIct: false, impersonation: null };
    }

    try {
        const session = await getEnrichedSession();
        if (!session?.user) {
            return { isAuthorized: false, user: null, isIct: false, impersonation: null };
        }

        const user = session.user as unknown as StronglyTypedAdminUser;
        user.committees = [];

        try {
            const { metadata, committees } = await getCachedUserEnrichment(user.id);

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
            }
        } catch (error) {
            safeConsoleError(`[admin-utils.actions.ts][checkAdminAccess] Error while enriching user`, error);
        }

        const firstName = user.first_name ?? '';
        const lastName = user.last_name ?? '';
        if (!user.name && (firstName || lastName)) {
            user.name = `${firstName} ${lastName}`.trim();
        }

        const currentCommittees = user.committees;
        const permissions = getPermissions(currentCommittees);
        const isIct = permissions.includes('ict');
        let isBoard = false;
        let isKandi = false;

        for (const c of currentCommittees) {
            if (c.azure_group_id === COMMITTEES.BESTUUR) {
                isBoard = true;
            }
            if (c.azure_group_id === COMMITTEES.KANDI) {
                isKandi = true;
            }
        }

        Object.assign(user, {
            permissions,
        });

        const isAuthorized = isIct || isBoard || isKandi || currentCommittees.length > 0;

        const cookieStore = await cookies();
        const testToken = cookieStore.get('directus_test_token')?.value;
        let impersonationInfo: ImpersonationInfo | null = null;
        
        if (testToken) {
            const infoCookie = cookieStore.get('impersonation_info')?.value;
            
            if (!infoCookie) {
                throw new Error('Test modus is actief, maar de sessie data ontbreekt. Wis je cookies (directus_test_token) of log opnieuw in.');
            }

            try {
                const parsed = JSON.parse(infoCookie) as { adminName?: string; targetName?: string; targetCommittees?: string[] };
                
                if (!parsed.adminName || !parsed.targetName) {
                    throw new Error('Test modus sessie data is corrupt.');
                }
                
                impersonationInfo = {
                    id: '',
                    email: '',
                    isNormallyAdmin: true,
                    name: parsed.adminName,
                    targetName: parsed.targetName,
                    targetCommittees: parsed.targetCommittees || []
                };
            } catch (error) {
                safeConsoleError(`[admin-utils.actions.ts][checkAdminAccess] Failed to parse impersonation_info`, error);
                if (error instanceof Error) throw error;
                throw new Error('Test modus status is beschadigd.');
            }
        }

        return {
            isAuthorized,
            user,
            isIct,
            impersonation: impersonationInfo
        };
    } catch (error) {
        safeConsoleError(`[admin-utils.actions.ts][checkAdminAccess] Error in checkAdminAccess`, error);
        if (error instanceof Error && error.message.includes('Test modus')) {
            throw error;
        }
        return { isAuthorized: false, user: null, isIct: false, impersonation: null };
    }
}

export async function enforceFeatureAccess(feature: AdminFeature) {
    const { user } = await checkAdminAccess();
    if (!user) {
        throw new Error("Helaas, je bent niet ingelogd en mag deze pagina niet bezoeken.");
    }

    const { hasAccess, isLeader } = checkFeatureAccess(user.committees, feature);
    if (!hasAccess) {
        throw new Error("Helaas, je hebt geen rechten om deze pagina te bezoeken.");
    }

    return { user, isLeader };
}

export async function toggleFeatureFlag(
    routeMatch: string,
    name: string,
    defaultMessage: string,
    pathsToRevalidate: string[]
) {
    try {
        const rows = await db.select({
            id: schema.feature_flags.id,
            is_active: schema.feature_flags.is_active
        }).from(schema.feature_flags)
        .where(eq(schema.feature_flags.route_match, routeMatch))
        .limit(1);

        if (rows.length === 0) {
            await db.insert(schema.feature_flags).values({
                name,
                route_match: routeMatch,
                is_active: true,
                message: defaultMessage
            });
        } else {
            await db.update(schema.feature_flags)
                .set({ is_active: !rows[0].is_active })
                .where(eq(schema.feature_flags.id, rows[0].id));
        }

        for (const path of pathsToRevalidate) {
            revalidatePath(path);
        }

        return { success: true };
    } catch (error) {
        safeConsoleError(`[admin-utils.actions.ts][toggleFeatureFlag] Failed for ${routeMatch}`, error);
        return { success: false, error: 'Kan zichtbaarheid niet aanpassen.' };
    }
}

export async function getFeatureFlagSettings(routeMatch: string) {
    const rows = await db.select({ is_active: schema.feature_flags.is_active, message: schema.feature_flags.message })
        .from(schema.feature_flags)
        .where(eq(schema.feature_flags.route_match, routeMatch))
        .limit(1);
    return rows[0] ? { show: rows[0].is_active, disabled_message: rows[0].message } : { show: true, disabled_message: null };
}