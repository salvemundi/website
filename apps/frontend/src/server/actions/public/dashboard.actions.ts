'use server';

import { z } from "zod";

import { db, schema } from "@salvemundi/db";
import { isNotNull, eq, desc, sql } from "drizzle-orm";
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
} from "@/server/queries/dashboard/admin-dashboard.queries";
import { getPermissions } from '@/shared/lib/permissions';
import { checkAdminAccess } from "@/server/actions/admin/admin-utils.actions";
import { safeConsoleError } from '@/server/utils/logger';





export async function getDashboardPermissions(): Promise<string[]> {
    const { isAuthorized, user } = await checkAdminAccess();

    if (!isAuthorized || !user) {
        return [];
    }
    
    return getPermissions(user.committees);
}

export async function getDashboardStats(): Promise<DashboardStats> {
    const { isAuthorized } = await checkAdminAccess();
    if (!isAuthorized) throw new Error("Geen toegang");

    return await getDashboardStatsInternal();
}

export async function getUpcomingBirthdays(): Promise<Birthday[]> {
    const { isAuthorized } = await checkAdminAccess();
    if (!isAuthorized) return [];
    try {
        const users = await db.query.directus_users.findMany({
            where: isNotNull(schema.directus_users.date_of_birth),
            columns: {
                id: true,
                first_name: true,
                last_name: true,
                date_of_birth: true
            }
        });

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
    } catch (error: unknown) {
        safeConsoleError(`[dashboard.actions.ts][getUpcomingBirthdays] Error while fetching birthdays:`, error);
        return [];
    }
}

export async function getRecentActivities(): Promise<RecentActivity[]> {
    const { isAuthorized } = await checkAdminAccess();
    if (!isAuthorized) return [];

    return await getRecentActivitiesInternal();
}

export async function getTopStickers(): Promise<TopSticker[]> {
    const { isAuthorized } = await checkAdminAccess();
    if (!isAuthorized) return [];
    try {
        const rows = await db.select({
            id: schema.directus_users.id,
            first_name: schema.directus_users.first_name,
            last_name: schema.directus_users.last_name,
            count: sql<number>`COUNT(${schema.Stickers.id})`
        })
        .from(schema.Stickers)
        .innerJoin(schema.directus_users, eq(schema.Stickers.user_created, schema.directus_users.id))
        .groupBy(schema.directus_users.id, schema.directus_users.first_name, schema.directus_users.last_name)
        .orderBy(desc(sql`COUNT(${schema.Stickers.id})`))
        .limit(3);

        const result = rows.map(r => ({
            id: String(r.id),
            first_name: r.first_name || 'Onbekend',
            last_name: r.last_name || '',
            count: Number(r.count)
        }));
        return z.array(TopStickerSchema).parse(result);
    } catch (error: unknown) {
        safeConsoleError(`[dashboard.actions.ts][getTopStickers] Error while fetching top stickers:`, error);
        return [];
    }
}