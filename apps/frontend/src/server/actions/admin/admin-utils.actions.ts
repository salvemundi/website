'use server';

import { getEnrichedSession } from '@/server/auth/auth-utils';
import type { ImpersonationInfo, ExtendedSession } from '@/types/auth';
import { COMMITTEES, type AdminFeature } from '@/shared/lib/permissions-config';
import { checkFeatureAccess, getPermissions } from '@/shared/lib/permissions';
import { fetchUserMetadataDb, fetchUserCommitteesDb } from "@/server/internal/leden/leden-db.utils";
import { headers, cookies } from 'next/headers';
import { safeConsoleError } from '@/server/utils/logger';
import { db, schema } from '@salvemundi/db';
import { eq } from 'drizzle-orm';
import { unstable_cache, revalidatePath, updateTag } from 'next/cache';

type DirectusUserSelect = typeof schema.directus_users.$inferSelect;
type CommitteeSelect = typeof schema.committees.$inferSelect;

const TOGGLEABLE_FEATURES: Record<string, AdminFeature | undefined> = {
    '/reis': 'reis',
    '/kroegentocht': 'kroegentocht',
    '/webshop': 'webshop',
    '/intro': 'intro',
};

export interface StronglyTypedAdminUser extends DirectusUserSelect {
    committees: CommitteeSelect[];
}

const getCachedUserEnrichment = (userId: string) => unstable_cache(
    async () => {
        const [metadata, committees] = await Promise.all([
            fetchUserMetadataDb(userId),
            fetchUserCommitteesDb(userId)
        ]);
        return { 
            metadata: metadata as DirectusUserSelect | null, 
            committees: committees as CommitteeSelect[] | null
        };
    },
    ['user-enrichment-v1', userId],
    { revalidate: 10, tags: ['user-enrichment'] }
)();

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

        let isAuthorized = isIct || isBoard || isKandi || currentCommittees.length > 0;

        // Resolve impersonation info from session first (most reliable), fall back to cookie if needed.
        let impersonationInfo: ImpersonationInfo | null = null;
        const extendedSession = session as unknown as ExtendedSession | null;

        if (extendedSession?.impersonatedBy) {
            impersonationInfo = {
                id: extendedSession.impersonatedBy.id,
                name: extendedSession.impersonatedBy.name,
                email: extendedSession.impersonatedBy.email,
                isNormallyAdmin: extendedSession.impersonatedBy.isNormallyAdmin,
                targetName: extendedSession.user.name || extendedSession.user.email,
                targetCommittees: extendedSession.user.committees?.map(c => c.name) || []
            };
        } else {
            const cookieStore = await cookies();
            const testToken = cookieStore.get('directus_test_token')?.value;
            
            if (testToken) {
                const infoCookie = cookieStore.get('impersonation_info')?.value;
                
                if (!infoCookie) {
                    safeConsoleError(`[admin-utils.actions.ts][checkAdminAccess] Test token is present, but impersonation_info cookie is missing.`);
                } else {
                    try {
                        const parsed = JSON.parse(infoCookie) as { adminName?: string; targetName?: string; targetCommittees?: string[] };
                        
                        if (parsed.adminName && parsed.targetName) {
                            impersonationInfo = {
                                id: '',
                                email: '',
                                isNormallyAdmin: true,
                                name: parsed.adminName,
                                targetName: parsed.targetName,
                                targetCommittees: parsed.targetCommittees || []
                            };
                        } else {
                            safeConsoleError(`[admin-utils.actions.ts][checkAdminAccess] Test modus session data is corrupt: missing adminName or targetName.`);
                        }
                    } catch (error) {
                        safeConsoleError(`[admin-utils.actions.ts][checkAdminAccess] Failed to parse impersonation_info cookie`, error);
                    }
                }
            }
        }

        if (impersonationInfo) {
            isAuthorized = true;
        }

        return {
            isAuthorized,
            user,
            isIct,
            impersonation: impersonationInfo
        };
    } catch (error) {
        safeConsoleError(`[admin-utils.actions.ts][checkAdminAccess] Error in checkAdminAccess`, error);
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

    const isIctOrBestuur = user.committees.some(
        c => c.azure_group_id === COMMITTEES.ICT || c.azure_group_id === COMMITTEES.BESTUUR
    );
    const canToggleVisibility = isLeader || isIctOrBestuur;

    return { user, isLeader, canToggleVisibility };
}

export async function toggleFeatureFlag(
    routeMatch: string,
    name: string,
    defaultMessage: string,
    pathsToRevalidate: string[]
) {
    const featureKey = TOGGLEABLE_FEATURES[routeMatch];

    if (featureKey) {
        const { canToggleVisibility } = await enforceFeatureAccess(featureKey);
        if (!canToggleVisibility) {
            throw new Error("Helaas, je kan de zichtbaarheid van deze pagina niet aanpassen.");
        }
    }

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
    let canToggleVisibility = false;
    const featureKey = TOGGLEABLE_FEATURES[routeMatch];

    if (featureKey) {
        try {
            const access = await enforceFeatureAccess(featureKey);
            canToggleVisibility = access.canToggleVisibility;
        } catch {
            canToggleVisibility = false;
        }
    }

    const rows = await db.select({ is_active: schema.feature_flags.is_active, message: schema.feature_flags.message })
        .from(schema.feature_flags)
        .where(eq(schema.feature_flags.route_match, routeMatch))
        .limit(1);

    return rows[0] 
        ? { show: rows[0].is_active, disabled_message: rows[0].message, canToggleVisibility } 
        : { show: true, disabled_message: null, canToggleVisibility };
}

export async function revalidateUserCache() {
    updateTag('user-enrichment');
}

export async function getModuleLayoutContext(routeMatch: string) {
    const flagConfig = await getFeatureFlagSettings(routeMatch);
    return {
        canToggleVisibility: flagConfig.canToggleVisibility
    };
}