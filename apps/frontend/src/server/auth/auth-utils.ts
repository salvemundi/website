'server-only';

import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/shared/lib/permissions";
import { type AdminResource } from "@/shared/lib/permissions-config";
import { type Session } from "better-auth";
import { type EnrichedUser } from "@/types/auth";
import { safeConsoleError } from '../utils/logger';

export async function requireAdminResource(resource: AdminResource) {
    const session = await getEnrichedSession();

    if (!session) {
        throw new Error('Je bent niet goed ingelogd');
    }

    const user = session.user;
    let committees = user.committees;

    if (!committees || !Array.isArray(committees) || committees.length === 0) {
        const { fetchUserCommitteesDb } = await import("@/server/internal/leden/leden-db.utils");
        committees = await fetchUserCommitteesDb(user.id);
        user.committees = committees;
    }

    if (!hasPermission(committees, resource)) {
        throw new Error(`Helaas, je hebt geen rechten om deze pagina te bekijken.`);
    }

    return user;
}

export async function getEnrichedSession(): Promise<{ user: EnrichedUser; session: Session } | null> {
    try {
        const h = await headers().catch((error) => {
            safeConsoleError('[auth-utils.ts][getEnrichedSession] Header retrieval failed', error);
            return null;
        });

        if (!h) return null;

        const session = await auth.api.getSession({
            headers: h
        });

        if (session && typeof session === 'object' && 'user' in session && 'session' in session) {
            return session as { user: EnrichedUser; session: Session };
        }

        return null;
    } catch (error) {
        const stack = error instanceof Error ? error.stack : new Error().stack;
        const errObj = error as Record<string, unknown>;
        safeConsoleError('[auth-utils.ts][getEnrichedSession] Critical failure', {
            message: error instanceof Error ? error.message : String(error),
            stack,
            cause: errObj.cause,
            body: errObj.body,
            status: errObj.status,
            errorObject: error
        });
        throw error;
    }
}