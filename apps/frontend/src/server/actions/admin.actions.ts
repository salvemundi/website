'use server';

import { auth } from "@/server/auth/auth";
import { z } from "zod";
import { headers, cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSystemDirectus } from "@/lib/directus";
import { readMe, readItems, readUsers, aggregate } from "@directus/sdk";
import { type DbDirectusUser as DirectusUser } from "@salvemundi/validations/directus/schema";
import { query } from "@/lib/database";
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
import { getPermissions, hasPermission, type UserPermissions, type Committee } from '@/shared/lib/permissions';
import { getRedis } from "@/server/auth/redis-client";
import { getComputedCouponStatus } from "@/lib/coupons";
import { fetchUserMetadataDb, fetchUserCommitteesDb } from "./user-db.utils";
import { type EnrichedUser, type ImpersonationInfo } from "@/types/auth";
import { isSuperAdmin } from "@/lib/auth/auth-utils";

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

    const user = session.user as unknown as EnrichedUser;

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
            user.entra_id = metadata.entra_id;
        }
        if (committees) {
            user.committees = committees;
            const perms = getPermissions(committees);
            // user.isAdmin = perms.isAdmin;
            user.isICT = perms.isICT;

            // Store granular permissions in the user object for convenience
            Object.assign(user, perms);
        }
    } catch (e: unknown) {
        console.error('[AdminActions] Failed to enrich user metadata:', e);
    }

    if (!user.name && (user.first_name || user.last_name)) {
        user.name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    const impersonatedBy = (session as { impersonatedBy?: ImpersonationInfo }).impersonatedBy || null;

    const perms = getPermissions(user.committees || []);
    const isAuthorized = Object.values(perms).some(v => v === true);
    const isIct = perms.isICT || false;

    return {
        isAuthorized,
        user,
        isIct,
        impersonation: impersonatedBy ? {
            id: impersonatedBy.id,
            name: impersonatedBy.name,
            email: impersonatedBy.email,
            isNormallyAdmin: impersonatedBy.isNormallyAdmin,
            // For the UI, we might want to know who we are impersonating
            targetName: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            targetCommittees: user.committees?.map((c) => c.name) || []
        } : null
    };
}

export async function getDashboardPermissions(): Promise<UserPermissions & { isIct: boolean }> {
    const { isAuthorized, user, isIct } = await checkAdminAccess();
    if (!isAuthorized) {
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
            isIct: false
        };
    }

    const permissions = (user as unknown) as EnrichedUser;

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
        canAccessActivitiesView: permissions.canAccessActivitiesView || false,
        canAccessActivitiesEdit: permissions.canAccessActivitiesEdit || false,
        canAccessMail: permissions.canAccessMail || false,
        isLeader: permissions.isLeader || false,
        isICT: permissions.isICT || false,
        isIct: isIct || false
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

export async function getRecentActivities(): Promise<RecentActivity[]> {
    const { isAuthorized } = await checkAdminAccess();
    if (!isAuthorized) return [];
    
    return await getRecentActivitiesInternal();
}

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

export async function setImpersonateToken(token: string) {
    const { isAuthorized, user } = await checkAdminAccess();
    if (!isAuthorized || !isSuperAdmin(user?.committees)) throw new Error("Geen toegang: Alleen voor ICT en Bestuur.");
    try {
        const directusUrl = process.env.DIRECTUS_SERVICE_URL;
        if (!directusUrl) {
            return { success: false, error: "Directus service URL is niet geconfigureerd." };
        }
        const testClient = createDirectus(directusUrl)
            .with(staticToken(token))
            .with(rest());

        // We fetch only basic fields first to ensure the token is valid.
        const user = await testClient.request(readMe({
            fields: ['id', 'first_name', 'last_name', 'email', 'avatar']
        } as never)) as unknown as DirectusUser;

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

        let impCommittees: Committee[] = [];
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

        const sessionToken = cookieStore.get('better-auth.session-token')?.value || 
                           cookieStore.get('__Secure-better-auth.session-token')?.value;
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
    const cookieStore = await cookies();
    const testToken = cookieStore.get(TEST_TOKEN_COOKIE)?.value;

    if (!testToken) {
        return { success: false, error: "Geen actieve testsessie gevonden." };
    }

    // We verify that the current session is indeed being impersonated.
    // This ensures a 'random' user without an active impersonation can't trigger this logic.
    const { impersonation, user } = await checkAdminAccess();
    if (!impersonation || !isSuperAdmin(user?.committees)) {
        return { success: false, error: "Je bent niet in test modus of hebt onvoldoende rechten." };
    }

    cookieStore.delete(TEST_TOKEN_COOKIE);
    cookieStore.delete(IMPERSONATION_INFO_COOKIE);

    const sessionToken = cookieStore.get('better-auth.session-token')?.value || 
                       cookieStore.get('__Secure-better-auth.session-token')?.value;
    const redis = await getRedis();

    if (sessionToken) {
        await redis.del(`session:${sessionToken}`);
    }

    if (testToken) {
        await redis.del(`impersonation:${testToken}`);
    }

    revalidatePath('/beheer/impersonate');
    revalidatePath('/', 'layout');
}
