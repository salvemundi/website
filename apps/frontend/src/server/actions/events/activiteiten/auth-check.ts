'use server';

import { getPermissions } from "@/shared/lib/permissions";
import { fetchUserCommitteesDb } from "@/server/internal/user-db.utils";
import { type EnrichedUser } from "@/types/auth";
import { getEnrichedSession } from "@/server/auth/auth-utils";
import { db, schema } from "@salvemundi/db";
import { eq } from "drizzle-orm";
import { COMMITTEES } from "@/shared/lib/permissions-config";
import { safeConsoleError } from '@/server/utils/logger';

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
        safeConsoleError('[auth-check.ts][getAuthorizedUser] ', error);
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

    const rows = await db.select({ committee_id: schema.events.committee_id })
        .from(schema.events)
        .where(eq(schema.events.id, Number(eventId)))
        .limit(1);
    const activityCommitteeId = rows[0]?.committee_id;
    const userCommitteeIds = userCommittees.map(c => Number(c.id));

    if (!userCommitteeIds.includes(Number(activityCommitteeId))) {
        throw new Error("Unauthorized: Je mag alleen activiteiten van je eigen commissie beheren.");
    }

    return user;
}