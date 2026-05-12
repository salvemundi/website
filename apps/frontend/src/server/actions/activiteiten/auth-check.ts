'use server';

import { getPermissions } from "@/shared/lib/permissions";
import { fetchUserCommitteesDb } from "../user-db.utils";
import { type EnrichedUser } from "@/types/auth";
import { getEnrichedSession } from "@/server/auth/auth-utils";

export async function getAuthorizedUser() {
    const session = await getEnrichedSession();

    if (!session || !session.user) return null;

    const user = session.user as unknown as EnrichedUser;
    
    // Fetch committees to ensure we have the latest permissions
    const committees = await fetchUserCommitteesDb(user.id).catch(() => []);
    const permissions = getPermissions(committees || []);
    
    return {
        ...user,
        committees,
        ...permissions
    };
}

export async function ensureActivitiesView() {
    const user = await getAuthorizedUser();
    if (!user || !user.canAccessActivitiesView) {
        throw new Error("Unauthorized: Je hebt geen rechten om activiteiten te bekijken.");
    }
    return user;
}

export async function ensureActivitiesEdit() {
    const user = await getAuthorizedUser();
    if (!user || !user.canAccessActivitiesEdit) {
        throw new Error("Unauthorized: Alleen commissieleiders en beheer mogen activiteiten aanpassen.");
    }
    return user;
}

import { query as dbQuery } from "@/lib/database";
import { COMMITTEES } from "@/shared/lib/permissions-config";

export async function verifyActivityBOLA(eventId: number | string) {
    const user = await getAuthorizedUser();
    if (!user) throw new Error("Unauthorized");

    // ICT and Bestuur are superadmins for BOLA purposes
    const isSuperAdmin = user.isICT || user.committees?.some(c => c.azure_group_id === COMMITTEES.BESTUUR);
    if (isSuperAdmin) return user;

    // Granular check: Does the user belong to the committee that owns this event?
    const activityRes = await dbQuery("SELECT committee_id FROM events WHERE id = $1", [eventId]);
    const activityCommitteeId = activityRes.rows[0]?.committee_id;
    const userCommitteeIds = user.committees?.map(c => Number(c.id)) || [];

    if (!userCommitteeIds.includes(Number(activityCommitteeId))) {
        throw new Error("Unauthorized: Je mag alleen activiteiten van je eigen commissie beheren.");
    }

    return user;
}
