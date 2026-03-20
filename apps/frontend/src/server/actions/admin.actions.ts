'use server';

import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { 
    DashboardStatsSchema, type DashboardStats,
    RecentActivitySchema, type RecentActivity,
    TopStickerSchema, type TopSticker,
    BirthdaySchema, type Birthday
} from "@salvemundi/validations";

import { directus } from "@/lib/directus";
import { readItems, readUsers, aggregate } from "@directus/sdk";

// Removed redundant directusFetch in favor of Directus SDK.

export async function checkAdminAccess() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || !session.user) {
        return { isAuthorized: false, user: null, isIct: false };
    }

    type CommitteeMeta = { name?: string | null };
    const user = session.user as { committees?: CommitteeMeta[], first_name?: string };
    const committees = user.committees ?? [];
    const isIct = committees.some((c) => c.name?.toLowerCase().includes('ict'));
    const isBestuur = committees.some((c) => c.name?.toLowerCase().includes('bestuur'));
    const isAdmin = isIct || isBestuur;

    return { isAuthorized: isAdmin, user, isIct };
}

export async function getDashboardPermissions() {
    const { isAuthorized, user, isIct } = await checkAdminAccess();
    if (!isAuthorized) return { canAccessIntro: false, canAccessReis: false, canAccessLogging: false, canAccessSync: false, canAccessCoupons: false, canAccessPermissions: false };

    // Placeholder until settings validation is synced properly, using legacy fallbacks
    const committees = (user as any).committees || [];
    const names = committees.map((c: any) => (c.name || '').toLowerCase());
    const hasHighPrivilege = names.some((n: string) => n.includes('ict') || n.includes('bestuur') || n.includes('kandi'));
    
    return {
        canAccessIntro: hasHighPrivilege, // replace with real check if needed
        canAccessReis: hasHighPrivilege,
        canAccessLogging: hasHighPrivilege,
        canAccessSync: hasHighPrivilege,
        canAccessCoupons: hasHighPrivilege || names.some((n: string) => n.includes('kas')),
        canAccessPermissions: names.some((n: string) => n.includes('ict') || n.includes('bestuur')),
        isIct
    };
}

export async function getDashboardStats(): Promise<DashboardStats> {
    await checkAdminAccess();
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
            directus.request(aggregate('directus_users', { aggregate: { count: '*' }, query: { filter: { status: { _eq: 'active' } } } })).catch(() => [{ count: 0 }]),
            directus.request(aggregate('events', { aggregate: { count: '*' }, query: { filter: { event_date: { _gte: today } } } })).catch(() => [{ count: 0 }]),
            directus.request(aggregate('event_signups', { aggregate: { count: '*' }, query: { filter: { event_id: { event_date: { _gte: today } } } } })).catch(() => [{ count: 0 }]),
            directus.request(aggregate('intro_signups', { aggregate: { count: '*' } })).catch(() => [{ count: 0 }]),
            directus.request(aggregate('coupons', { aggregate: { count: '*' }, query: { filter: { is_active: { _eq: true } } } })).catch(() => [{ count: 0 }]),
            directus.request(aggregate('system_logs', { aggregate: { count: '*' }, query: { filter: { level: { _eq: 'error' } } } })).catch(() => [{ count: 0 }]),
            directus.request(aggregate('stickers', { aggregate: { count: '*' } })).catch(() => [{ count: 0 }]),
            directus.request(aggregate('stickers', { aggregate: { count: '*' }, query: { filter: { date_created: { _gte: lastWeek } } } })).catch(() => [{ count: 0 }]),
            directus.request(readItems('pub_crawl_events', { fields: ['id', 'date'], sort: ['-date'] })).catch(() => []),
            directus.request(readItems('trips', { fields: ['id', 'start_date', 'end_date', 'event_date'], filter: { status: { _eq: 'published' } }, sort: ['-start_date'] })).catch(() => [])
        ]);
        
        // Calculate Pub Crawl signups for the upcoming/latest event
        let pubCrawlSignups = 0;
        const upcomingPubCrawl = pubCrawlEvents.find((e: any) => new Date(e.date) >= now) || pubCrawlEvents[0];
        if (upcomingPubCrawl) {
            const pcSignups: any = await directus.request(aggregate('pub_crawl_signups' as any, { aggregate: { count: '*' }, query: { filter: { pub_crawl_event_id: { _eq: upcomingPubCrawl.id } } } })).catch(() => [{ count: 0 }]);
            pubCrawlSignups = Number(pcSignups?.[0]?.count || 0);
        }

        // Calculate Reis signups for the active trip
        let reisSignups = 0;
        const activeTrip = trips.find((t: any) => {
            const dateStr = t.end_date || t.event_date || t.start_date;
            return dateStr && new Date(dateStr) >= now;
        }) || trips[0];
        
        if (activeTrip) {
            const tSignups: any = await directus.request(aggregate('trip_signups' as any, { aggregate: { count: '*' }, query: { filter: { trip_id: { _eq: activeTrip.id }, status: { _neq: 'cancelled' } } } })).catch(() => [{ count: 0 }]);
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
            totalCoupons: Number(couponsCount?.[0]?.count || 0),
            pubCrawlSignups,
            reisSignups,
            stickerGrowthRate
        };

        return DashboardStatsSchema.parse(stats);
    } catch (error) {
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
    await checkAdminAccess();
    try {
        const users = await directus.request(readUsers({ fields: ['id', 'first_name', 'last_name', 'date_of_birth'], filter: { date_of_birth: { _nnull: true } }, limit: -1 }));
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
    await checkAdminAccess();
    try {
        const events = await directus.request(readItems('events', { fields: ['id', 'name', 'event_date'], sort: ['-event_date'], limit: 4 }));
        const eventsWithSignups = await Promise.all(
            events.map(async (ev) => {
                const signups: any = await directus.request(aggregate('event_signups' as any, { aggregate: { count: '*' }, query: { filter: { event_id: { _eq: ev.id } } } })).catch(() => [{ count: 0 }]);
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
    await checkAdminAccess();
    try {
        const stickers = await directus.request(readItems('stickers', { fields: ['user_created.id', 'user_created.first_name', 'user_created.last_name'], limit: -1 }));
        const counts: Record<string, TopSticker> = {};
        
        stickers.forEach(s => {
            const user = s.user_created;
            if (user && user.id) {
                if (!counts[user.id]) counts[user.id] = { id: user.id, first_name: user.first_name || 'Onbekend', last_name: user.last_name || '', count: 0 };
                counts[user.id].count++;
            }
        });
        
        const result = Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 3);
        return z.array(TopStickerSchema).parse(result);
    } catch {
        return [];
    }
}
