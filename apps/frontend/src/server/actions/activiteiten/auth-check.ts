'use server';

import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { getPermissions } from "@/shared/lib/permissions";
import { fetchUserCommitteesDb } from "../user-db.utils";

import { type EnrichedUser } from "@/types/auth";

export async function getAuthorizedUser() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

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
