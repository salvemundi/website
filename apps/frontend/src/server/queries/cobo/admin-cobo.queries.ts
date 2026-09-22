import 'server-only';

import { db, schema } from '@salvemundi/db';
import { eq, asc, desc } from 'drizzle-orm';
import { safeConsoleError } from '@/server/utils/logger';
import {
    coboEventSchema,
    coboGuestBoardSchema,
    type CoboEvent,
    type CoboBoardPreference,
    type CoboGuestBoard
} from '@salvemundi/validations';

export async function getCoboEventsDb(): Promise<CoboEvent[]> {
    try {
        const rows = await db.query.cobo.findMany({
            orderBy: [desc(schema.cobo.id)]
        });
        return rows.map(r => coboEventSchema.parse(r));
    } catch (error) {
        safeConsoleError('[admin-cobo.queries.ts][getCoboEventsDb] Failed to fetch cobo events:', error);
        return [];
    }
}

export async function getLatestActiveCoboDb(): Promise<CoboEvent | null> {
    try {
        const row = await db.query.cobo.findFirst({
            orderBy: [desc(schema.cobo.id)]
        });
        return row ? coboEventSchema.parse(row) : null;
    } catch (error) {
        safeConsoleError('[admin-cobo.queries.ts][getLatestActiveCoboDb] Failed to fetch latest cobo:', error);
        return null;
    }
}

export async function getCoboEventByIdDb(id: number): Promise<CoboEvent | null> {
    try {
        const row = await db.query.cobo.findFirst({
            where: eq(schema.cobo.id, id)
        });
        return row ? coboEventSchema.parse(row) : null;
    } catch (error) {
        safeConsoleError(`[admin-cobo.queries.ts][getCoboEventByIdDb] Failed for id ${id}:`, error);
        return null;
    }
}

import { getCommitteeBySlug } from '@/server/actions/public/committees.actions';

export async function getActiveBoardMembersDb(coboId: number): Promise<CoboBoardPreference[]> {
    try {
        const committee = await getCommitteeBySlug('bestuur');

        const existingPreferences = await db.query.cobo_board_preferences.findMany({
            where: eq(schema.cobo_board_preferences.cobo_id, coboId)
        });

        const prefMap = new Map(existingPreferences.map(p => [p.user_id, p]));

        if (committee && committee.members && committee.members.length > 0) {
            const visibleMembers = committee.members.filter(m => m.is_visible);
            const sortedMembers = [...visibleMembers].sort((a, b) => {
                if (a.is_leader && !b.is_leader) return -1;
                if (!a.is_leader && b.is_leader) return 1;
                return 0;
            });

            return sortedMembers.map(m => {
                const userId = m.user_id?.id || '';
                const pref = userId ? prefMap.get(userId) : undefined;
                const userFunctie = m.user_id?.title || (m.is_leader ? 'Voorzitter' : 'Bestuurslid');

                return {
                    id: pref?.id ?? 0,
                    cobo_id: coboId,
                    user_id: userId,
                    drinks_alcohol: pref?.drinks_alcohol ?? true,
                    vetoes: pref?.vetoes ?? '',
                    dietary_requirements: pref?.dietary_requirements ?? '',
                    notes: pref?.notes ?? '',
                    date_created: pref?.date_created ?? new Date().toISOString(),
                    date_updated: pref?.date_updated ?? new Date().toISOString(),
                    user: {
                        id: userId,
                        first_name: m.user_id?.first_name || 'Bestuurslid',
                        last_name: m.user_id?.last_name || '',
                        avatar: m.user_id?.avatar || null,
                        functie: userFunctie
                    }
                };
            });
        }

        // Fallback: Als er geen bestuur commissie is, probeer de Board tabel
        const latestBoard = await db.query.Board.findFirst({
            orderBy: [desc(schema.Board.id)],
            with: {
                Board_Members: {
                    with: {
                        directus_user: {
                            columns: {
                                id: true,
                                first_name: true,
                                last_name: true,
                                avatar: true
                            }
                        }
                    }
                }
            }
        });

        if (!latestBoard || latestBoard.Board_Members.length === 0) {
            return [];
        }

        return latestBoard.Board_Members.map(member => {
            const userId = member.user_id || (member.directus_user ? member.directus_user.id : '');
            const pref = userId ? prefMap.get(userId) : undefined;

            return {
                id: pref?.id ?? 0,
                cobo_id: coboId,
                user_id: userId,
                drinks_alcohol: pref?.drinks_alcohol ?? true,
                vetoes: pref?.vetoes ?? '',
                dietary_requirements: pref?.dietary_requirements ?? '',
                notes: pref?.notes ?? '',
                date_created: pref?.date_created ?? new Date().toISOString(),
                date_updated: pref?.date_updated ?? new Date().toISOString(),
                user: {
                    id: userId,
                    first_name: member.directus_user?.first_name || member.name || '',
                    last_name: member.directus_user?.last_name || '',
                    avatar: member.directus_user?.avatar || null,
                    functie: member.functie || 'Bestuurslid'
                }
            };
        });
    } catch (error) {
        safeConsoleError(`[admin-cobo.queries.ts][getActiveBoardMembersDb] Failed for coboId ${coboId}:`, error);
        return [];
    }
}

/**
 * Haalt alle gastbesturen op voor een CoBo, gesorteerd op positie.
 */
export async function getCoboGuestBoardsDb(coboId: number): Promise<CoboGuestBoard[]> {
    try {
        const rows = await db.query.cobo_guest_boards.findMany({
            where: eq(schema.cobo_guest_boards.cobo_id, coboId),
            orderBy: [asc(schema.cobo_guest_boards.position), asc(schema.cobo_guest_boards.id)]
        });
        return rows.map(r => coboGuestBoardSchema.parse(r));
    } catch (error) {
        safeConsoleError(`[admin-cobo.queries.ts][getCoboGuestBoardsDb] Failed for coboId ${coboId}:`, error);
        return [];
    }
}
