'use server';

import { getPermissions } from "@/shared/lib/permissions";
import { fetchUserCommitteesDb } from "@/server/internal/user-db.utils";
import { type EnrichedUser } from "@/types/auth";
import { getEnrichedSession } from "@/server/auth/auth-utils";
import { query as dbQuery } from "@/lib/database";
import { COMMITTEES } from "@/shared/lib/permissions-config";
import { safeConsoleError } from '@/server/utils/logger';

interface EventCommitteeRow {
    committee_id: number | null;
}

interface UserCommittee {
    id: number | string;
    azure_group_id?: string | null;
}

export async function getAuthorizedUser() {
    const session = await getEnrichedSession();

    if (!session?.user) return null;

    const user = session.user as unknown as EnrichedUser;

    let committees: Awaited<ReturnType<typeof fetchUserCommitteesDb>> = [];
    try {
        committees = await fetchUserCommitteesDb(user.id);
    } catch (error) {
        safeConsoleError('[action][getAuthorizedUser]', error);
    }

    const permissions = getPermissions(committees);

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

export async function verifyActivityBOLA(eventId: number | string) {
    const user = await getAuthorizedUser();
    if (!user) throw new Error("Unauthorized");

    const userCommittees = user.committees as UserCommittee[];
    const isSuperAdmin = user.isICT || userCommittees.some(c => c.azure_group_id === COMMITTEES.BESTUUR);
    if (isSuperAdmin) return user;

    const activityRes = await dbQuery("SELECT committee_id FROM events WHERE id = $1", [eventId]);
    const rows = activityRes.rows as EventCommitteeRow[];
    const activityCommitteeId = rows[0]?.committee_id;
    const userCommitteeIds = userCommittees.map(c => Number(c.id));

    if (!userCommitteeIds.includes(Number(activityCommitteeId))) {
        throw new Error("Unauthorized: Je mag alleen activiteiten van je eigen commissie beheren.");
    }

    return user;
}