'use server';

import { auth } from "@/server/auth/auth";
import { z } from "zod";
import { headers, cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSystemDirectus } from "@/lib/directus";
import { readMe, readItems, readUsers, aggregate } from "@directus/sdk";
import { type DbDirectusUser as DirectusUser } from "@salvemundi/validations/directus/schema";
import {
    USER_BASIC_FIELDS,
    EVENT_FIELDS,
    EVENT_SIGNUP_FIELDS,
    INTRO_SIGNUP_FIELDS,
    COUPON_FIELDS,
    STICKER_FIELDS,
    PUB_CRAWL_EVENT_FIELDS,
    PUB_CRAWL_SIGNUP_FIELDS,
    TRIP_FIELDS,
    TRIP_SIGNUP_FIELDS,
    USER_ID_FIELDS
} from "@salvemundi/validations/directus/fields";
import {
    type DashboardStats,
    DashboardStatsSchema,
    type Birthday,
    BirthdaySchema,
    type RecentActivity,
    RecentActivitySchema,
    type TopSticker,
    TopStickerSchema
} from "@salvemundi/validations/schema/admin-dashboard.zod";
import { 
    getDashboardStatsInternal, 
    getRecentActivitiesInternal 
} from "@/server/queries/admin-dashboard.queries";
import { Pool } from "pg";
import { createDirectus, staticToken, rest } from "@directus/sdk";
import { AdminResource } from '@/shared/lib/permissions-config';
import { getPermissions, hasPermission, type UserPermissions } from '@/shared/lib/permissions';
import { getRedis } from "@/server/auth/redis-client";
import { getComputedCouponStatus } from "@/lib/coupons";
import { fetchUserMetadataDb, fetchUserCommitteesDb } from "./user-db.utils";

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || process.env.INTERNAL_DB_HOST || 'v7-core-db',
    port: 5432,
    database: process.env.DB_NAME,
});

const TEST_TOKEN_COOKIE = 'directus_test_token';
const IMPERSONATION_INFO_COOKIE = 'directus_impersonation_info';

export async function checkAdminAccess() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || !session.user) {
        return { isAuthorized: false, user: null, isIct: false, impersonation: null };
    }

    const user = session.user as any;

    try {
        const [metadata, committees] = await Promise.all([
            fetchUserMetadataDb(user.id),
            fetchUserCommitteesDb(user.id)
        ]);

        if (metadata) {
            user.membership_status = metadata.membership_status;
            user.membership_expiry = metadata.membership_expiry;
            user.minecraft_username = metadata.minecraft_username;
            user.phone_number = metadata.phone_number;
            user.date_of_birth = metadata.date_of_birth;
        }
        if (committees) {
            user.committees = committees;
        }
    } catch (e: any) {
        
    }

    if (!user.name && (user.first_name || user.last_name)) {
        user.name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    const impersonation = (session as any).impersonatedBy || null;

    const isIct = user.isICT || false;
    const isBestuur = user.isAdmin || false;
    const isAuthorized = isIct || isBestuur;

    return {
        isAuthorized,
        user,
        isIct,
        impersonation: impersonation ? {
            ...impersonation,
            committees: user.committees?.map((c: any) => c.name) || []
        } : null
    };
}

export async function getDashboardPermissions() {
    const { isAuthorized, user, isIct } = await checkAdminAccess();
    if (!isAuthorized) return { canAccessIntro: false, canAccessReis: false, canAccessLogging: false, canAccessSync: false, canAccessCoupons: false, canAccessPermissions: false, canAccessStickers: false };

    const permissions = (user as any) as UserPermissions;
    // Removed duplicate isIct declaration

    return {
        canAccessIntro: permissions.canAccessIntro || false,
        canAccessReis: permissions.canAccessReis || false,
        canAccessLogging: permissions.canAccessLogging || false,
        canAccessSync: permissions.canAccessSync || false,
        canAccessCoupons: permissions.canAccessCoupons || false,
        canAccessStickers: permissions.canAccessStickers || false,
        canAccessPermissions: permissions.canAccessPermissions || false,
        canAccessKroegentocht: permissions.canAccessKroegentocht || false,
        canAccessMembers: permissions.canAccessMembers || false,
        canAccessCommittees: permissions.canAccessCommittees || false,
        canAccessMail: isAuthorized,
        isIct
    };
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
        const users = await getSystemDirectus().request(readUsers({
            fields: [...USER_BASIC_FIELDS, 'date_of_birth' as any],
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

export async function getRecentActivities(): Promise<RecentActivity[]> {
    const { isAuthorized } = await checkAdminAccess();
    if (!isAuthorized) return [];
    
    return await getRecentActivitiesInternal();
}

export async function getTopStickers(): Promise<TopSticker[]> {
    const { isAuthorized } = await checkAdminAccess();
    if (!isAuthorized) return [];
    try {
        const stickers = await getSystemDirectus().request(readItems('Stickers' as any, {
            fields: [{ user_created: ['id', 'first_name', 'last_name'] }] as any,
            limit: -1
        }));
        const counts: Record<string, TopSticker> = {};

        (stickers as any[]).forEach((s: any) => {
            const user = s.user_created;
            if (user && (user as any).id) {
                const userId = (user as any).id;
                if (!counts[userId]) counts[userId] = { id: userId, first_name: (user as any).first_name || 'Onbekend', last_name: (user as any).last_name || '', count: 0 };
                counts[userId].count++;
            }
        });

        const result = Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 3);
        return z.array(TopStickerSchema).parse(result);
    } catch {
        return [];
    }
}

export async function setImpersonateToken(token: string) {
    const { isAuthorized } = await checkAdminAccess();
    if (!isAuthorized) throw new Error("Geen toegang");
    try {
        const directusUrl = process.env.DIRECTUS_SERVICE_URL || process.env.DIRECTUS_URL || "https://cms.salvemundi.nl";
        const testClient = createDirectus(directusUrl)
            .with(staticToken(token))
            .with(rest());

        // We fetch only basic fields first to ensure the token is valid.
        const user = await testClient.request(readMe({
            fields: ['id', 'first_name', 'last_name', 'email', 'avatar']
        } as any)) as unknown as DirectusUser;

        if (!user) {
            return { success: false, error: "Token is ongeldig." };
        }

        const cookieStore = await cookies();
        cookieStore.set(TEST_TOKEN_COOKIE, token, {
            path: '/',
            maxAge: 7 * 24 * 60 * 60,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
        });

        let impCommittees: any[] = [];
        try {
            const { rows } = await pool.query(
                `SELECT c.id, c.name, c.azure_group_id
                 FROM committee_members m 
                 JOIN committees c ON m.committee_id = c.id 
                 WHERE m.user_id = $1`,
                [user.id]
            );
            impCommittees = rows;
        } catch (e) {
            
        }

        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        const normallyAdmin = hasPermission(impCommittees, AdminResource.Intro);

        const info = {
            id: user.id,
            name: fullName || user.first_name || user.last_name || user.email || 'Onbekende gebruiker',
            email: user.email,
            avatar: user.avatar,
            committees: impCommittees.map(c => c.name),
            isNormallyAdmin: normallyAdmin
        };

        cookieStore.set(IMPERSONATION_INFO_COOKIE, Buffer.from(JSON.stringify(info)).toString('base64'), {
            path: '/',
            maxAge: 7 * 24 * 60 * 60,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
        });

        const sessionToken = cookieStore.get('better-auth.session-token')?.value;
        const redis = await getRedis();

        if (sessionToken) {
            await redis.del(`session:${sessionToken}`);
        }
        await redis.del(`impersonation:${token}`);

        revalidatePath('/beheer/impersonate');
        revalidatePath('/', 'layout');

        return {
            success: true,
            name: info.name
        };
    } catch (error) {
        return { success: false, error: "Deze token bestaat niet of is verlopen." };
    }
}

export async function clearImpersonateToken() {
    const { isAuthorized } = await checkAdminAccess();
    if (!isAuthorized) throw new Error("Unauthorized");

    const cookieStore = await cookies();
    cookieStore.delete(TEST_TOKEN_COOKIE);
    cookieStore.delete(IMPERSONATION_INFO_COOKIE);

    const sessionToken = cookieStore.get('better-auth.session-token')?.value;
    const redis = await getRedis();

    if (sessionToken) {
        await redis.del(`session:${sessionToken}`);
    }

    const testToken = cookieStore.get(TEST_TOKEN_COOKIE)?.value;
    if (testToken) {
        await redis.del(`impersonation:${testToken}`);
    }

    revalidatePath('/beheer/impersonate');
    revalidatePath('/', 'layout');
}
