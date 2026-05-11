'use server';

import { z } from "zod";
import { getSystemDirectus } from "@/lib/directus";
import { readUsers } from "@directus/sdk";
import { type DbDirectusUser as DirectusUser } from "@salvemundi/validations/directus/schema";
import { query } from "@/lib/database";
import { USER_BASIC_FIELDS } from "@salvemundi/validations/directus/fields";
import {
    type DashboardStats,
    type Birthday,
    BirthdaySchema,
    type RecentActivity,
    type TopSticker,
    TopStickerSchema
} from "@salvemundi/validations/schema/admin-dashboard.zod";
import {
    getDashboardStatsInternal,
    getRecentActivitiesInternal
} from "@/server/queries/admin-dashboard.queries";
import { getPermissions, type UserPermissions } from '@/shared/lib/permissions';
import { checkAdminAccess } from "./admin-utils.actions";

/**
 * Haalt de specifieke permissies op voor de huidige gebruiker t.b.v. het admin dashboard.
 */
export async function getDashboardPermissions(): Promise<UserPermissions & { isIct: boolean }> {
    const { isAuthorized, user, isIct } = await checkAdminAccess();

    if (!isAuthorized || !user) {
        return {
            canAccessIntro: false,
            canAccessReis: false,
            canAccessLogging: false,
            canAccessSync: false,
            canAccessCoupons: false,
            canAccessPermissions: false,
            canAccessStickers: false,
            canAccessKroegentocht: false,
            canAccessMembers: false,
            canAccessCommittees: false,
            canAccessActivitiesView: false,
            canAccessActivitiesEdit: false,
            canAccessMail: false,
            isLeader: false,
            isICT: false,
            isAdmin: false,
            isIct: false
        };
    }

    const perms = getPermissions(user.committees || []);

    return {
        ...perms,
        isAdmin: !!user.isAdmin || perms.isAdmin,
        isIct
    };
}

/**
 * Haalt globale statistieken op voor de dashboard widgets.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
    const { isAuthorized } = await checkAdminAccess();
    if (!isAuthorized) throw new Error("Geen toegang");

    return await getDashboardStatsInternal();
}

/**
 * Haalt de eerstvolgende verjaardagen van leden op.
 */
export async function getUpcomingBirthdays(): Promise<Birthday[]> {
    const { isAuthorized } = await checkAdminAccess();
    if (!isAuthorized) return [];
    try {
        const users = await getSystemDirectus().request(readUsers({
            fields: [...USER_BASIC_FIELDS, 'date_of_birth' as keyof DirectusUser],
            filter: { date_of_birth: { _nnull: true } },
            limit: -1
        }));
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingItems = users
            .map(user => {
                if (!user.date_of_birth) return null;
                const dob = new Date(user.date_of_birth);
                if (isNaN(dob.getTime())) return null;

                const nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
                if (nextBirthday.getTime() < today.getTime()) {
                    nextBirthday.setFullYear(today.getFullYear() + 1);
                }
                return {
                    id: user.id,
                    first_name: user.first_name || 'Onbekend',
                    last_name: user.last_name || '',
                    birthday: user.date_of_birth,
                    nextBirthday,
                    isToday: nextBirthday.getTime() === today.getTime()
                };
            })
            .filter((u): u is NonNullable<typeof u> => u !== null)
            .sort((a, b) => a.nextBirthday.getTime() - b.nextBirthday.getTime());

        const result = upcomingItems.slice(0, 5).map(u => ({
            id: u.id,
            first_name: u.first_name,
            last_name: u.last_name,
            birthday: u.birthday,
            isToday: u.isToday
        }));

        return z.array(BirthdaySchema).parse(result);
    } catch {
        return [];
    }
}

/**
 * Haalt recente systeemactiviteiten op (logs).
 */
export async function getRecentActivities(): Promise<RecentActivity[]> {
    const { isAuthorized } = await checkAdminAccess();
    if (!isAuthorized) return [];

    return await getRecentActivitiesInternal();
}

/**
 * Haalt de top sticker-plakkers op.
 */
export async function getTopStickers(): Promise<TopSticker[]> {
    const { isAuthorized } = await checkAdminAccess();
    if (!isAuthorized) return [];
    try {
        const sql = `
            SELECT 
                u.id, 
                u.first_name, 
                u.last_name, 
                COUNT(s.id) as count
            FROM "Stickers" s
            JOIN directus_users u ON s.user_created = u.id
            GROUP BY u.id, u.first_name, u.last_name
            ORDER BY count DESC
            LIMIT 3
        `;
        const { rows } = await query(sql);

        const result = rows.map(r => ({
            id: String(r.id),
            first_name: r.first_name || 'Onbekend',
            last_name: r.last_name || '',
            count: Number(r.count)
        }));
        return z.array(TopStickerSchema).parse(result);
    } catch {
        return [];
    }
}
