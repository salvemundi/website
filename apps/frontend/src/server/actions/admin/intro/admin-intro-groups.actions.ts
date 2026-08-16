'use server';

import { z } from 'zod';

import 'server-only';
import { revalidatePath } from "next/cache";
import {
    introGroupFormSchema,
    type IntroGroup,
    type IntroGroupWithDetails
} from '@salvemundi/validations/schema/intro.zod';
import {
    getIntroGroupsForAdminInternal,
    getApprovedOudersInternal
} from '@/server/queries/intro/admin-intro.queries';
import { db, schema } from '@salvemundi/db';
import { and, eq } from 'drizzle-orm';
import { checkIntroAdminAccess } from './admin-intro-signup.actions';
import { safeConsoleError } from '@/server/utils/logger';

export async function getIntroGroupsForAdmin(): Promise<IntroGroupWithDetails[]> {
    await checkIntroAdminAccess();
    return getIntroGroupsForAdminInternal();
}

export async function getApprovedOudersForPicker(): Promise<{ user_id: string; first_name: string; last_name: string; email: string }[]> {
    await checkIntroAdminAccess();
    return getApprovedOudersInternal();
}

export async function createGroup(data: Partial<IntroGroup>): Promise<{ success: boolean; data?: IntroGroup; error?: string; fieldErrors?: Record<string, string[] | undefined> }> {
    const user = await checkIntroAdminAccess();

    const validated = introGroupFormSchema.safeParse(data);
    if (!validated.success) {
        const fieldErrors = z.flattenError(validated.error).fieldErrors;
        return {
            success: false,
            error: `Validatie mislukt: ${Object.keys(fieldErrors).join(', ')}`,
            fieldErrors
        };
    }

    try {
        const inserted = await db.insert(schema.intro_groups).values({
            name: validated.data.name,
            notes: validated.data.notes ?? null,
            user_created: user.id
        }).returning();

        revalidatePath('/beheer/intro');
        const result = inserted[0];
        return {
            success: true,
            data: {
                id: result.id,
                name: result.name,
                notes: result.notes,
                user_created: result.user_created,
                created_at: result.created_at,
                updated_at: result.updated_at
            }
        };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Onbekende fout';
        safeConsoleError('[admin-intro-groups.actions.ts][createGroup] Failed to create group:', error);
        return { success: false, error: `Aanmaken mislukt: ${message}` };
    }
}

export async function updateGroup(id: number, data: Partial<IntroGroup>): Promise<{ success: boolean; error?: string; fieldErrors?: Record<string, string[] | undefined> }> {
    await checkIntroAdminAccess();

    const validated = introGroupFormSchema.partial().safeParse(data);
    if (!validated.success) {
        const fieldErrors = z.flattenError(validated.error).fieldErrors;
        return {
            success: false,
            error: `Validatie mislukt: ${Object.keys(fieldErrors).join(', ')}`,
            fieldErrors
        };
    }

    try {
        await db.update(schema.intro_groups)
            .set({ ...validated.data, updated_at: new Date().toISOString() })
            .where(eq(schema.intro_groups.id, id));
        revalidatePath('/beheer/intro');
        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Onbekende fout';
        safeConsoleError('[admin-intro-groups.actions.ts][updateGroup] Failed to update group:', error);
        return { success: false, error: `Bijwerken mislukt: ${message}` };
    }
}

export async function deleteGroup(id: number): Promise<{ success: boolean; error?: string }> {
    await checkIntroAdminAccess();
    try {
        await db.delete(schema.intro_groups).where(eq(schema.intro_groups.id, id));
        revalidatePath('/beheer/intro');
        revalidatePath('/profiel/intro-attendance');
        return { success: true };
    } catch {
        return { success: false, error: 'Verwijderen mislukt' };
    }
}

export async function addGroupLeader(groupId: number, userId: string): Promise<{ success: boolean; error?: string }> {
    await checkIntroAdminAccess();
    try {
        // An ouder leads at most one groepje, so check for an existing assignment
        // elsewhere first and return a clear error instead of relying only on the
        // DB unique constraint to reject it silently.
        const existing = await db
            .select({ intro_group_id: schema.intro_group_leaders.intro_group_id })
            .from(schema.intro_group_leaders)
            .where(eq(schema.intro_group_leaders.user_id, userId))
            .limit(1);

        if (existing.length > 0 && existing[0].intro_group_id !== groupId) {
            return { success: false, error: 'Deze ouder is al gekoppeld aan een ander groepje' };
        }

        await db.insert(schema.intro_group_leaders)
            .values({ intro_group_id: groupId, user_id: userId })
            .onConflictDoNothing();
        revalidatePath('/beheer/intro');
        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Onbekende fout';
        safeConsoleError('[admin-intro-groups.actions.ts][addGroupLeader] Failed to add leader:', error);
        return { success: false, error: `Toevoegen mislukt: ${message}` };
    }
}

export async function removeGroupLeader(groupId: number, userId: string): Promise<{ success: boolean; error?: string }> {
    await checkIntroAdminAccess();
    try {
        await db.delete(schema.intro_group_leaders)
            .where(and(
                eq(schema.intro_group_leaders.intro_group_id, groupId),
                eq(schema.intro_group_leaders.user_id, userId)
            ));
        revalidatePath('/beheer/intro');
        return { success: true };
    } catch {
        return { success: false, error: 'Verwijderen mislukt' };
    }
}
