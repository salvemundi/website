import { auth } from "./auth";
import { headers } from "next/headers";
import { hasPermission } from "@/shared/lib/permissions";
import { AdminResource } from "@/shared/lib/permissions-config";
import { type Session } from "better-auth";
import { type EnrichedUser } from "@/types/auth";

/**
 * Server-only authorization utility for Salve Mundi.
 * Uses the session-enriched committees from the Redis plugin.
 */

export async function requireAdminResource(resource: AdminResource) {
    const session = await getEnrichedSession();

    if (!session || !session.user) {
        throw new Error('Niet ingelogd');
    }

    const user = session.user;
    
    // De Redis-session plugin injecteert de committees al in het user object.
    // Dit is de meest betrouwbare en snelste bron van waarheid.
    let committees = user.committees;

    // Fallback: Als ze om een of andere reden niet in de sessie zitten (bijv. cache miss),
    // halen we ze handmatig op via de 'Db' variant die geen extra Zod-stripping doet.
    if (!committees || !Array.isArray(committees)) {
        const { fetchUserCommitteesDb } = await import("../actions/user-db.utils");
        committees = await fetchUserCommitteesDb(user.id);
        // Injecteer ze terug in het object voor de huidige request context
        user.committees = committees;
    }

    if (!hasPermission(committees, resource)) {
        const resourceName = resource.replace('admin:', '');
        throw new Error(`Forbidden: ${resourceName} Admin rechten vereist.`);
    }

    return user;
}

/**
 * Centralized server-side session fetcher for Salve Mundi.
 * Always provides the mocked request to prevent Better Auth internal crashes.
 */
export async function getEnrichedSession(): Promise<{ user: EnrichedUser; session: Session } | null> {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        }) as any;
        
        // Handle the case where the plugin returns { response: session } (Short-circuit hook)
        if (session && typeof session === 'object' && 'response' in session) {
            return session.response as { user: EnrichedUser; session: Session };
        }
        return session as { user: EnrichedUser; session: Session } | null;
    } catch (_e) {
        // Absolute safety: if the session fetcher crashes (e.g. during logout or header errors), 
        // treat it as an unauthenticated state rather than crashing the whole page.
        return null;
    }
}

/**
 * Shortcut for general administrative access (Bestuur/ICT).
 */
export async function requireSuperAdmin() {
    return requireAdminResource(AdminResource.Intro);
}
