import 'server-only';
import { db, schema } from "@salvemundi/db";
import { desc, asc, eq, sql, inArray } from 'drizzle-orm';
import {
    type IntroPlanningItem,
    type IntroConfidant,
    type IntroGroupWithDetails,
    type IntroGroupMemberWithAttendance,
    type IntroGroupAttendanceStatus,
    type IntroGroupMemberNoteWithAuthor,
    type IntroGroupAttendanceLogWithAuthor,
    introPlanningSchema,
    introConfidantSchema
} from '@salvemundi/validations/schema/intro.zod';
import { z } from 'zod';
import { safeConsoleError } from '@/server/utils/logger';

export async function getIntroSignupsInternal() {
    try {
        return await db
            .select()
            .from(schema.intro_signups)
            .orderBy(desc(schema.intro_signups.id))
            .limit(1000);
    } catch (error) {
        safeConsoleError('[admin-intro.queries.ts][getIntroSignupsInternal] failed:', error);
        throw new Error('Kon aanmeldingen niet ophalen');
    }
}

export async function getIntroParentSignupsInternal() {
    try {
        return await db
            .select()
            .from(schema.intro_parent_signups)
            .orderBy(desc(schema.intro_parent_signups.id))
            .limit(1000);
    } catch (error) {
        safeConsoleError('[admin-intro.queries.ts][getIntroParentSignupsInternal] failed:', error);
        throw new Error('Kon ouder-aanmeldingen niet ophalen');
    }
}

export async function getIntroPlanningInternal(): Promise<IntroPlanningItem[]> {
    try {
        const rows = await db
            .select()
            .from(schema.intro_planning)
            .orderBy(asc(schema.intro_planning.date), asc(schema.intro_planning.time_start))
            .limit(200);

        const toStr = (value: unknown): string => {
            if (typeof value === 'string') return value;
            if (value instanceof Date) return value.toISOString().split('T')[0];
            return '';
        };
        const toTimeStr = (value: unknown): string => {
            if (typeof value === 'string') return value;
            if (value instanceof Date) return value.toTimeString().split(' ')[0];
            return '';
        };

        const mapped = rows.map(i => ({
            ...i,
            id: Number(i.id),
            date: toStr(i.date),
            time_start: toTimeStr(i.time_start),
            title: typeof i.title === 'string' ? i.title : '',
            description: typeof i.description === 'string' ? i.description : '',
            is_mandatory: typeof i.is_mandatory === 'string' ? i.is_mandatory : ''
        }));

        const parsed = z.array(introPlanningSchema).safeParse(mapped);
        if (!parsed.success) {
            safeConsoleError('[admin-intro.queries.ts][getIntroPlanningInternal] validation failed:', parsed.error);
            return mapped as IntroPlanningItem[];
        }
        return parsed.data;
    } catch (error) {
        safeConsoleError('[admin-intro.queries.ts][getIntroPlanningInternal] failed:', error);
        throw new Error('Kon planning niet ophalen');
    }
}

export async function getIntroConfidantsInternal(activeOnly = false): Promise<IntroConfidant[]> {
    try {
        const rows = await db
            .select()
            .from(schema.intro_confidants)
            .where(activeOnly ? eq(schema.intro_confidants.is_active, true) : undefined)
            .orderBy(asc(schema.intro_confidants.sort_order), asc(schema.intro_confidants.id))
            .limit(100);

        const mapped = rows.map(i => ({
            ...i,
            id: Number(i.id),
            name: typeof i.name === 'string' ? i.name : '',
            email: i.email ?? null,
            phone_number: i.phone_number ?? null,
            image: i.image ?? null,
            bio: i.bio ?? null,
            sort_order: i.sort_order ?? 0,
            is_active: i.is_active ?? true
        }));

        const parsed = z.array(introConfidantSchema).safeParse(mapped);
        if (!parsed.success) {
            safeConsoleError('[admin-intro.queries.ts][getIntroConfidantsInternal] validation failed:', parsed.error);
            return mapped as IntroConfidant[];
        }
        return parsed.data;
    } catch (error) {
        safeConsoleError('[admin-intro.queries.ts][getIntroConfidantsInternal] failed:', error);
        throw new Error('Kon vertrouwenspersonen niet ophalen');
    }
}

export async function getIntroPlanningImageInternal(): Promise<string | null> {
    try {
        const rows = await db
            .select({ planning_image: schema.intro_settings.planning_image })
            .from(schema.intro_settings)
            .orderBy(asc(schema.intro_settings.id))
            .limit(1);

        return rows[0]?.planning_image ?? null;
    } catch (error) {
        safeConsoleError('[admin-intro.queries.ts][getIntroPlanningImageInternal] failed:', error);
        return null;
    }
}

export async function getIntroInfoBookletInternal(): Promise<string | null> {
    try {
        const rows = await db
            .select({ info_booklet: schema.intro_settings.info_booklet })
            .from(schema.intro_settings)
            .orderBy(asc(schema.intro_settings.id))
            .limit(1);

        return rows[0]?.info_booklet ?? null;
    } catch (error) {
        safeConsoleError('[admin-intro.queries.ts][getIntroInfoBookletInternal] failed:', error);
        return null;
    }
}

export async function getIntroQrScanCountInternal(): Promise<number> {
    try {
        const rows = await db
            .select({ qr_scan_count: schema.intro_settings.qr_scan_count })
            .from(schema.intro_settings)
            .orderBy(asc(schema.intro_settings.id))
            .limit(1);

        return rows[0]?.qr_scan_count ?? 0;
    } catch (error) {
        safeConsoleError('[admin-intro.queries.ts][getIntroQrScanCountInternal] failed:', error);
        return 0;
    }
}

export async function incrementIntroQrScanCountInternal(): Promise<number> {
    try {
        const rows = await db
            .select({ id: schema.intro_settings.id })
            .from(schema.intro_settings)
            .orderBy(asc(schema.intro_settings.id))
            .limit(1);

        if (rows.length > 0) {
            const updated = await db.update(schema.intro_settings)
                .set({ qr_scan_count: sql`${schema.intro_settings.qr_scan_count} + 1` })
                .where(eq(schema.intro_settings.id, rows[0].id))
                .returning({ qr_scan_count: schema.intro_settings.qr_scan_count });
            return updated[0]?.qr_scan_count ?? 0;
        }

        const inserted = await db.insert(schema.intro_settings).values({ qr_scan_count: 1 }).returning({ qr_scan_count: schema.intro_settings.qr_scan_count });
        return inserted[0]?.qr_scan_count ?? 1;
    } catch (error) {
        safeConsoleError('[admin-intro.queries.ts][incrementIntroQrScanCountInternal] failed:', error);
        return 0;
    }
}

export async function getIntroAttendanceVisibleInternal(): Promise<boolean> {
    try {
        const rows = await db
            .select({ attendance_visible: schema.intro_settings.attendance_visible })
            .from(schema.intro_settings)
            .orderBy(asc(schema.intro_settings.id))
            .limit(1);

        return rows[0]?.attendance_visible ?? false;
    } catch (error) {
        safeConsoleError('[admin-intro.queries.ts][getIntroAttendanceVisibleInternal] failed:', error);
        return false;
    }
}

export async function getIntroSignupSettingsInternal(): Promise<{ student_signups_open: boolean; parent_signups_open: boolean }> {
    try {
        const rows = await db
            .select({
                student_signups_open: schema.intro_settings.student_signups_open,
                parent_signups_open: schema.intro_settings.parent_signups_open
            })
            .from(schema.intro_settings)
            .orderBy(asc(schema.intro_settings.id))
            .limit(1);

        return {
            student_signups_open: rows[0]?.student_signups_open ?? false,
            parent_signups_open: rows[0]?.parent_signups_open ?? false
        };
    } catch (error) {
        safeConsoleError('[admin-intro.queries.ts][getIntroSignupSettingsInternal] failed:', error);
        return { student_signups_open: false, parent_signups_open: false };
    }
}


export async function getApprovedOudersInternal(): Promise<{ user_id: string; first_name: string; last_name: string; email: string }[]> {
    try {
        const rows = await db
            .select({
                user_id: schema.intro_parent_signups.user_id,
                first_name: schema.intro_parent_signups.first_name,
                last_name: schema.intro_parent_signups.last_name,
                email: schema.intro_parent_signups.email
            })
            .from(schema.intro_parent_signups)
            .where(eq(schema.intro_parent_signups.approved, true))
            .orderBy(asc(schema.intro_parent_signups.first_name));

        return rows;
    } catch (error) {
        safeConsoleError('[admin-intro.queries.ts][getApprovedOudersInternal] failed:', error);
        return [];
    }
}

export async function getIntroGroupsForAdminInternal(): Promise<IntroGroupWithDetails[]> {
    try {
        const groups = await db
            .select()
            .from(schema.intro_groups)
            .orderBy(asc(schema.intro_groups.name));

        if (groups.length === 0) return [];
        const groupIds = groups.map(g => g.id);

        const leaderRows = await db
            .select({
                group_id: schema.intro_group_leaders.intro_group_id,
                user_id: schema.intro_group_leaders.user_id,
                first_name: schema.intro_parent_signups.first_name,
                last_name: schema.intro_parent_signups.last_name
            })
            .from(schema.intro_group_leaders)
            .leftJoin(schema.intro_parent_signups, eq(schema.intro_parent_signups.user_id, schema.intro_group_leaders.user_id))
            .where(inArray(schema.intro_group_leaders.intro_group_id, groupIds));

        const memberCountRows = await db
            .select({
                group_id: schema.intro_group_members.intro_group_id,
                count: sql<number>`count(*)::int`
            })
            .from(schema.intro_group_members)
            .where(inArray(schema.intro_group_members.intro_group_id, groupIds))
            .groupBy(schema.intro_group_members.intro_group_id);

        const memberCounts = new Map(memberCountRows.map(r => [r.group_id, r.count]));

        return groups.map(g => ({
            id: g.id,
            name: g.name,
            notes: g.notes,
            user_created: g.user_created,
            created_at: g.created_at,
            updated_at: g.updated_at,
            leaders: leaderRows
                .filter(l => l.group_id === g.id)
                .map(l => ({
                    user_id: l.user_id,
                    first_name: l.first_name || '',
                    last_name: l.last_name || ''
                })),
            member_count: memberCounts.get(g.id) ?? 0
        }));
    } catch (error) {
        safeConsoleError('[admin-intro.queries.ts][getIntroGroupsForAdminInternal] failed:', error);
        throw new Error('Kon groepjes niet ophalen');
    }
}

export async function getUserLedGroupIdsInternal(userId: string): Promise<number[]> {
    try {
        const rows = await db
            .select({ group_id: schema.intro_group_leaders.intro_group_id })
            .from(schema.intro_group_leaders)
            .where(eq(schema.intro_group_leaders.user_id, userId));
        return rows.map(r => r.group_id);
    } catch (error) {
        safeConsoleError('[admin-intro.queries.ts][getUserLedGroupIdsInternal] failed:', error);
        return [];
    }
}

export async function getGroupsByIdsInternal(groupIds: number[]): Promise<IntroGroupWithDetails[]> {
    if (groupIds.length === 0) return [];
    try {
        const all = await getIntroGroupsForAdminInternal();
        const idSet = new Set(groupIds);
        return all.filter(g => idSet.has(g.id));
    } catch (error) {
        safeConsoleError('[admin-intro.queries.ts][getGroupsByIdsInternal] failed:', error);
        return [];
    }
}

export async function getGroupAttendanceForDateInternal(groupId: number, date: string): Promise<IntroGroupMemberWithAttendance[]> {
    try {
        const rows = await db
            .select({
                id: schema.intro_group_members.id,
                intro_group_id: schema.intro_group_members.intro_group_id,
                name: schema.intro_group_members.name,
                added_by: schema.intro_group_members.added_by,
                created_at: schema.intro_group_members.created_at,
                attendance_id: schema.intro_group_attendance.id,
                status: schema.intro_group_attendance.status,
                status_at: schema.intro_group_attendance.status_at,
                status_by: schema.intro_group_attendance.status_by,
                attendance_created_at: schema.intro_group_attendance.created_at,
                attendance_updated_at: schema.intro_group_attendance.updated_at
            })
            .from(schema.intro_group_members)
            .leftJoin(
                schema.intro_group_attendance,
                sql`${schema.intro_group_attendance.intro_group_member_id} = ${schema.intro_group_members.id} AND ${schema.intro_group_attendance.date} = ${date}`
            )
            .where(eq(schema.intro_group_members.intro_group_id, groupId))
            .orderBy(asc(schema.intro_group_members.name));

        return rows.map(r => ({
            id: r.id,
            intro_group_id: r.intro_group_id,
            name: r.name,
            added_by: r.added_by,
            created_at: r.created_at,
            attendance: r.attendance_id ? {
                id: r.attendance_id,
                intro_group_member_id: r.id,
                date,
                status: r.status as IntroGroupAttendanceStatus,
                status_at: r.status_at,
                status_by: r.status_by,
                created_at: r.attendance_created_at,
                updated_at: r.attendance_updated_at
            } : null
        }));
    } catch (error) {
        safeConsoleError('[admin-intro.queries.ts][getGroupAttendanceForDateInternal] failed:', error);
        throw new Error('Kon aanwezigheid niet ophalen');
    }
}

const EMPTY_ATTENDANCE_SUMMARY: Record<IntroGroupAttendanceStatus, number> = {
    not_reported: 0,
    present: 0,
    went_home: 0,
    home: 0,
    staying_out: 0
};

export async function getAttendanceSummaryForDateInternal(date: string): Promise<Record<IntroGroupAttendanceStatus, number>> {
    try {
        const statusExpr = sql<string>`coalesce(${schema.intro_group_attendance.status}, 'not_reported')`;

        const rows = await db
            .select({
                status: statusExpr,
                count: sql<number>`count(*)::int`
            })
            .from(schema.intro_group_members)
            .leftJoin(
                schema.intro_group_attendance,
                sql`${schema.intro_group_attendance.intro_group_member_id} = ${schema.intro_group_members.id} AND ${schema.intro_group_attendance.date} = ${date}`
            )
            .groupBy(statusExpr);

        const summary = { ...EMPTY_ATTENDANCE_SUMMARY };
        for (const row of rows) {
            summary[row.status as IntroGroupAttendanceStatus] = row.count;
        }
        return summary;
    } catch (error) {
        safeConsoleError('[admin-intro.queries.ts][getAttendanceSummaryForDateInternal] failed:', error);
        return { ...EMPTY_ATTENDANCE_SUMMARY };
    }
}

export async function getMemberNotesInternal(memberId: number): Promise<IntroGroupMemberNoteWithAuthor[]> {
    try {
        const rows = await db
            .select({
                id: schema.intro_group_member_notes.id,
                intro_group_member_id: schema.intro_group_member_notes.intro_group_member_id,
                note: schema.intro_group_member_notes.note,
                created_by: schema.intro_group_member_notes.created_by,
                created_at: schema.intro_group_member_notes.created_at,
                author_first_name: schema.directus_users.first_name,
                author_last_name: schema.directus_users.last_name
            })
            .from(schema.intro_group_member_notes)
            .leftJoin(schema.directus_users, eq(schema.directus_users.id, schema.intro_group_member_notes.created_by))
            .where(eq(schema.intro_group_member_notes.intro_group_member_id, memberId))
            .orderBy(desc(schema.intro_group_member_notes.created_at));

        return rows.map(r => ({
            id: r.id,
            intro_group_member_id: r.intro_group_member_id,
            note: r.note,
            created_by: r.created_by,
            created_at: r.created_at,
            author_name: r.author_first_name || r.author_last_name
                ? `${r.author_first_name || ''} ${r.author_last_name || ''}`.trim()
                : null
        }));
    } catch (error) {
        safeConsoleError('[admin-intro.queries.ts][getMemberNotesInternal] failed:', error);
        throw new Error('Kon notities niet ophalen');
    }
}

export async function getMemberAttendanceLogInternal(memberId: number, date: string): Promise<IntroGroupAttendanceLogWithAuthor[]> {
    try {
        const rows = await db
            .select({
                id: schema.intro_group_attendance_log.id,
                intro_group_member_id: schema.intro_group_attendance_log.intro_group_member_id,
                date: schema.intro_group_attendance_log.date,
                status: schema.intro_group_attendance_log.status,
                status_at: schema.intro_group_attendance_log.status_at,
                changed_by: schema.intro_group_attendance_log.changed_by,
                changed_at: schema.intro_group_attendance_log.changed_at,
                author_first_name: schema.directus_users.first_name,
                author_last_name: schema.directus_users.last_name
            })
            .from(schema.intro_group_attendance_log)
            .leftJoin(schema.directus_users, eq(schema.directus_users.id, schema.intro_group_attendance_log.changed_by))
            .where(sql`${schema.intro_group_attendance_log.intro_group_member_id} = ${memberId} AND ${schema.intro_group_attendance_log.date} = ${date}`)
            .orderBy(asc(schema.intro_group_attendance_log.changed_at));

        return rows.map(r => ({
            id: r.id,
            intro_group_member_id: r.intro_group_member_id,
            date,
            status: r.status as IntroGroupAttendanceStatus,
            status_at: r.status_at,
            changed_by: r.changed_by,
            changed_at: r.changed_at,
            author_name: r.author_first_name || r.author_last_name
                ? `${r.author_first_name || ''} ${r.author_last_name || ''}`.trim()
                : null
        }));
    } catch (error) {
        safeConsoleError('[admin-intro.queries.ts][getMemberAttendanceLogInternal] failed:', error);
        throw new Error('Kon logboek niet ophalen');
    }
}