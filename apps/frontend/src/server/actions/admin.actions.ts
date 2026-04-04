'use server';

import { auth } from "@/server/auth/auth";
import { z } from "zod";
import { headers, cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSystemDirectus } from "@/lib/directus";
import { readMe, readItems, readUsers, aggregate } from "@directus/sdk";
import { 
    type DbDirectusUser as DirectusUser,
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
    USER_BASIC_FIELDS as USER_ID_FIELDS, // Fallback if missing, or check fields.ts
    DashboardStats,
    DashboardStatsSchema,
    Birthday,
    BirthdaySchema,
    RecentActivity,
    RecentActivitySchema,
    TopSticker,
    TopStickerSchema
} from "@salvemundi/validations";
import { Pool } from "pg";
import { createDirectus, staticToken, rest } from "@directus/sdk";
import { AdminResource } from '@/shared/lib/permissions-config';
import { getPermissions, hasPermission, type UserPermissions } from '@/shared/lib/permissions';
import { getRedis } from "@/server/auth/redis-client";
import { getCoupons } from "@/server/queries/admin-coupon.queries";
import { getComputedCouponStatus } from "@/lib/coupon-utils";

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
            // Add any missing banner-specific fields if needed
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
        isIct
    };
}

export async function getDashboardStats(): Promise<DashboardStats> {
    const { isAuthorized } = await checkAdminAccess();
    if (!isAuthorized) throw new Error("Geen toegang");
    try {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [
            membersCount,
            eventsCount,
            signupsCount,
            introCount,
            couponsCount,
            activityCount,
            allStickersCount,
            recentStickersCount,
            pubCrawlEvents,
            trips
        ] = await Promise.all([
            getSystemDirectus().request(aggregate('directus_users', { 
                aggregate: { count: '*' }, 
                query: { 
                    filter: { 
                        _and: [
                            { status: { _eq: 'active' } },
                            { membership_expiry: { _gte: today } }
                        ]
                    } 
                } 
            })).catch(e => { console.error("Stats: users fail", e instanceof Error ? e.message : e); return [{ count: 0 }]; }),
            getSystemDirectus().request(aggregate('events', { aggregate: { count: '*' }, query: { filter: { event_date: { _gte: today } } } })).catch(e => { console.error("Stats: events fail", e instanceof Error ? e.message : e); return [{ count: 0 }]; }),
            getSystemDirectus().request(aggregate('event_signups', { aggregate: { count: '*' }, query: { filter: { event_id: { event_date: { _gte: today } } } } })).catch(e => { console.error("Stats: signups fail", e instanceof Error ? e.message : e); return [{ count: 0 }]; }),
            getSystemDirectus().request(aggregate('intro_signups', { aggregate: { count: '*' } })).catch(e => { console.error("Stats: intro fail", e instanceof Error ? e.message : e); return [{ count: 0 }]; }),
            getCoupons().catch(e => { console.error("Stats: coupons fail", e instanceof Error ? e.message : e); return []; }),
            getSystemDirectus().request(aggregate('system_logs' as any, { aggregate: { count: '*' }, query: { filter: { status: { _eq: 'FAILED' } } } })).catch(e => { console.error("Stats: logs fail", e instanceof Error ? e.message : e); return [{ count: 0 }]; }),
            getSystemDirectus().request(aggregate('Stickers' as any, { aggregate: { count: '*' } })).catch(e => { console.error("Stats: Stickers fail", e instanceof Error ? e.message : e); return [{ count: 0 }]; }),
            getSystemDirectus().request(aggregate('Stickers' as any, { aggregate: { count: '*' }, query: { filter: { date_created: { _gte: lastWeek } } } })).catch(e => { console.error("Stats: recent Stickers fail", e instanceof Error ? e.message : e); return [{ count: 0 }]; }),
            getSystemDirectus().request(readItems('pub_crawl_events', { fields: [...PUB_CRAWL_EVENT_FIELDS], sort: ['-date'] })).catch(() => []),
            getSystemDirectus().request(readItems('trips', { fields: TRIP_FIELDS, sort: ['-start_date'] })).catch(() => [])
        ]);

        let pubCrawlSignups = 0;
        const upcomingPubCrawl = Array.isArray(pubCrawlEvents) ? (pubCrawlEvents.find((e: any) => new Date(e.date) >= now) || pubCrawlEvents[0]) : null;
        if (upcomingPubCrawl?.id) {
            const pcSignups: any = await getSystemDirectus().request(aggregate('pub_crawl_signups' as any, { aggregate: { count: '*' }, query: { filter: { pub_crawl_event_id: { _eq: upcomingPubCrawl.id } } } })).catch(() => [{ count: 0 }]);
            pubCrawlSignups = Number(pcSignups?.[0]?.count || 0);
        }

        let reisSignups = 0;
        const activeTrip = Array.isArray(trips) ? (trips.find((t: any) => {
            const dateStr = t.end_date || t.event_date || t.start_date;
            return dateStr && new Date(dateStr) >= now;
        }) || trips[0]) : null;

        if (activeTrip?.id) {
            const tSignups: any = await getSystemDirectus().request(aggregate('trip_signups' as any, { aggregate: { count: '*' }, query: { filter: { trip_id: { _eq: activeTrip.id }, status: { _neq: 'cancelled' } } } })).catch(() => [{ count: 0 }]);
            reisSignups = Number(tSignups?.[0]?.count || 0);
        }

        const totalStickers = Number(allStickersCount?.[0]?.count || 0);
        const recentStickers = Number(recentStickersCount?.[0]?.count || 0);
        const stickerGrowthRate = totalStickers > 0 ? Math.round((recentStickers / totalStickers) * 100) : 0;

        const stats = {
            totalMembers: Number(membersCount?.[0]?.count || 0),
            upcomingEventsCount: Number(eventsCount?.[0]?.count || 0),
            pendingSignupsCount: Number(signupsCount?.[0]?.count || 0),
            systemErrors: Number(activityCount?.[0]?.count || 0),
            introSignups: Number(introCount?.[0]?.count || 0),
            totalCoupons: (couponsCount as any[]).filter(c => getComputedCouponStatus(c).type === 'active').length,
            pubCrawlSignups,
            reisSignups,
            stickerGrowthRate
        };

        return DashboardStatsSchema.parse(stats);
    } catch (error: any) {
        console.error("Dashboard stats error:", error);
        return {
            totalMembers: 0,
            upcomingEventsCount: 0,
            pendingSignupsCount: 0,
            systemErrors: 0,
            introSignups: 0,
            totalCoupons: 0,
            pubCrawlSignups: 0,
            reisSignups: 0,
            stickerGrowthRate: 0
        };
    }
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
    try {
        const events = await getSystemDirectus().request(readItems('events', { fields: [...EVENT_FIELDS], sort: ['-event_date'], limit: 4 }));
        const eventsWithSignups = await Promise.all(
            events.map(async (ev: any) => {
                const signups: any = await getSystemDirectus().request(aggregate('event_signups' as any, { aggregate: { count: '*' }, query: { filter: { event_id: { _eq: ev.id } } } })).catch(() => [{ count: 0 }]);
                return {
                    id: ev.id,
                    name: ev.name,
                    event_date: ev.event_date,
                    signups: Number(signups?.[0]?.count || 0)
                };
            })
        );
        return z.array(RecentActivitySchema).parse(eventsWithSignups);
    } catch {
        return [];
    }
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
        const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL || "https://cms.salvemundi.nl";
        const testClient = createDirectus(directusUrl)
            .with(staticToken(token))
            .with(rest());
            
        const user = await testClient.request(readMe({ 
            fields: [...USER_ID_FIELDS, 'first_name', 'last_name', 'email', 'avatar', { role: ['name'] }] 
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
            console.error("[setImpersonateToken] Failed to fetch committees:", e);
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