'use server';

import 'server-only';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { fetchUserCommitteesDb } from '@/server/internal/leden/leden-db.utils';
import { COMMITTEES } from '@/shared/lib/permissions-config';
import {
    getDefaultWrappedYear,
    getSamuWrappedStatsInternal,
    isSamuWrappedEnabledInternal
} from '@/server/queries/wrapped/samu-wrapped.queries';
import { type SamuWrappedResult } from '@/lib/wrapped/samu-wrapped.types';
import { safeConsoleError } from '@/server/utils/logger';

/**
 * Wrapped is zichtbaar als de feature flag `samu_wrapped` actief is.
 * ICT kan het altijd bekijken om het vooraf te testen.
 */
export async function getSamuWrappedVisible(): Promise<boolean> {
    try {
        const session = await getEnrichedSession();
        if (!session?.user) return false;
        if (await isSamuWrappedEnabledInternal()) return true;

        const committees = await fetchUserCommitteesDb(session.user.id);
        return committees.some((c) => c.azure_group_id === COMMITTEES.ICT);
    } catch (error) {
        safeConsoleError('[samu-wrapped.actions.ts][getSamuWrappedVisible] failed:', error);
        return false;
    }
}

export async function getMySamuWrapped(year?: number): Promise<SamuWrappedResult> {
    const session = await getEnrichedSession();
    const user = session?.user;
    if (!user?.id || !user.email) return { status: 'unavailable' };

    if (!(await getSamuWrappedVisible())) return { status: 'unavailable' };

    const currentYear = new Date().getFullYear();
    const targetYear = year && Number.isInteger(year) && year >= 2020 && year <= currentYear
        ? year
        : getDefaultWrappedYear();

    try {
        // Fallback als first_name in de database leeg is; sessienamen kunnen de vorm "voornaam.achternaam" hebben
        const fromSession = user.name.trim().split(/[\s.@]/)[0] ?? '';
        const firstName = fromSession ? fromSession.charAt(0).toUpperCase() + fromSession.slice(1) : 'Samu\'er';
        const stats = await getSamuWrappedStatsInternal({ id: user.id, email: user.email, firstName }, targetYear);
        return { status: 'ok', stats };
    } catch (error) {
        safeConsoleError('[samu-wrapped.actions.ts][getMySamuWrapped] failed:', error);
        return { status: 'unavailable' };
    }
}
