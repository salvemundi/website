'use server';

import 'server-only';
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
    type IntroGroupAttendance,
    type IntroGroupMemberNoteWithAuthor,
    type IntroGroupAttendanceLogWithAuthor,
    introGroupAttendanceStatusEnum
} from '@salvemundi/validations/schema/intro.zod';
import {
    getIntroGroupsForAdminInternal,
    getGroupsByIdsInternal,
    getUserLedGroupIdsInternal,
    getGroupAttendanceForDateInternal,
    getAttendanceSummaryForDateInternal,
    getIntroAttendanceVisibleInternal,
    getMemberNotesInternal,
    getMemberAttendanceLogInternal
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

export async function getAttendanceSummaryForDate(date: string): Promise<Record<IntroGroupAttendanceStatus, number>> {
    const { isCrew } = await getIntroAttendanceAccess();
    if (!isCrew) {
        return { not_reported: 0, present: 0, went_home: 0, home: 0, staying_out: 0 };
    }
    return getAttendanceSummaryForDateInternal(date);
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

/**
 * `statusAtIso`: optional full ISO timestamp, built client-side (so the browser's
 * local timezone is respected instead of guessing it server-side). Defaults to now.
 */
export async function setMemberStatus(memberId: number, date: string, status: IntroGroupAttendanceStatus, statusAtIso?: string): Promise<{ success: boolean; error?: string; data?: IntroGroupAttendance }> {
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
        const statusAt = statusAtIso && !Number.isNaN(Date.parse(statusAtIso)) ? statusAtIso : new Date().toISOString();

        const upserted = await db.insert(schema.intro_group_attendance)
            .values({
                intro_group_member_id: memberId,
                date,
                status: validated.data,
                status_at: statusAt,
                status_by: userId
            })
            .onConflictDoUpdate({
                target: [schema.intro_group_attendance.intro_group_member_id, schema.intro_group_attendance.date],
                set: {
                    status: validated.data,
                    status_at: statusAt,
                    status_by: userId,
                    updated_at: new Date().toISOString()
                }
            })
            .returning();

        // Append-only audit trail: every status change (including time corrections)
        // gets its own log row, independent of the single current-state row above.
        await db.insert(schema.intro_group_attendance_log).values({
            intro_group_member_id: memberId,
            date,
            status: validated.data,
            status_at: statusAt,
            changed_by: userId
        });

        const row = upserted[0];
        return {
            success: true,
            data: {
                id: row.id,
                intro_group_member_id: row.intro_group_member_id,
                date,
                status: row.status as IntroGroupAttendanceStatus,
                status_at: row.status_at,
                status_by: row.status_by,
                created_at: row.created_at,
                updated_at: row.updated_at
            }
        };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Bijwerken mislukt';
        safeConsoleError('[intro-attendance.actions.ts][setMemberStatus] Failed:', error);
        return { success: false, error: message };
    }
}

export async function getMemberAttendanceLog(memberId: number, date: string): Promise<IntroGroupAttendanceLogWithAuthor[]> {
    const { isCrew } = await getIntroAttendanceAccess();
    if (!isCrew) return [];
    return getMemberAttendanceLogInternal(memberId, date);
}

export async function getMemberNotes(memberId: number): Promise<IntroGroupMemberNoteWithAuthor[]> {
    const groupId = await getMemberGroupId(memberId);
    if (groupId === null) return [];
    await assertGroupAccess(groupId);
    return getMemberNotesInternal(memberId);
}

export async function addMemberNote(memberId: number, note: string): Promise<{ success: boolean; error?: string }> {
    const trimmed = note.trim();
    if (!trimmed) {
        return { success: false, error: 'Notitie mag niet leeg zijn' };
    }

    try {
        const groupId = await getMemberGroupId(memberId);
        if (groupId === null) return { success: false, error: 'Lid niet gevonden' };
        await assertGroupAccess(groupId);

        const session = await getEnrichedSession();
        await db.insert(schema.intro_group_member_notes).values({
            intro_group_member_id: memberId,
            note: trimmed,
            created_by: session?.user.id ?? null
        });

        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Toevoegen mislukt';
        safeConsoleError('[intro-attendance.actions.ts][addMemberNote] Failed:', error);
        return { success: false, error: message };
    }
}

export async function deleteMemberNote(noteId: number): Promise<{ success: boolean; error?: string }> {
    try {
        const rows = await db
            .select({
                member_id: schema.intro_group_member_notes.intro_group_member_id
            })
            .from(schema.intro_group_member_notes)
            .where(eq(schema.intro_group_member_notes.id, noteId))
            .limit(1);

        if (rows.length === 0) {
            return { success: false, error: 'Notitie niet gevonden' };
        }

        const groupId = await getMemberGroupId(rows[0].member_id);
        if (groupId === null) return { success: false, error: 'Lid niet gevonden' };
        await assertGroupAccess(groupId);

        await db.delete(schema.intro_group_member_notes).where(eq(schema.intro_group_member_notes.id, noteId));
        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Verwijderen mislukt';
        safeConsoleError('[intro-attendance.actions.ts][deleteMemberNote] Failed:', error);
        return { success: false, error: message };
    }
}
