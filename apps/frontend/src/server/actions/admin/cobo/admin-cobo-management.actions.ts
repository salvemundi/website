'use server';

import { enforceFeatureAccess } from '@/server/actions/admin/admin-utils.actions';
import { db, schema } from '@salvemundi/db';
import { eq, and, sql, inArray, type SQL } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { safeConsoleError } from '@/server/utils/logger';
import {
    createCoboGuestBoardFormSchema,
    updateCoboBoardPreferenceFormSchema
} from '@salvemundi/validations';

/**
 * Maakt een nieuw CoBo-jaar/evenement aan.
 */
export async function createCoboEventAction(data: {
    title: string;
    date?: string;
    location?: string;
    description?: string;
}) {
    await enforceFeatureAccess('cobo');

    try {
        const now = new Date().toISOString();
        const [newEvent] = await db.insert(schema.cobo).values({
            title: data.title,
            date: data.date ? new Date(data.date).toISOString() : null,
            location: data.location || 'Borrelbar Eindhoven',
            description: data.description || null,
            date_created: now,
            date_updated: now
        }).returning();

        revalidatePath('/cobo');
        revalidatePath('/beheer/cobo');

        return { success: true as const, event: newEvent };
    } catch (error) {
        safeConsoleError('[admin-cobo-management.actions.ts][createCoboEventAction] Error:', error);
        return { success: false as const, error: 'Kon nieuw CoBo evenement niet aanmaken.' };
    }
}

/**
 * Werkt een bestaand CoBo evenement bij (algemene tekst, datum, locatie).
 */
export async function updateCoboEventAction(id: number, data: {
    title?: string;
    date?: string;
    location?: string;
    description?: string;
}) {
    await enforceFeatureAccess('cobo');

    try {
        const now = new Date().toISOString();
        await db.update(schema.cobo)
            .set({
                ...(data.title !== undefined && { title: data.title }),
                ...(data.date !== undefined && { date: data.date ? new Date(data.date).toISOString() : null }),
                ...(data.location !== undefined && { location: data.location }),
                ...(data.description !== undefined && { description: data.description }),
                date_updated: now
            })
            .where(eq(schema.cobo.id, id));

        revalidatePath('/cobo');
        revalidatePath('/beheer/cobo');

        return { success: true as const };
    } catch (error) {
        safeConsoleError(`[admin-cobo-management.actions.ts][updateCoboEventAction] Error for id ${id}:`, error);
        return { success: false as const, error: 'Bijwerken van CoBo is mislukt.' };
    }
}

/**
 * Voorkeuren van een bestuurslid opslaan of bijwerken.
 */
export async function updateBoardPreferenceAction(input: {
    cobo_id: number;
    user_id: string;
    drinks_alcohol: boolean;
    vetoes?: string;
    dietary_requirements?: string;
    notes?: string;
}) {
    await enforceFeatureAccess('cobo');

    try {
        const parsed = updateCoboBoardPreferenceFormSchema.parse(input);
        if (!parsed.cobo_id || !parsed.user_id) {
            return { success: false as const, error: 'Ongeldige cobo of gebruiker ID.' };
        }
        const now = new Date().toISOString();

        const existing = await db.query.cobo_board_preferences.findFirst({
            where: and(
                eq(schema.cobo_board_preferences.cobo_id, parsed.cobo_id),
                eq(schema.cobo_board_preferences.user_id, parsed.user_id)
            )
        });

        if (existing) {
            await db.update(schema.cobo_board_preferences)
                .set({
                    drinks_alcohol: parsed.drinks_alcohol,
                    vetoes: parsed.vetoes || null,
                    dietary_requirements: parsed.dietary_requirements || null,
                    notes: parsed.notes || null,
                    date_updated: now
                })
                .where(eq(schema.cobo_board_preferences.id, existing.id));
        } else {
            await db.insert(schema.cobo_board_preferences).values({
                cobo_id: parsed.cobo_id,
                user_id: parsed.user_id,
                drinks_alcohol: parsed.drinks_alcohol,
                vetoes: parsed.vetoes || null,
                dietary_requirements: parsed.dietary_requirements || null,
                notes: parsed.notes || null,
                date_created: now,
                date_updated: now
            });
        }

        revalidatePath('/cobo');
        revalidatePath('/beheer/cobo');

        return { success: true as const };
    } catch (error) {
        safeConsoleError('[admin-cobo-management.actions.ts][updateBoardPreferenceAction] Error:', error);
        return { success: false as const, error: 'Opslaan van bestuurslid voorkeuren mislukt.' };
    }
}

export async function addGuestBoardAction(input: {
    cobo_id: number;
    board_name: string;
    activity_type: string;
    activity_custom?: string;
}) {
    await enforceFeatureAccess('cobo');

    try {
        const parsed = createCoboGuestBoardFormSchema.parse(input);
        if (!parsed.cobo_id) {
            return { success: false as const, error: 'Ongeldig CoBo ID.' };
        }
        const now = new Date().toISOString();

        // Bepaal de hoogste positie
        const lastBoard = await db.query.cobo_guest_boards.findFirst({
            where: eq(schema.cobo_guest_boards.cobo_id, parsed.cobo_id),
            orderBy: [sql`${schema.cobo_guest_boards.position} DESC`]
        });

        const nextPosition = (lastBoard?.position ?? 0) + 1;

        const [created] = await db.insert(schema.cobo_guest_boards).values({
            cobo_id: parsed.cobo_id,
            board_name: parsed.board_name,
            activity_type: parsed.activity_type,
            activity_custom: parsed.activity_custom || null,
            position: nextPosition,
            status: 'waiting',
            date_created: now,
            date_updated: now
        }).returning();

        return { success: true as const, guestBoard: created };
    } catch (error) {
        safeConsoleError('[admin-cobo-management.actions.ts][addGuestBoardAction] Error:', error);
        return { success: false as const, error: 'Toevoegen van gasten is mislukt.' };
    }
}

export async function updateGuestBoardStatusAction(id: number, status: string) {
    await enforceFeatureAccess('cobo');

    try {
        const now = new Date().toISOString();
        await db.update(schema.cobo_guest_boards)
            .set({
                status,
                date_updated: now
            })
            .where(eq(schema.cobo_guest_boards.id, id));

        return { success: true as const };
    } catch (error) {
        safeConsoleError(`[admin-cobo-management.actions.ts][updateGuestBoardStatusAction] Error for id ${id}:`, error);
        return { success: false as const, error: 'Status bijwerken mislukt.' };
    }
}

export async function reorderGuestBoardsAction(coboId: number, orderedIds: number[]) {
    await enforceFeatureAccess('cobo');

    if (orderedIds.length === 0) {
        return { success: true as const };
    }

    try {
        const now = new Date().toISOString();

        const sqlChunks: SQL[] = [sql`CASE `];
        for (let i = 0; i < orderedIds.length; i++) {
            sqlChunks.push(sql`WHEN ${schema.cobo_guest_boards.id} = ${orderedIds[i]} THEN ${i + 1} `);
        }
        sqlChunks.push(sql`ELSE ${schema.cobo_guest_boards.position} END`);
        const finalCaseSql = sql.join(sqlChunks, sql.raw(''));

        await db.update(schema.cobo_guest_boards)
            .set({
                position: finalCaseSql,
                date_updated: now
            })
            .where(and(
                eq(schema.cobo_guest_boards.cobo_id, coboId),
                inArray(schema.cobo_guest_boards.id, orderedIds)
            ));

        return { success: true as const };
    } catch (error) {
        safeConsoleError(`[admin-cobo-management.actions.ts][reorderGuestBoardsAction] Error:`, error);
        return { success: false as const, error: 'Volgorde opslaan is mislukt.' };
    }
}

export async function deleteGuestBoardAction(id: number) {
    await enforceFeatureAccess('cobo');

    try {
        await db.delete(schema.cobo_guest_boards)
            .where(eq(schema.cobo_guest_boards.id, id));

        return { success: true as const };
    } catch (error) {
        safeConsoleError(`[admin-cobo-management.actions.ts][deleteGuestBoardAction] Error for id ${id}:`, error);
        return { success: false as const, error: 'Verwijderen mislukt.' };
    }
}
