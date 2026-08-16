'use server';

import 'server-only';
import { revalidatePath } from 'next/cache';
import { db, schema } from '@salvemundi/db';
import { eq } from 'drizzle-orm';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { hasPermission } from '@/shared/lib/permissions';
import { AdminResource } from '@/shared/lib/permissions-config';
import {
    type IntroGroupWithDetails,
    type IntroGroupMember,
    type IntroGroupMemberWithAttendance,
    type IntroGroupAttendanceStatus,
    introGroupAttendanceStatusEnum
} from '@salvemundi/validations/schema/intro.zod';
import {
    getIntroGroupsForAdminInternal,
    getGroupsByIdsInternal,
    getUserLedGroupIdsInternal,
    getGroupAttendanceForDateInternal,
    getIntroAttendanceVisibleInternal
} from '@/server/queries/intro/admin-intro.queries';
import { safeConsoleError } from '@/server/utils/logger';

export interface IntroAttendanceAccess {
    isCrew: boolean;
    ledGroupIds: number[];
}

export async function getIntroAttendanceAccess(): Promise<IntroAttendanceAccess> {
    const session = await getEnrichedSession();
    if (!session) return { isCrew: false, ledGroupIds: [] };

    const isCrew = hasPermission(session.user.committees, AdminResource.Intro);
    const ledGroupIds = await getUserLedGroupIdsInternal(session.user.id);

    return { isCrew, ledGroupIds };
}

async function assertGroupAccess(groupId: number): Promise<void> {
    const { isCrew, ledGroupIds } = await getIntroAttendanceAccess();
    if (!isCrew && !ledGroupIds.includes(groupId)) {
        throw new Error('Je hebt geen toegang tot dit groepje');
    }
}

export async function getIntroAttendanceVisible(): Promise<boolean> {
    return getIntroAttendanceVisibleInternal();
}

export async function getAttendanceGroupsForUser(): Promise<IntroGroupWithDetails[]> {
    const { isCrew, ledGroupIds } = await getIntroAttendanceAccess();
    if (isCrew) return getIntroGroupsForAdminInternal();
    return getGroupsByIdsInternal(ledGroupIds);
}

export async function getGroupAttendanceForDate(groupId: number, date: string): Promise<IntroGroupMemberWithAttendance[]> {
    await assertGroupAccess(groupId);
    return getGroupAttendanceForDateInternal(groupId, date);
}

export async function addGroupMember(groupId: number, name: string): Promise<{ success: boolean; data?: IntroGroupMember; error?: string }> {
    await assertGroupAccess(groupId);

    const trimmed = name.trim();
    if (!trimmed) {
        return { success: false, error: 'Naam is verplicht' };
    }

    try {
        const session = await getEnrichedSession();
        const inserted = await db.insert(schema.intro_group_members).values({
            intro_group_id: groupId,
            name: trimmed,
            added_by: session?.user.id ?? null
        }).returning();

        revalidatePath('/profiel/intro-attendance');
        const result = inserted[0];
        return {
            success: true,
            data: {
                id: result.id,
                intro_group_id: result.intro_group_id,
                name: result.name,
                added_by: result.added_by,
                created_at: result.created_at
            }
        };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Onbekende fout';
        safeConsoleError('[intro-attendance.actions.ts][addGroupMember] Failed to add member:', error);
        return { success: false, error: `Toevoegen mislukt: ${message}` };
    }
}

export async function removeGroupMember(memberId: number): Promise<{ success: boolean; error?: string }> {
    try {
        const member = await db
            .select({ intro_group_id: schema.intro_group_members.intro_group_id })
            .from(schema.intro_group_members)
            .where(eq(schema.intro_group_members.id, memberId))
            .limit(1);

        if (member.length === 0) {
            return { success: false, error: 'Lid niet gevonden' };
        }

        await assertGroupAccess(member[0].intro_group_id);

        await db.delete(schema.intro_group_members).where(eq(schema.intro_group_members.id, memberId));
        revalidatePath('/profiel/intro-attendance');
        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Verwijderen mislukt';
        safeConsoleError('[intro-attendance.actions.ts][removeGroupMember] Failed to remove member:', error);
        return { success: false, error: message };
    }
}

async function getMemberGroupId(memberId: number): Promise<number | null> {
    const rows = await db
        .select({ intro_group_id: schema.intro_group_members.intro_group_id })
        .from(schema.intro_group_members)
        .where(eq(schema.intro_group_members.id, memberId))
        .limit(1);
    return rows[0]?.intro_group_id ?? null;
}

export async function markMemberPresent(memberId: number, date: string, present: boolean): Promise<{ success: boolean; error?: string }> {
    try {
        const groupId = await getMemberGroupId(memberId);
        if (groupId === null) return { success: false, error: 'Lid niet gevonden' };
        await assertGroupAccess(groupId);

        const session = await getEnrichedSession();
        const userId = session?.user.id ?? null;

        await db.insert(schema.intro_group_attendance)
            .values({
                intro_group_member_id: memberId,
                date,
                present,
                present_at: new Date().toISOString(),
                present_by: userId
            })
            .onConflictDoUpdate({
                target: [schema.intro_group_attendance.intro_group_member_id, schema.intro_group_attendance.date],
                set: {
                    present,
                    present_at: new Date().toISOString(),
                    present_by: userId,
                    updated_at: new Date().toISOString()
                }
            });

        revalidatePath('/profiel/intro-attendance');
        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Bijwerken mislukt';
        safeConsoleError('[intro-attendance.actions.ts][markMemberPresent] Failed:', error);
        return { success: false, error: message };
    }
}

export async function setMemberEveningStatus(memberId: number, date: string, status: IntroGroupAttendanceStatus): Promise<{ success: boolean; error?: string }> {
    const validated = introGroupAttendanceStatusEnum.safeParse(status);
    if (!validated.success) {
        return { success: false, error: 'Ongeldige status' };
    }

    try {
        const groupId = await getMemberGroupId(memberId);
        if (groupId === null) return { success: false, error: 'Lid niet gevonden' };
        await assertGroupAccess(groupId);

        const session = await getEnrichedSession();
        const userId = session?.user.id ?? null;

        await db.insert(schema.intro_group_attendance)
            .values({
                intro_group_member_id: memberId,
                date,
                evening_status: validated.data,
                evening_status_at: new Date().toISOString(),
                evening_status_by: userId
            })
            .onConflictDoUpdate({
                target: [schema.intro_group_attendance.intro_group_member_id, schema.intro_group_attendance.date],
                set: {
                    evening_status: validated.data,
                    evening_status_at: new Date().toISOString(),
                    evening_status_by: userId,
                    updated_at: new Date().toISOString()
                }
            });

        revalidatePath('/profiel/intro-attendance');
        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Bijwerken mislukt';
        safeConsoleError('[intro-attendance.actions.ts][setMemberEveningStatus] Failed:', error);
        return { success: false, error: message };
    }
}
