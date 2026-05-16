import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/shared/lib/permissions";
import { AdminResource } from "@/shared/lib/permissions-config";
import { type Session } from "better-auth";
import { type EnrichedUser } from "@/types/auth";
import { safeConsoleError } from '../utils/logger';

export async function requireAdminResource(resource: AdminResource) {
    const session = await getEnrichedSession();

    if (!session || !session.user) {
        throw new Error('Niet ingelogd');
    }

    const user = session.user;

    let committees = user.committees;

    if (!committees || !Array.isArray(committees)) {
        const { fetchUserCommitteesDb } = await import("@/server/internal/user-db.utils");
        committees = await fetchUserCommitteesDb(user.id);
        user.committees = committees;
    }

    if (!hasPermission(committees, resource)) {
        const resourceName = resource.replace('admin:', '');
        throw new Error(`Forbidden: ${resourceName} Admin rechten vereist.`);
    }

    return user;
}

export async function getEnrichedSession(): Promise<{ user: EnrichedUser; session: Session } | null> {
    try {
        if (!auth || !auth.api) {
            safeConsoleError('[AuthUtils] Better Auth instance or API is undefined', undefined);
            return null;
        }

        let h;
        try {
            h = await headers();
        } catch (_error) {
            // Expected outside of request context
            return null;
        }

        if (!h) return null;

        const session = await auth.api.getSession({
            headers: h
        }) as any;

        if (session && typeof session === 'object' && 'user' in session && 'session' in session) {
            return session as { user: EnrichedUser; session: Session };
        }

        if (session && typeof session === 'object' && 'response' in session) {
            return session.response as { user: EnrichedUser; session: Session };
        }

        return null;
    } catch (error) {
        const stack = error instanceof Error ? error.stack : new Error().stack;
        safeConsoleError('[AuthUtils][getEnrichedSession] Technical Failure:', {
            message: error instanceof Error ? error.message : String(error),
            stack,
            errorObject: error
        });
        // Propagate technical errors to prevent silent failures and redirect loops
        throw error;
    }
}